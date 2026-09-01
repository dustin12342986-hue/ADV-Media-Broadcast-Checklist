#!/usr/bin/env node
/* ===========================================================================
   ULX-D BRIDGE — ADV Media
   ===========================================================================

   WHAT THIS IS

   Shure ULX-D receivers speak a documented ASCII protocol over a raw TCP
   socket on port 2202. This connects to them, listens, and posts what it hears
   to the Cloudflare Worker so the app can show it to A1.

   WHY A BRIDGE AT ALL

   A browser cannot open a raw TCP socket. That is the whole reason this file
   exists — not because the protocol is hard.

   THE GOOD PART

   Shure's documentation is explicit that the receiver SENDS a REPORT whenever
   a parameter changes, and that it is not necessary to constantly query
   battery or interference. So this opens a socket, asks once for everything,
   and then listens. That means near-instant updates and almost no traffic —
   a far better deal than polling, and better than anything Clear-Com offers.

   WHAT IT READS

     BATT_RUN_TIME   minutes of battery left, per channel. The one that matters.
     BATT_BARS       0-5, as shown on the receiver
     TX_TYPE         handheld / bodypack / none
     CHAN_NAME       whatever the channel is named on the receiver
     RF_LEVEL        RF strength
     AUDIO_LEVEL     audio present or not
     TX_MUTE_STATUS  muted or not
     RX_RF_PWR       transmitter power

   RUNNING IT

     node ulxd-bridge.js --probe          one-shot, prints what it finds
     node ulxd-bridge.js                  runs continuously

   Environment:
     ULXD_HOSTS    comma-separated receiver IPs, e.g. 10.0.1.20,10.0.1.21
     WORKER_URL    https://<your-worker>.workers.dev
     BRIDGE_KEY    shared secret, must match the Worker
     POST_SECONDS  how often to post (default 5)

   Node 18+, no dependencies, same as the TriCaster bridge. Runs on the same
   PC — it is already on the production LAN.
   =========================================================================== */

"use strict";

const net = require("net");

const CONFIG = {
  hosts: (process.env.ULXD_HOSTS || "").split(",").map((h) => h.trim()).filter(Boolean),
  workerUrl: process.env.WORKER_URL || "",
  bridgeKey: process.env.BRIDGE_KEY || "",
  postSeconds: parseInt(process.env.POST_SECONDS || "5", 10),
  port: 2202,
};

const PROBE = process.argv.includes("--probe");

// Channel 0 means "all channels" on a dual or quad receiver, so one GET ALL
// per receiver is enough to prime everything.
const PRIME = "< GET 0 ALL >";

// Parameters worth surfacing. Anything else the receiver reports is ignored
// rather than stored — this is a panel for A1, not a diagnostic dump.
const KEEP = new Set([
  "BATT_RUN_TIME", "BATT_BARS", "BATT_CHARGE", "BATT_TYPE",
  "CHAN_NAME", "TX_TYPE", "RF_LEVEL", "AUDIO_LEVEL",
  "TX_MUTE_STATUS", "RX_RF_PWR", "GROUP_CHAN", "FREQUENCY",
]);

const state = {};   // state[host][channel][param] = value

function note(...a) { console.log(new Date().toISOString(), ...a); }

// Replies look like: < REP 2 BATT_RUN_TIME 00214 >
// Values are fixed-width and space padded, so everything gets trimmed.
const LINE = /<\s*REP\s+(\d+)\s+([A-Z_0-9]+)\s+([^>]*)>/g;

function ingest(host, chunk) {
  let m;
  while ((m = LINE.exec(chunk))) {
    const [, chan, param, rawVal] = m;
    if (!KEEP.has(param)) continue;
    const val = rawVal.trim();
    state[host] = state[host] || {};
    state[host][chan] = state[host][chan] || {};
    state[host][chan][param] = val;
  }
}

function connect(host) {
  const sock = new net.Socket();
  let buf = "";

  sock.setKeepAlive(true, 15000);

  sock.connect(CONFIG.port, host, () => {
    note(`connected ${host}:${CONFIG.port}`);
    sock.write(PRIME + "\r\n");
  });

  sock.on("data", (d) => {
    buf += d.toString("ascii");
    // Keep the tail in case a reply is split across packets.
    const lastClose = buf.lastIndexOf(">");
    if (lastClose === -1) return;
    ingest(host, buf.slice(0, lastClose + 1));
    buf = buf.slice(lastClose + 1);
    if (buf.length > 8192) buf = "";        // runaway guard
  });

  sock.on("error", (e) => note(`error ${host}: ${e.message}`));

  sock.on("close", () => {
    if (PROBE) return;
    // Reconnect rather than exit. A receiver power-cycled mid-show should heal
    // on its own without someone remembering to restart this.
    note(`closed ${host}, retrying in 5s`);
    setTimeout(() => connect(host), 5000);
  });

  return sock;
}

// A channel with no transmitter reports UNKN, which is not the same as a flat
// battery. Those two must never look alike on a screen.
function shape() {
  const channels = [];
  Object.keys(state).forEach((host) => {
    Object.keys(state[host]).forEach((chan) => {
      if (chan === "0") return;                    // 0 is the "all" alias
      const c = state[host][chan];
      const present = c.TX_TYPE && c.TX_TYPE !== "UNKN";
      const mins = parseInt(c.BATT_RUN_TIME, 10);
      channels.push({
        host,
        channel: Number(chan),
        name: (c.CHAN_NAME || "").trim() || `Ch ${chan}`,
        txType: present ? c.TX_TYPE : null,
        present: !!present,
        batteryMinutes: Number.isFinite(mins) && mins < 60000 ? mins : null,
        batteryBars: c.BATT_BARS && c.BATT_BARS !== "UNKN" ? Number(c.BATT_BARS) : null,
        rf: c.RF_LEVEL && c.RF_LEVEL !== "UNKN" ? Number(c.RF_LEVEL) : null,
        audio: c.AUDIO_LEVEL && c.AUDIO_LEVEL !== "UNKN" ? Number(c.AUDIO_LEVEL) : null,
        muted: c.TX_MUTE_STATUS === "ON" ? true : c.TX_MUTE_STATUS === "OFF" ? false : null,
        frequency: c.FREQUENCY ? (Number(c.FREQUENCY) / 1000).toFixed(3) : null,
      });
    });
  });
  channels.sort((a, b) => a.host.localeCompare(b.host) || a.channel - b.channel);
  return { ts: Date.now(), online: true, channels };
}

async function post() {
  const body = shape();
  if (!body.channels.length) return;
  if (!CONFIG.workerUrl || !CONFIG.bridgeKey) return;
  try {
    const res = await fetch(`${CONFIG.workerUrl}/api/ulxd/state`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bridge-key": CONFIG.bridgeKey },
      body: JSON.stringify(body),
    });
    if (!res.ok) note(`post failed: HTTP ${res.status}`);
  } catch (e) {
    // A failed post is not fatal. The receivers keep reporting and the next
    // post carries the current picture; the app shows stale-as-offline.
    note(`post error: ${e.message}`);
  }
}

function main() {
  if (!CONFIG.hosts.length) {
    console.error("Set ULXD_HOSTS to your receiver IPs, comma separated.");
    console.error("Find them on the receiver: Menu > Network > IP address.");
    process.exit(1);
  }

  CONFIG.hosts.forEach(connect);

  if (PROBE) {
    setTimeout(() => {
      const out = shape();
      console.log("\n--- what the receivers reported ---\n");
      if (!out.channels.length) {
        console.log("Nothing. Check the IPs, and that port 2202 is reachable:");
        console.log(`   nc -vz ${CONFIG.hosts[0]} 2202`);
      }
      out.channels.forEach((c) => {
        console.log(
          `${c.host} ch${c.channel}  ${String(c.name).padEnd(10)} ` +
          (c.present
            ? `${String(c.txType).padEnd(9)} ` +
              `batt ${c.batteryMinutes != null ? String(c.batteryMinutes) + " min" : "—"} ` +
              `(${c.batteryBars != null ? c.batteryBars + "/5" : "—"})  ` +
              `rf ${c.rf ?? "—"}  ${c.muted ? "MUTED" : ""}`
            : "no transmitter")
        );
      });
      console.log("\nRaw state:\n", JSON.stringify(state, null, 2));
      process.exit(0);
    }, 3000);
    return;
  }

  setInterval(post, CONFIG.postSeconds * 1000);
  note(`bridging ${CONFIG.hosts.length} receiver(s), posting every ${CONFIG.postSeconds}s`);
}

main();
