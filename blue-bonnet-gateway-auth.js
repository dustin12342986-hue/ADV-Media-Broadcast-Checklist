/* ===========================================================================
   BLUE BONNET GATEWAY — AUTH GUARD
   ===========================================================================

   WHAT THIS REPLACES

   The gateway used to be protected by a shared key that lived in
   blue-bonnet-widget.js. That file is public JavaScript on GitHub Pages, so
   the key was readable by anyone who opened View Source. Anyone who found it
   could spend your model budget from anywhere.

   This verifies the crew member's Firebase login instead. They already sign
   in with Google to use the app, so nothing changes for them — but the thing
   the browser sends is now a short-lived token tied to one person, not a
   permanent password shared by everyone.

   HOW TO INSTALL

   1. Paste this whole file at the top of your existing gateway worker.
   2. At the very start of your fetch handler, add:

        const gate = await requireAuth(request, env);
        if (gate.response) return gate.response;    // rejected
        // gate.uid and gate.email identify the caller from here on

   3. In the Cloudflare dashboard, set these Worker variables:
        FIREBASE_PROJECT_ID = crowley-football
        ALLOWED_ORIGINS     = https://dustin12342986-hue.github.io
      (ALLOWED_ORIGINS is comma-separated if you ever need more than one.)

   4. Deploy, confirm the app still answers, THEN delete the old shared key
      from wherever it's configured. Do it in that order — if you remove the
      key first and something's wrong, the crew has no assistant.

   WHAT THIS DOES AND DOESN'T STOP

   Stops: anyone who reads your public source and tries to use the gateway.
   That's the actual hole, and it closes it.

   Doesn't stop: a crew member who is signed in from doing something silly
   with their own account. Their uid is in every request, so it's traceable,
   and the rate limit below caps the damage. If you ever need to cut someone
   off, the block list is the fastest lever.

   The origin check is a cheap first filter, not security — an Origin header
   is trivial to forge outside a browser. The token check is the real gate.
   =========================================================================== */

/* Google publishes the signing certificates here. They rotate, so the
   response is cached for as long as Google's own Cache-Control says. */
const FIREBASE_CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache = { keys: null, expiresAt: 0 };

async function getSigningCerts() {
  const now = Date.now();
  if (certCache.keys && now < certCache.expiresAt) return certCache.keys;

  const res = await fetch(FIREBASE_CERT_URL);
  if (!res.ok) throw new Error("couldn't fetch Firebase signing certs");
  const keys = await res.json();

  // Respect Google's own max-age rather than picking a number.
  let ttl = 3600;
  const cc = res.headers.get("cache-control") || "";
  const m = cc.match(/max-age=(\d+)/);
  if (m) ttl = parseInt(m[1], 10);
  certCache = { keys, expiresAt: now + ttl * 1000 };
  return keys;
}

function b64ToBytes(b64) {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* WebCrypto imports SPKI, but Firebase publishes full X.509 certificates.
   The public key sits inside the certificate as a SubjectPublicKeyInfo
   block, so it has to be cut out of the DER.

   Rather than write a general ASN.1 parser, locate the RSA algorithm
   identifier — OID 1.2.840.113549.1.1.1, which encodes to the byte string
   below — and walk back to the start of the SEQUENCE that contains it. That
   SEQUENCE is the SPKI. */
const RSA_OID = [0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];

function derLengthAt(der, i) {
  // Returns { length, headerBytes } for the DER length starting at i.
  const first = der[i];
  if (first < 0x80) return { length: first, headerBytes: 1 };
  const count = first & 0x7f;
  let length = 0;
  for (let k = 1; k <= count; k++) length = (length << 8) | der[i + k];
  return { length, headerBytes: 1 + count };
}

function extractSpki(certDer) {
  for (let i = 0; i + RSA_OID.length < certDer.length; i++) {
    let match = true;
    for (let k = 0; k < RSA_OID.length; k++) {
      if (certDer[i + k] !== RSA_OID[k]) { match = false; break; }
    }
    if (!match) continue;

    // The OID sits inside AlgorithmIdentifier, which sits inside SPKI.
    // Walk backwards for the two enclosing SEQUENCE headers (0x30) and take
    // the outer one whose declared length actually reaches past the OID.
    for (let start = i - 1; start >= 0 && start > i - 24; start--) {
      if (certDer[start] !== 0x30) continue;
      const { length, headerBytes } = derLengthAt(certDer, start + 1);
      const end = start + 1 + headerBytes + length;
      // The SPKI must contain the OID and the BIT STRING that follows it.
      if (end > i + RSA_OID.length + 20 && end <= certDer.length) {
        return certDer.slice(start, end);
      }
    }
  }
  throw new Error("couldn't find the public key inside the certificate");
}

function pemToDer(pem) {
  const body = pem
    .replace(/-----BEGIN CERTIFICATE-----/, "")
    .replace(/-----END CERTIFICATE-----/, "")
    .replace(/\s+/g, "");
  return b64ToBytes(body);
}

async function importCertPublicKey(pem) {
  const spki = extractSpki(pemToDer(pem));
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/* Full verification, per Firebase's documented rules: RS256, a kid that
   matches a published cert, correct issuer and audience for this project,
   and not expired. */
async function verifyFirebaseToken(idToken, projectId) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("malformed token");

  const header = JSON.parse(new TextDecoder().decode(b64ToBytes(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(b64ToBytes(parts[1])));

  if (header.alg !== "RS256") throw new Error("wrong signing algorithm");
  if (!header.kid) throw new Error("token has no key id");

  const certs = await getSigningCerts();
  const pem = certs[header.kid];
  if (!pem) throw new Error("token signed by an unknown key");

  const key = await importCertPublicKey(pem);
  const signed = new TextEncoder().encode(parts[0] + "." + parts[1]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5", key, b64ToBytes(parts[2]), signed
  );
  if (!ok) throw new Error("bad signature");

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) throw new Error("token expired");
  if (payload.iat > now + 300) throw new Error("token issued in the future");
  if (payload.aud !== projectId) throw new Error("token is for another project");
  if (payload.iss !== "https://securetoken.google.com/" + projectId) {
    throw new Error("wrong issuer");
  }
  if (!payload.sub) throw new Error("token has no subject");

  return { uid: payload.sub, email: payload.email || "" };
}

/* A cap so one signed-in account can't run up a bill, deliberately or by a
   runaway loop. In-memory, so it resets when the worker instance recycles
   and isn't shared across edge locations — a speed bump, not a quota. Move
   this to KV or Durable Objects if it ever needs to be exact. */
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;
const rateBuckets = new Map();

function rateLimited(uid) {
  const now = Date.now();
  const hits = (rateBuckets.get(uid) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateBuckets.set(uid, hits);
  if (rateBuckets.size > 5000) rateBuckets.clear();  // crude, bounded
  return hits.length > RATE_MAX;
}

/* Accounts that should be refused regardless of a valid login. */
const BLOCKED_UIDS = [];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, x-app, x-session",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function deny(status, message, origin) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(origin) },
  });
}

/* Call this first in your fetch handler.
   Returns { response } when the request should be rejected, or
   { uid, email, origin } when it should proceed. */
async function requireAuth(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (request.method === "OPTIONS") {
    return { response: new Response(null, { status: 204, headers: corsHeaders(origin) }) };
  }

  if (allowed.length && origin && !allowed.includes(origin)) {
    return { response: deny(403, "This origin isn't allowed to use the gateway.", origin) };
  }

  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { response: deny(401, "Sign in to use the assistant.", origin) };
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return { response: deny(500, "Gateway is missing FIREBASE_PROJECT_ID.", origin) };
  }

  let user;
  try {
    user = await verifyFirebaseToken(token, projectId);
  } catch (e) {
    // Deliberately vague to the caller, specific in the logs.
    console.log("gateway auth rejected:", e && e.message);
    return { response: deny(401, "Your session isn't valid. Sign out and back in.", origin) };
  }

  if (BLOCKED_UIDS.includes(user.uid)) {
    return { response: deny(403, "This account can't use the assistant.", origin) };
  }

  if (rateLimited(user.uid)) {
    return { response: deny(429, "Too many requests. Wait a minute and try again.", origin) };
  }

  return { uid: user.uid, email: user.email, origin };
}
