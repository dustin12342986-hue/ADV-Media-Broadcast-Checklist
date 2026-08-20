/* The real page, real files, real load order. */
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
let pass=0,fail=0;
const ck=(n,c,d="")=>{c?pass++:fail++;console.log((c?"PASS":"FAIL")+" - "+n+(d?"   ["+d+"]":""));};

const files = {
  "blue-bonnet-kit.js": readFileSync("blue-bonnet-kit.js","utf8"),
  "blue-bonnet-assistant.js": readFileSync("blue-bonnet-assistant.js","utf8"),
  "blue-bonnet-widget.js": readFileSync("blue-bonnet-widget.js","utf8"),
};
const html = readFileSync("adv-media-teams.html","utf8");

// Serve the page's own script tags in the order the page declares them.
const tags = [...html.matchAll(/<script src="(blue-bonnet[^"]+)"/g)].map(m=>m[1]);
const dom = new JSDOM("<!doctype html><meta charset=utf-8><body></body>",
  {url:"https://advmediateams.example.com/", runScripts:"dangerously"});
const w = dom.window;
const hits = [];
w.fetch = async (url) => {
  hits.push(String(url));
  if (/gateway/.test(String(url))) return { ok:true, status:200, json: async () => ({
    choices:[{message:{content:"Call time is 2 hours before kickoff."}}], bb:{provider:"groq"} }) };
  return { ok:true, status:200, json: async () => ({ content:[{type:"text",text:"anthropic"}] }) };
};
tags.forEach((t) => { const el = w.document.createElement("script");
  el.textContent = files[t]; w.document.body.appendChild(el); });

console.log("\n-- the page loads all three, in order --");
ck("page declares kit, assistant, widget", tags.join(",") === "blue-bonnet-kit.js,blue-bonnet-assistant.js,blue-bonnet-widget.js", tags.join(" -> "));
ck("kit is live", typeof w.BBKit === "object" && !!w.BBKit);
ck("memory engine is live", !!w.BlueBonnet);
ck("widget rendered its bubble", !!w.document.getElementById("bb-bubble"));

console.log("\n-- and the whole chain works end to end --");
w.document.getElementById("bb-input").value = "camera 2 has no picture";
await w.__bbTest_send();
ck("it went to the gateway first", /gateway/.test(hits[0]||""), hits[0]||"none");
ck("Anthropic was never needed", !hits.some(u=>/bluebonnetproxy/.test(u)));
ck("an answer reached the crew", /2 hours before kickoff/.test(w.document.getElementById("bb-body").textContent));
ck("memory was written", !!w.localStorage.getItem("advmedia-crew-bluebonnet"));
ck("dreaming stayed off", w.BlueBonnet.dreamingEnabled() === false);

console.log("\n"+pass+" passed, "+fail+" failed\n");
process.exit(fail?1:0);
