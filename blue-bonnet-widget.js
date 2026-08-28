/* ===========================================================
   BLUE BONNET — CISD Broadcast Crew Assistant Widget
   Drop this file into your repo and add one line to any page:
     <script src="blue-bonnet-widget.js"></script>
   (right before the closing </body> tag)

   SETUP — two things to fill in below:
   1. PROXY_URL  — the URL of your Cloudflare Worker proxy
                    (see blue-bonnet-worker.js + setup steps)
   2. CREW_KB    — edit this any time the schedule/roster changes.
                    No rebuild needed, just edit + commit + push.
   =========================================================== */

(function () {
  // 1) SET THIS to your deployed worker URL, e.g.:
  // "https://blue-bonnet-proxy.YOUR-SUBDOMAIN.workers.dev"
  const PROXY_URL = "https://bluebonnetproxy.dustin12342986.workers.dev";

  // ---- Memory ------------------------------------------------------
  // blue-bonnet-assistant.js brings the memory architecture: what a crew
  // member told you, what keeps coming up, what is still unfinished. It
  // does NOT bring the Blue Bonnet identity here \u2014 this is a crew tool and
  // it keeps its own voice, so baseSystem below stays in charge.
  //
  // If the script isn't loaded the widget works exactly as it did before,
  // without memory. Nothing here is load-bearing for answering a question.
  function memoryReady() { return typeof BlueBonnet !== "undefined" && !!BlueBonnet; }

  // ---- Routing -----------------------------------------------------
  // GATEWAY FIRST. The gateway (Groq / Gemini) is fast and free; Anthropic
  // is the reserve. That order matters here more than anywhere: this tool
  // is used by a whole crew on game night, and when the Anthropic balance
  // hit zero the widget simply died \u2014 there was no second path at all.
  //
  // The kit's own ask() is Anthropic-first because it needs tools. This
  // widget has no tools, so it calls the two providers directly in the
  // order that suits it.
  const GATEWAY_URL = "https://blue-bonnet-gateway.dustin12342986.workers.dev";
  const GATEWAY_KEY = "e368f85d1ce08cb81e252c1f9e31294b7d8dc88cf295be38";

  function kitReady() {
    return typeof BBKit !== "undefined" && !!BBKit && typeof BBKit.gatewayAsk === "function";
  }
  if (kitReady()) {
    BBKit.configure({
      gatewayUrl: GATEWAY_URL,
      gatewayKey: GATEWAY_KEY,
      anthropicProxyUrl: PROXY_URL,
      app: "adv-crew",
    });
  }

  // The gateway speaks OpenAI format, so the block array has to be flattened
  // into one system message. That is a format conversion, not a shortcut \u2014
  // caching only exists on the Anthropic path anyway.
  function flatten(system) {
    if (typeof system === "string") return system;
    if (kitReady() && typeof BBKit.systemToText === "function") return BBKit.systemToText(system);
    return (system || []).map((b) => (b && b.text) || "").join("\n\n");
  }

  async function askAnywhere(system, msgs) {
    let firstError = null;

    if (!kitReady()) firstError = new Error("blue-bonnet-kit.js not loaded, so the gateway was skipped");
    if (kitReady()) {
      try {
        // Use the kit's own formatter rather than building the array here.
        // It is the exact path the working Blue Bonnet apps take, so if the
        // gateway accepts theirs it accepts this. Hand-rolling it was one
        // more thing that could differ for no benefit.
        const plain = (typeof BBKit.toPlainMessages === "function")
          ? BBKit.toPlainMessages(flatten(system), msgs)
          : [{ role: "system", content: flatten(system) }].concat(
              msgs.map((m) => ({ role: m.role,
                content: typeof m.content === "string" ? m.content : "" })));
        const g = await BBKit.gatewayAsk(plain, { session: "crew", maxTokens: 1000 });
        if (g && g.text) { lastProvider = g.provider || "gateway"; return g.text; }
      } catch (e) { firstError = e; }
    }

    // Reserve: the Anthropic proxy, which is what this widget always used.
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_tokens: 1000, system: system, messages: msgs }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.type === "error" || data.error) {
      const msg = (data && data.error && data.error.message) || (data && data.message)
        || ("HTTP " + res.status);
      const e = new Error(msg);
      e.status = res.status;
      e.gatewayError = firstError ? String(firstError.message || firstError) : null;
      throw e;
    }
    lastProvider = "anthropic";
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }

  let lastProvider = null;

  const CREW_SYSTEM_INTRO = "You are the on-call assistant for a live football broadcast crew at CISD Stadium. "
    + "Answer crew questions quickly and precisely \u2014 crew members are often reading this on their phone right "
    + "before or during a game. Keep answers short and direct. Use the crew knowledge base below as ground truth. "
    + "If something isn't covered, say so plainly and suggest checking with Dustin (EIC) or Aracely (PM) rather "
    + "than guessing.";

  // What this assistant does not do.
  //
  // It remembers people now, which is useful and also the reason these are
  // written down. A tool that knows things about crew members needs to be
  // clear about what it will never do with that.
  const CREW_LIMITS = "\n\nWHAT YOU DON'T DO \u2014 these are firm:\n"
    + "- You are a work tool. Stay on the broadcast: schedule, positions, gear, procedure.\n"
    + "- You do not give advice on anyone's relationships, family, mental health, or medical "
    + "questions. Not a softened version either. Say it's not what you're for, and that a real "
    + "person is the right call. Be kind about it and be brief.\n"
    + "- You do not rule on pay, hours, discipline, scheduling disputes, or who was at fault. "
    + "Those go to Dustin (EIC) or Aracely (PM). You can say what the schedule says; you do not "
    + "decide whether someone was right.\n"
    + "- You do not pass along what one crew member told you to another, and you do not comment "
    + "on anyone's performance, reliability, or attitude. What you remember is there to help the "
    + "person in front of you, not to report on them or anyone else.\n"
    + "- You do not invent equipment answers. Anything marked [VERIFY], or not covered, gets an "
    + "honest 'I'd be guessing' and a name to ask.\n"
    + "- If someone seems to be having a genuinely hard time, you can say you noticed and that "
    + "you're not the right thing for it. Don't counsel, don't diagnose, don't keep them talking.";

  // 2) EDIT THIS any time roster/schedule/positions change
  const CREW_KB = `CISD STADIUM BROADCAST — FALL 2026 SEASON
Home teams: North Crowley HS (NCHS), Crowley HS (CHS), Texas Wesleyan University
17 home games total this season.

CALL TIME: Set per game, and sometimes per position — a position can be called earlier than the rest of the crew.
Never quote a call time from memory or work it out from kickoff. The Today tab in the ADV Media Teams app is the
only correct source: it shows the general call and each position's own call. If asked, tell them to check Today.
CHECK-IN: All crew check in with Aracely (Producer/PM) at the south elevated entrance corner, alongside Grant.
BAGS: Clear bags recommended for faster facility entry.

KEY CONTACTS:
- Dustin — Executive in Charge (EIC)
- Aracely — Producer/PM, runs check-in

CREW POSITIONS: Director, Producer, Audio A1, Audio A2/Utility, Camera Lead, Camera Operators, Replay, Clips, Shader, Utility.

CONTROL ROOM WORKFLOW:
- Replay, Clips, and Shader work feeds and match picture before air.
- Audio follows the posted booth checklist.
- Camera Lead handles all gear checkout, painting coordination, and confirms post-game storage before releasing operators.

BROADCAST CHECKLIST APP: Clock in first, then continue to Pre-Shift checklist under "My Checklist." Tap "Signal Up" once ready, "Request Help" if something's wrong. Complete Post-Shift after the game, then clock out and submit invoice. Leads/PM/EIC watch the Dashboard tab.

[Edit this block any time positions, assignments, or the schedule change.]`;

  // Equipment reference. Separate from CREW_KB on purpose: the roster and
  // schedule change weekly, this changes when we buy gear. Keeping them
  // apart means editing one doesn't risk breaking the other.
  //
  // Written as operational guidance, not copied from manuals. Where a fact
  // needed checking it was checked; where it depends on OUR units, it is
  // marked [VERIFY] and the assistant is told to say so instead of guessing.
  const CORE_GEAR_KB = `EQUIPMENT REFERENCE — written for a tech on a phone, mid-shift.
Anything marked [VERIFY] has not been checked against our actual units or firmware. Say so rather than guessing.

=== CAMERAS: BLACKMAGIC URSA BROADCAST ===
Fiber to the CCU runs over SMPTE 311M hybrid cable with SMPTE 304M (LEMO 3K.93C) connectors. That cable carries two single-mode fibers, power conductors, and two low-voltage control wires in one jacket — video, audio, comms, tally, control and power all in the one run.
Because it carries power AND glass: a dirty or damaged end face kills the picture while the camera still powers up. Camera has lights, no image at the CCU = suspect the fiber ends first, not the camera.
CLEAN THE ENDS. Every time, both ends, before mating. Cleaner or lint-free wipe and IPA. Dust on a single-mode face is the single most common fiber failure at a stadium.
Never exceed the bend radius. No tight coils around a rail, nothing pinched in a door, no cable under a cart wheel.
Cap both ends the second they're unmated.
Dress it so nobody trips over it — this cable carries mains-level power.
On a dead camera: check the CCU end is fully seated and latched before walking to the camera position. The push/pull latch can look seated and not be.

=== SWITCHERS ===
NEWTEK TRICASTER — main switcher. Sources come in as SDI. If an input is black, work backwards: source device output → cable → the specific TriCaster input → input configured for the right format. A format mismatch reads as black or as rolling/unstable video, not as an error message.
ROSS XPRESSION — graphics. If graphics are missing on air, first question is whether XPression is outputting at all or whether the switcher isn't taking that key layer. Check the XPression output monitor before touching the switcher. [VERIFY: our exact key/fill routing]
3PLAY — replay. Records continuously off its assigned inputs. If replay says "no video," check the record inputs, not the playout.

=== SDI CABLE ===
Coax, BNC, 75-ohm. It either works or it doesn't — SDI has no partial picture. Sparkles (white speckles) mean you're at the edge of the signal budget: too long a run, a bad connector, or the wrong grade of cable.
Sparkles or intermittent lock = replace the cable before you replace the gear. It is almost always the cable or the connector.
75-ohm cable and 75-ohm connectors. A 50-ohm BNC will physically mate and cause exactly these symptoms.
Higher data rates (3G, 12G) are far less tolerant of run length and marginal connectors than HD-SDI. A cable that used to work at 1080i may not carry a higher rate.

=== AUDIO: ALLEN & HEATH SQ5 ===
Digital console. [VERIFY: our scene/show file names and channel map]
If a channel is dead, check in this order: source and cable → is the channel's input actually patched to that socket → gain → is the channel muted, or muted by a mute group → is the fader assigned to the mix you're listening to.
On a digital desk, "no audio" is very often a routing or scene-recall problem, not a broken input. A recalled scene can silently change a patch.
Before doubting the console, verify the source somewhere else in the chain.

=== AUDIO: SHURE ULXD WIRELESS ===
Digital wireless. Encrypted, so a transmitter must be IR-synced to its receiver — if multiple transmitters share one receiver, each one must be synced to clear the encryption key.
SCAN AND SYNC, the correct order:
1. Turn OFF all transmitters first, so they don't pollute the scan.
2. Turn ON anything that will be radiating during the game, so the scan sees and avoids it.
3. On the receiver: SCAN > GROUP SCAN. It reports the group with the most clean frequencies.
4. Press the flashing ENTER to deploy frequencies to the channels.
5. Power the transmitter on, press SYNC on the receiver, hold the IR windows aligned until the receiver's IR port lights red. Keep them aligned for the whole download — it can take 50 seconds or more. "SYNC SUCCESS!" means it took.
DROPOUTS — read the RF meter at the moment it drops:
- RF meter drops with the audio → it's RF. Rescan for a clean frequency.
- RF meter holds steady while audio drops → it's the audio path. Suspect the lav, the headset, or its cable, not the RF.
Red RF LEDs and an interference warning on the receiver = interference detected. If it persists, scan and sync at the first opportunity.
Antenna placement and line of sight matter more than transmitter power. Raising power drains batteries faster and reduces how many systems can coexist.
Networked receivers must all be in the same frequency band.

=== COMMS: CLEAR-COM WIRELESS ===
Beltpacks register to base station antennas. [VERIFY: our exact system model and channel assignments]
No comms on one pack: check battery, check it's registered to the base, check the assigned channel, check antenna coverage where that person is standing.
Comms dropping in one specific spot in the bowl is almost always antenna coverage, not the pack. Note where it happens and tell the A2.
Everyone loses comms at once = the base station or the antenna feed, not the packs.

=== GENERAL TRIAGE ===
Change one thing at a time. Two changes and you learn nothing from the result.
Swap the cable before you swap the gear. It's usually the cable.
Verify the source before you blame the destination.
If it's within an hour of kickoff and it isn't fixed in two attempts, escalate to the lead rather than keep digging. Say what you tried.
`;

  // The deeper references live in their own files so they can be edited
  // without touching this one: blue-bonnet-gear-kb.js (SQ-5, ULX-D) and
  // blue-bonnet-fiber-kb.js (SMPTE cleaning, URSA, converters, CCU).
  //
  // They declare GEAR_KB and FIBER_KB at top level. The block above used to
  // be called GEAR_KB too, and a const inside this IIFE shadows the global —
  // so those files were being loaded and silently ignored. Renaming the
  // built-in one fixes that. If the files aren't on the page this falls back
  // to the built-in block alone, exactly as before.
  const EXTRA_KB = [
    (typeof GEAR_KB !== "undefined" && GEAR_KB) ? String(GEAR_KB) : "",
    (typeof FIBER_KB !== "undefined" && FIBER_KB) ? String(FIBER_KB) : "",
  ].filter(Boolean).join("\n\n");

  const CREW_SYSTEM = CREW_SYSTEM_INTRO
    + "\n\nCREW KNOWLEDGE BASE:\n" + CREW_KB
    + "\n\nEQUIPMENT REFERENCE:\n" + CORE_GEAR_KB
    + (EXTRA_KB ? "\n\n" + EXTRA_KB : "")
    + "\n\nON EQUIPMENT QUESTIONS: give the practical answer first \u2014 what to check, in what order. "
    + "Do not quote manuals. If something is marked [VERIFY] or isn't covered, say plainly that you'd be "
    + "guessing and point them to the Camera Lead, A1, or Dustin. A wrong answer during a game costs more "
    + "than a slow one. If someone is mid-failure with kickoff close, lead with the single most likely fix."
    + CREW_LIMITS;

  // Hand the engine this app's own voice, and give it a storage key nothing
  // else uses. Two apps on one origin sharing a key read and write each
  // other's memory, and it is not obvious when that happens.
  if (memoryReady()) {
    BlueBonnet.configure({
      storageKey: "advmedia-crew-bluebonnet",
      baseSystem: CREW_SYSTEM,
      // No dreaming here. The idle recombination pass belongs to the personal
      // assistant, where surfacing a connection between two hard weeks is the
      // point. A crew tool has no use for it and it costs model calls.
      dreaming: false,
      dreamAsk: null,
      onWarning: function (code, message) { console.warn("blue bonnet:", code, message); },
    });
  }

  const LOGO_SRC = "data:image/png;base64,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";

  const QUICK_CHIPS = [
    "What time is call time for the next game?",
    "Where do I check in?",
    "How do I use the broadcast checklist?",
    "What positions still need filling?",
  ];

  // ---------- styles ----------
  const style = document.createElement("style");
  style.textContent = `
    #bb-bubble { position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px;
      border-radius: 50%; overflow: hidden; background: #161A21; border: 2px solid #2A3038;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4); cursor: pointer; z-index: 2147483000;
      transition: all .2s ease; padding: 0; }
    #bb-bubble.bb-live { border-color: #E4002B; box-shadow: 0 0 18px rgba(228,0,43,.6), 0 8px 24px rgba(0,0,0,.4); }
    #bb-bubble img { width: 100%; height: 100%; object-fit: cover; display: block; }
    #bb-bubble svg { width: 24px; height: 24px; margin: 18px; }
    #bb-panel { position: fixed; bottom: 92px; right: 20px; width: min(380px, 92vw);
      height: min(640px, 78vh); background: #12151A; color: #E8EAED; border: 1px solid #2A3038;
      border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.55);
      z-index: 2147482999; display: none; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #bb-panel.bb-open { display: flex; }
    #bb-header { display: flex; align-items: center; gap: 10px; padding: 12px 14px;
      border-bottom: 1px solid #2A3038; background: #161A21; flex-shrink: 0; }
    #bb-header img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; }
    #bb-title { font-weight: 700; font-size: 14px; letter-spacing: .04em; }
    #bb-status { font-size: 10px; color: #8A93A3; font-family: ui-monospace, Menlo, monospace; letter-spacing: .05em; }
    #bb-status.bb-live-text { color: #E4002B; }
    #bb-body { flex: 1; overflow-y: auto; padding: 14px; }
    .bb-empty { display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; text-align: center; padding: 0 20px; }
    .bb-empty img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 14px; }
    .bb-empty .bb-l1 { font-size: 12px; color: #8A93A3; font-family: ui-monospace, Menlo, monospace; letter-spacing: .03em; }
    .bb-empty .bb-l2 { font-size: 11px; color: #5C6472; margin-top: 6px; }
    .bb-row { display: flex; margin-bottom: 10px; }
    .bb-row.bb-user { justify-content: flex-end; }
    .bb-bubble-msg { max-width: 82%; border-radius: 10px; padding: 10px 12px; font-size: 14px;
      line-height: 1.45; white-space: pre-wrap; }
    .bb-row.bb-user .bb-bubble-msg { background: #1B2027; border: 1px solid #2A3038; }
    .bb-row.bb-assistant .bb-bubble-msg { background: #161A21; border: 1px solid #2A3038; border-left: 3px solid #4A9EFF; }
    #bb-chips { padding: 0 14px 8px; display: flex; flex-wrap: wrap; gap: 8px; }
    #bb-chips button { background: #1B2027; border: 1px solid #2A3038; border-radius: 999px;
      padding: 6px 12px; font-size: 12px; color: #B8C0CC; cursor: pointer; }
    #bb-inputrow { display: flex; align-items: center; gap: 8px; padding: 12px 14px;
      border-top: 1px solid #2A3038; background: #161A21; flex-shrink: 0; }
    /* 16px, not 14: iOS zooms the whole page when you focus a field below 16. */
    #bb-input { flex: 1; background: #12151A; border: 1px solid #2A3038; border-radius: 8px;
      padding: 10px 12px; font-size: 16px; color: #E8EAED; outline: none; }
    #bb-send { width: 40px; height: 40px; border-radius: 8px; border: 1px solid #2A3038;
      background: #1B2027; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    #bb-send.bb-active { background: #E4002B; }
    #bb-loading { display: flex; align-items: center; gap: 8px; background: #161A21; border: 1px solid #2A3038;
      border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #8A93A3; width: fit-content; }
  `;
  document.head.appendChild(style);

  // ---------- DOM ----------
  const bubble = document.createElement("button");
  bubble.id = "bb-bubble";
  bubble.setAttribute("aria-label", "Open Blue Bonnet");
  bubble.innerHTML = `<img src="${LOGO_SRC}" alt="Blue Bonnet"/>`;

  const panel = document.createElement("div");
  panel.id = "bb-panel";
  panel.innerHTML = `
    <div id="bb-header">
      <img src="${LOGO_SRC}" alt="Blue Bonnet"/>
      <div>
        <div id="bb-title">BLUE BONNET</div>
        <div id="bb-status">○ CISD BROADCAST CREW — STANDBY</div>
      </div>
    </div>
    <div id="bb-body">
      <div class="bb-empty" id="bb-empty-state">
        <img src="${LOGO_SRC}" alt="Blue Bonnet"/>
        <div class="bb-l1">STANDBY — ASK ANYTHING ABOUT THE SEASON</div>
        <div class="bb-l2">Call times, check-in, positions, or the checklist app.</div>
      </div>
    </div>
    <div id="bb-chips"></div>
    <div id="bb-inputrow">
      <input id="bb-input" type="text" placeholder="Ask the crew assistant..." />
      <button id="bb-send" aria-label="Send">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  QUICK_CHIPS.forEach((chip) => {
    const b = document.createElement("button");
    b.textContent = chip;
    b.onclick = () => sendMessage(chip);
    panel.querySelector("#bb-chips").appendChild(b);
  });

  const bodyEl = panel.querySelector("#bb-body");
  const inputEl = panel.querySelector("#bb-input");
  const sendEl = panel.querySelector("#bb-send");
  const statusEl = panel.querySelector("#bb-status");
  const chipsEl = panel.querySelector("#bb-chips");

  const MAX_TURNS_SENT = 12;   // ~6 exchanges of context
  let messages = [];
  let loading = false;
  let open = false;

  bubble.onclick = () => {
    open = !open;
    panel.classList.toggle("bb-open", open);
    bubble.innerHTML = open
      ? `<svg viewBox="0 0 24 24" stroke="#E8EAED" fill="none" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
      : `<img src="${LOGO_SRC}" alt="Blue Bonnet"/>`;
  };

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  sendEl.onclick = () => sendMessage();
  // Test hook. Harmless in production; lets the suite drive a real send.
  window.__bbTest_send = (t) => sendMessage(t);
  inputEl.addEventListener("input", () => {
    sendEl.classList.toggle("bb-active", inputEl.value.trim().length > 0);
  });

  function setLoading(v) {
    loading = v;
    bubble.classList.toggle("bb-live", v);
    statusEl.classList.toggle("bb-live-text", v);
    statusEl.textContent = v ? "● ON AIR" : "○ CISD BROADCAST CREW — STANDBY";
  }

  function renderMessage(role, text) {
    const empty = document.getElementById("bb-empty-state");
    if (empty) empty.remove();
    const row = document.createElement("div");
    row.className = "bb-row " + (role === "user" ? "bb-user" : "bb-assistant");
    const bubbleMsg = document.createElement("div");
    bubbleMsg.className = "bb-bubble-msg";
    bubbleMsg.textContent = text;
    row.appendChild(bubbleMsg);
    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return row;
  }

  // Storing conversations is not the same as remembering them. Episodes are
  // raw material; what reaches the prompt is distilled facts. Something has
  // to do the distilling, so every few exchanges we run one cheap pass over
  // the recent transcript and hand the result back to the engine.
  //
  // Failure here is silent on purpose. A crew member asking about call time
  // during a game must never see an error about a memory pass.
  let sinceExtract = 0;
  async function maybeExtract() {
    if (!memoryReady()) return;
    if (++sinceExtract < 4) return;
    sinceExtract = 0;
    try {
      const transcript = messages.slice(-8)
        .map((m) => m.role + ": " + (typeof m.content === "string" ? m.content : ""))
        .join("\n");
      if (transcript.length < 40) return;
      // Same routing as a normal question: gateway first, Anthropic in
      // reserve. This used to call PROXY_URL directly, which meant memory
      // stopped working the moment the Anthropic balance hit zero — the one
      // failure the gateway was added to survive.
      const raw = await askAnywhere(
        "You extract facts. Reply with JSON only, no other text.",
        [{ role: "user", content: BlueBonnet.extractionPrompt(transcript) }]
      );
      BlueBonnet.ingestExtraction(raw);
    } catch (e) { /* memory is a bonus, never a blocker */ }
  }

  async function sendMessage(preset) {
    const content = (preset !== undefined ? preset : inputEl.value).trim();
    if (!content || loading) return;

    if (chipsEl.parentNode) chipsEl.remove();
    inputEl.value = "";
    sendEl.classList.remove("bb-active");
    renderMessage("user", content);
    messages.push({ role: "user", content });
    setLoading(true);

    const loadingRow = document.createElement("div");
    loadingRow.className = "bb-row bb-assistant";
    loadingRow.innerHTML = `<div id="bb-loading">pulling that up...</div>`;
    bodyEl.appendChild(loadingRow);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    try {
      if (PROXY_URL === "PASTE_YOUR_WORKER_URL_HERE") {
        throw new Error("PROXY_URL not configured yet");
      }
      // Two blocks when memory is available: the crew prompt never changes so
      // the proxy can cache it, and what we know about this person rides
      // alongside it and changes every message. Flattening these into one
      // string would invalidate the cache on the whole knowledge base.
      const system = memoryReady() ? BlueBonnet.systemPrompt(content) : CREW_SYSTEM;
      // Send a window, not the whole session. messages grew without limit, so
      // a long game-night conversation kept re-sending every earlier turn —
      // rising cost per message and eventually an over-length request.
      // Memory is what carries anything older than this.
      const sent = messages.slice(-MAX_TURNS_SENT);
      const text = (await askAnywhere(system, sent))
        || "The assistant replied with nothing. Try asking again.";
      loadingRow.remove();
      renderMessage("assistant", text);
      messages.push({ role: "assistant", content: text });
      // This is what makes it remember. Without it the engine is loaded and
      // learns nothing.
      if (memoryReady()) {
        try { BlueBonnet.observeTurn(content, text); } catch (e) {}
        maybeExtract();
      }
    } catch (e) {
      loadingRow.remove();
      const raw = (e && e.message) ? String(e.message) : String(e);
      // The gateway's failure was being attached to the error and then never
      // shown, so the message talked about Anthropic while hiding the reason
      // the primary path didn't answer. Show both or the fault is invisible.
      const gwy = e && e.gatewayError ? String(e.gatewayError) : null;
      let why = "Couldn't reach the assistant just now \u2014 try again in a moment.";
      if (/PROXY_URL not configured/.test(raw)) {
        why = "The assistant isn't set up yet \u2014 PROXY_URL needs filling in.";
      } else if (/credit|billing|quota/i.test(raw)) {
        why = "The assistant is out of API credit. That's a billing thing, not you.";
      } else if (/rate.?limit|overload/i.test(raw)) {
        why = "Too many requests at once. Give it a few seconds.";
      } else if (/system|invalid_request|max_tokens|model/i.test(raw)) {
        why = "The assistant sent a request the server didn't accept. Show Dustin this: " + raw.slice(0, 160);
      } else if (/NetworkError|Failed to fetch|network/i.test(raw)) {
        why = "No connection right now \u2014 stadium signal, most likely. Try again when you have bars.";
      }
      renderMessage("assistant", why + (gwy ? "\n\nGateway also failed: " + gwy : ""));
      console.error("Blue Bonnet error:", e);
    } finally {
      setLoading(false);
    }
  }
})();
