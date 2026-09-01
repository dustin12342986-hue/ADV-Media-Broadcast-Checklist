/* ===========================================================================
   ULX-D ROUTES — paste into the existing Cloudflare Worker
   ===========================================================================
   Needs the same KV binding the TriCaster routes use (STATE) and the same
   BRIDGE_KEY secret.

   GET  /api/ulxd/state   → what the bridge last posted, or {online:false}
   POST /api/ulxd/state   → bridge only, requires x-bridge-key

   The KV entry expires after 30 seconds, so a bridge that dies reads as
   offline rather than showing a battery level from twenty minutes ago. That
   distinction matters: a stale "214 min" is worse than an honest "not
   reporting", because A1 will act on it.
   =========================================================================== */

export async function handleUlxd(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/ulxd/state")) return null;

  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, x-bridge-key",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  if (request.method === "POST") {
    if (request.headers.get("x-bridge-key") !== env.BRIDGE_KEY) {
      return new Response("no", { status: 401, headers: cors });
    }
    const body = await request.text();
    await env.STATE.put("ulxd", body, { expirationTtl: 30 });
    return new Response("ok", { headers: cors });
  }

  const raw = await env.STATE.get("ulxd");
  const payload = raw || JSON.stringify({ online: false, ts: null, channels: [] });
  return new Response(payload, {
    headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
  });
}
