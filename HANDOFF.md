# ADV Media — Handoff

Written 31 Aug 2026. Read this before touching anything.

---

## Who and what

**Dustin** runs ADV Media Limited Company — live broadcast and event crew.
**Aracely Valencia** is co-owner and PM. She is full time, never on a shift roster.

Clients: **CISD** (Crowley / North Crowley HS football), **AISD** (event labor),
**HEB ISD** (new, broadcasts + event labor), **Texas Wesleyan** (college football
at the CISD stadium).

Everything is single-file HTML on GitHub Pages, no build step. Firebase Realtime
Database for state, Cloudflare Workers for API proxying.

---

## How Dustin works — read this part twice

These are not preferences, they are the things that have gone wrong before.

**Give him working files, not explanations first.** He deploys by downloading a
file and uploading it to GitHub. Lead with the file and where it goes.

**Verify before claiming.** Render it, click it, test it. Say what you tested.
Several bad sessions came from asserting something worked without checking.

**His words are his words.** Crew-facing copy — notices, checklists, texts — is
his. Do not rewrite it to read better. If something is unclear, flag it and let
him decide. This has annoyed him more than once.

**Stay in scope.** Do not touch files he did not mention. Do not fetch from his
repos without asking. Fix what broke and nothing else.

**Flag ambiguity instead of guessing.** Dates especially. See the date incident
below.

**When he says something is broken, believe him and go looking properly.** Twice
the bug was real and my test harness was hiding it.

---

## Repos and files

Everything below is in **`ADV-Media-Broadcast-Checklist`**, repo root, unless
stated otherwise.

| File | What it is |
|---|---|
| `adv-media-teams.html` | The main crew app. ~650KB, everything inlined. |
| `home.html` | Landing hub. Contract cards + Shared Tools list. |
| `checklist.html` | Pre/post shift checklists by position. |
| `crew-guide.html` | Existing crew guide. |
| `producer-guide.html` | How to run the Run of Show tab. |
| `blue-bonnet-guide.html` | What the assistant is, for crew. |
| `football-package.html` | Gear package by position + SMPTE handling + stadium views. |
| `install.html` | One link to text crew to add the app to their phone. |
| `firebase-rules.json` | Paste into the Firebase console. Not read by the app. |
| `blue-bonnet-*.js` | Assistant. Five files, see below. |
| `stadium-angle-a.jpg`, `stadium-angle-b.jpg`, `stadium-overhead.jpg` | Camera position maps. |
| `stadium-tour-web.mp4` / `.webm` / `-poster.jpg` | Looping stadium video in the package page. |

Other repos: **`HEB-Portal`** (`heb.html` deployed as `index.html`),
**`AISD-Portal`**, **`Equipment-Checkout`**.

Not in a repo: **`blue-bonnet-gateway-auth.js`** — pastes into the Cloudflare
Worker. See the security section.

---

## Build marker — use it

`adv-media-teams.html` renders `APP_BUILD` at the bottom of every screen:

```
build 2026-09-01 · v39 · audio deep link
```

**Bump it on every change to that file.** It exists because a large amount of
time was lost to Dustin uploading a stale copy from Downloads — same filename,
browser saves `(1)`, `(2)`, so the file named exactly `adv-media-teams.html` is
the *oldest* download. If he reports something missing, the first question is
what the build line says.

---

## App structure

Main tabs: **Today · Profile · ID Card · Run of Show · Gear · Audio · Shifts ·
My Invoices · Equipment · Admin ▾**

Also present: a **signal-up gate** on Today, **show documents + script import**
on Run of Show, a **stadium monitor** launcher on both, and a **shared
appearance system** (`adv-theme.js`) used by every page in the ecosystem.

Admin menu groups: Crew (Directory, Approvals, Labor Requests), Financial
(Invoices, QB Approval), Operations (Call Times, Confirmations, Equipment
Reports, Equipment Checkout, Shift Log, Clock-In Locations, Reset Clock-Ins).

### Firebase paths

`profiles` `publicProfiles` `checklists` `help` `clock` `invoices` `liveRoster`
`shiftLog` `equipmentInventory` `equipmentCheckouts` `equipmentRequests`
`equipmentLog` `clockLocations` `clockArchive` `invoiceArchive` `approvedUsers`
`pendingApprovals` `qbApprovals` `confirmations` `equipmentReports`
`pushSubscriptions` `laborRequests` `clientEvents` `gameSettings` `runOfShow`
`showSettings` `cables` `cases` `showDocs` `signalUp` `commsCheck`
`weatherHold` `incidents` `station`

Project `crowley-football`. Auth via Google, admin emails
`dustin12342986@gmail.com` and `aracely.valencia10@gmail.com`.

---

## Landmines — every one of these cost real time

### Roster data: `liveRoster`, never `ROSTER_DATA`

`ROSTER_DATA` is the hardcoded season seed. The moment anyone picks up, drops or
gets reassigned a shift it is stale. Four separate views were reading it and
showing the wrong crew.

Everything goes through **`rosterRowsFor(gameId, gameRoster)`** and
**`loadLiveRoster()`**. `visibleRosterRows()` filters out `FULL_TIME_ROLES`
(currently `["PM"]`) for display, while lookups still see PM so Aracely's ID
card resolves.

`ROSTER_DATA` should only ever be touched by that helper and by
`seedLiveRosterIfNeeded()`.

### Dates are local, never UTC

`localDateId()` and `tomorrowId()`. `toISOString()` returns UTC, which rolls
over around 7pm Central — the app called tomorrow "today" for the last five
hours of every day. This bug caused a cascade: Dustin read dates through it,
concluded the season schedule was off by a day, and asked for a shift. I had
already found evidence against it (shifting put all six Tx. Wesleyan games on a
Sunday) and shifted anyway. Had to revert.

**If evidence contradicts an instruction, say so and stop.** Do not proceed and
document the concern afterwards.

### Firebase keys cannot contain `.` `#` `$` `/` `[` `]`

`Audio A2/Utility` has a slash. This broke call-time saves. Use **`callKey()`** in `adv-media-teams.html` (`roleKeyOf()` is the equivalent in
`heb.html`). Both sanitise to `_`. `liveRoster` role keys use the same pattern
inline. Any new node keyed by a role name needs the same treatment.

### `myProfile` is function-scoped, `myProfileForShifts` is not

`myProfile` is a `let` inside `renderMyInvoices`. Referencing it elsewhere throws
`ReferenceError`, which silently kills a click handler — no error on screen,
button just does nothing. This killed four buttons and took three rounds to
find, because test setup was creating `myProfile` as a global and hiding it.

**Use `myProfileForShifts`.** When testing, boot with only `db` and
`currentUser` and let everything undefined stay undefined.

### The Blue Bonnet bubble overlaps fixed bottom UI

`#bb-bubble` is `position: fixed; bottom: 20px; right: 20px; z-index:
2147483000`. It covered 40% of the Run of Show Next button. `.ros-controls` now
has `margin-right: 78px` to leave it the corner. Anything else pinned bottom-right
needs the same.

### iOS zooms fields under 16px

Every `input`, `select` and `textarea` is 16px. The old fix was
`maximum-scale=1` in the viewport, which disabled pinch-zoom for the whole app.
Do not put that back.

---

## Run of Show

Its own tab. Data at `runOfShow/{gameId}`: a **flat ordered cue list** plus a
`current` pointer, a `prompter` record, and `primary`.

Flat, not nested by section — each cue carries a `section` label. Advancing,
reordering and jumping all become index arithmetic.

**Position is shared state.** The producer advances and every crew phone moves.

### Prompter

`{ running, speed (cues/min), anchor (float cue pos), at (ms) }` and
`position = anchor + speed/60000 * (now - at)`. An anchor plus elapsed time,
not a streamed position — no drift, no write per frame, and a phone that sleeps
and wakes lands correctly. Corrected against `.info/serverTimeOffset` because
phone clocks disagree enough to matter.

**Bug that was fixed:** each image/cue restarted its motion at the segment
boundary while it had already been moving during the fade. Looked glitchy. Every
element now runs one continuous window.

### Producer lock

`showSettings/primaryCode`, four digits. **Everyone is asked, admins included.**
An earlier version exempted admins, which meant Dustin testing on his own phone
saw a gate that appeared to do nothing.

Every control that moves other people's screens goes through
`rosTryClaimPrimary()`: play, speed, ⤒, Next, Prev, **and tap-to-jump**.
Tap-to-jump was missed once and let anyone move the whole crew.

Non-producers: touching pauses following, ten seconds idle relinks.
`ROS_RESUME_AFTER_MS = 10000`. The producer is exempt.

### Content

`RUN_OF_SHOW` constant is a **seed only**. Once a game has been opened, the
stored copy wins. Changing the constant does nothing to a game already in
Firebase — that is what **Edit → Reload from script** is for. Tell him to press
it, every time you change a script.

Loaded: `2026-08-27` TXWES vs UCO (56 cues), `2026-08-28` NCHS vs Aledo (39).

Cue fields: `section time dur event read screen ribbon audio notes`. `read` is
announcer copy. Department colours: announcer blue, screen violet, ribbon teal,
audio green, note amber.

---

## Gear tab

`cases` and `cables`.

**Cables** — a number taped on both barrels is the identity. Status is
`good` / `bad` / `repair`. Bad pins to top, turns red, shows a banner. Marking
bad prompts for what failed. Any signed-in crew can flag one; the person who
finds it is at a camera position, not in the truck.

**Cases** — Camera Lead zip-ties each case after QC and records the tie number.
At load-in the number must match. States `sealed` / `open` / `broken`. Broken
pins to top and shouts.

Why the number and not just "sealed": a cut tie can be replaced with an
identical one from a bag, a number cannot.

### The incident this exists for

Someone moved gear before the crew arrived. Bad cables got pulled from the
mezzanine to the wrong positions, a camera ended up in the wrong spot, and
because the TriCaster/Blackmagic rig needs **all four cameras up on the CCUs or
the switcher will not come up at all**, one bad cable took down the whole show.
It never hit air, but the client was in the room and said "y'all had all summer
to fix this" — not knowing the previous night had gone clean.

**His rig has no partial failure mode.** That is why cable discipline matters
more here than for a typical crew. Worth remembering when weighing any change.

---

## Blue Bonnet

Five files, **all must be uploaded together**, and load order matters — the
widget runs on parse and cannot see anything loaded after it:

```html
<script src="blue-bonnet-kit.js"></script>
<script src="blue-bonnet-assistant.js"></script>
<script src="blue-bonnet-gear-kb.js"></script>
<script src="blue-bonnet-fiber-kb.js"></script>
<script src="blue-bonnet-video-kb.js"></script>
<script src="blue-bonnet-widget.js"></script>
```

### Things that were badly broken and are now fixed

**The gateway never ran.** Only the widget was on the page, so `kitReady()` was
false and every request went straight to Anthropic. All the gateway-first
fallback code was dead. This is why it kept dying when credit ran out.

**KB files were silently ignored.** The widget declared its own
`const GEAR_KB` inside its IIFE, shadowing the global from
`blue-bonnet-gear-kb.js`. `FIBER_KB` was never referenced. Built-in block
renamed `CORE_GEAR_KB`; externals now append.

**Memory extraction bypassed the gateway**, so memory died in exactly the
situation the gateway exists to survive.

**History grew without limit.** Now sends the last 12 turns; memory carries the
rest.

### Video library

`blue-bonnet-video-kb.js`. The widget **strips any URL not on the allowlist**
before it reaches the screen. Models invent plausible YouTube links without
hesitating; a prompt rule is not enough. Two real videos in there. Do not add a
link you have not opened.

### Security — unfinished

`GATEWAY_KEY` used to be hardcoded in public JS on GitHub Pages. Removed. The
widget now sends the signed-in user's **Firebase ID token**, and
`blue-bonnet-gateway-auth.js` verifies it in the Worker.

**This is written and tested but may not be deployed yet.** Confirm with Dustin.
Order matters: worker first, confirm the app still answers, *then* delete the
old shared key. Needs Worker vars `FIREBASE_PROJECT_ID = crowley-football` and
`ALLOWED_ORIGINS = https://dustin12342986-hue.github.io`.

The X.509→SPKI extraction was tested against a real OpenSSL cert (matches byte
for byte) and six token cases including a tampered payload.

### Known stale

`CREW_KB` inside the widget still contains hardcoded schedule facts. The call
time line was corrected to point at the Today tab; the rest should be audited.

---

## Testing — how to not repeat my mistakes

Playwright + Chromium is available. `fake_ros.js` in the working dir is an
in-memory Firebase stand-in.

**Boot with only `db` and `currentUser` set.** Assigning anything else creates
globals that production does not have. That is exactly how the `myProfile` bug
survived three rounds of "passing" tests.

**Load `blue-bonnet-widget.js` when testing bottom-of-screen UI.** It 404s
locally unless copied in, and its bubble is what covered the Next button.

**Test with real touch**: `has_touch=True, is_mobile=True`, and use `tap()`.

**Chromium here has no H.264.** Video tests need a WebM source or they silently
report zero dimensions.

**Check `pageerror`.** A thrown handler produces no visible symptom.

---

## Open items

**Inconsistency found while writing this — not yet resolved:**
`CAMERA_POSITIONS` in `adv-media-teams.html` still reads
`Camera 2: "Low north end zone"` and `Camera 3: "VIP camera"`. The
`football-package.html` copy was corrected later, after Dustin confirmed the
positions against the stadium renders, and now reads "under the LED wall" and
"VIP balcony — far end, opposite the LED wall". **The app is the older wording.**
Ask him which he wants shown on the roster rows before changing it — the app
strings are short by design because they sit under a role name.

**Needs Dustin:**
- Publish `firebase-rules.json` if `cables` / `cases` / `showSettings` are missing
- Fill `VIDEO_KB` with real links — a stadium walkthrough of his own is the highest value
- Decide whether 8 mics and 5 stands travel to football at all
- Deploy the gateway auth worker, then delete the old key
- Custom domain `aisd.advmediaco.com` — Ursulo still cannot reach the AISD portal

**Discussed, not built:**
- Load-in / strike photo check with seal numbers
- Print-ready plot poster for the storage room wall
- 7pm confirmation send + 2hr resend (needs Cloud Functions)
- HEB ISD billing — rate card not settled, deliberately absent

**In progress, no code yet:**
XPression player cards. Wife's request. Roster data should live in a Google Sheet
or Excel workbook — DataLinq reads those natively, and building roster management
into the app would add an export step to forget. Scoreboard is already connected
for score/clock, but **no scoreboard feed says who scored** — jersey number comes
over comms and the sheet does the lookup. Hudl imports rosters rather than
exporting them, so ask the coach for the source spreadsheet. Hudl profile photos
are athlete selfies; media day photos are a separate ask.

---

## Signal-up gate (v34)

`signalUp/{gameId}/{cam1..cam4}` = `{ by, at }`. Renders on **Today**, above the
game card. Four buttons, one per camera; tapping confirms with the person's name
and a timestamp, tapping again asks before clearing.

The gate time is **90 minutes before `game.gameTime`** — doors, not call time, so
a failure still leaves an hour. Past the gate with anything unconfirmed, the card
turns red and says to escalate now.

Deliberately manual. Nothing in the app can see a CCU, so a person looks at the
switcher and their name goes next to the camera. A green tick nobody checked is
worse than no tick.

**Why it exists:** the TriCaster and Blackmagic CCUs need all four cameras up or
the switcher will not come up at all. One bad cable takes the whole show. On 8/28
nobody knew until the client was in the room.

## Show tools on Today (v34–v35)

Four cards, one shared Firebase watcher, all live across every phone.

- **Weather hold** `weatherHold/{gameId}` — 30 minutes from the last strike,
  restarting on each new one. Shared countdown so nobody does the arithmetic on
  comms. Restart is one tap with no confirm: an accidental restart costs 30
  minutes of caution, a missed one puts people back in the stands too early.
  **Confirm CISD's own lightning policy with Greg Williams** — 30 minutes is the
  common standard, theirs is the one that counts.
- **Signal up** `signalUp/{gameId}` — see below.
- **Comms check** `commsCheck/{gameId}` — 7 items, same pattern as the gate.
- **Incident log** `incidents/{gameId}` — one tap, category then a note.

**Beltpack messages.** The weather hold and a missed signal-up gate each show a
short upper-case line with a Copy button, sized for a FreeSpeak II beltpack
display. The gate message names only the cameras still outstanding and updates
as they are confirmed.

There is no API here and there is not going to be one: the FSII base station is
configured through CCM, a browser interface, not a documented API. Pushing text
to beltpacks is a CCM feature done by hand. The app produces the message; a
person sends it. Scraping CCM would be the same fragility as the MaxPreps
scraper and is not worth it for five packs.

Worth checking on the base station, unrelated to software: the **battery type**
setting (Li-ion / alkaline / NiMH). Set wrong, the beltpack battery readings are
wrong, and a wrong reading is worse than none.

The hold repaints on a 1s interval because a countdown changes without a data
change; the interval is cleared when leaving the view.

## Audio portal (v38–v39)

Reached from the **A1 and A2 checklists** — a CHECK THIS FIRST style link at the
top pointing at `adv-media-teams.html#audio`. The app reads the hash on load and
opens that tab directly; a link that lands on Today and makes someone hunt for a
tab gets ignored.

The **checklist dashboard** shows two pills above the position rows:

- **Mics** — from the ULX-D bridge. Set `ULXD_STATE_URL` in `checklist.html` too,
  it has its own copy. "Up" and "hot" are shown separately on purpose: up means
  the receiver sees the transmitter, hot means it is not muted. A mic that is on
  and muted looks fine on a receiver and is silent on air.
- **Comms** — from `commsCheck/{gameId}`, live.

Both grey out honestly rather than showing stale numbers when the bridge is
down.



A1 spends the show on one screen, so it gets its own tab. Five sections:

1. **Wireless** — ULX-D battery in minutes (hidden until `ULXD_STATE_URL` is set)
2. **Comms check** — moved here from Today; it is A1's job, not the crew's
3. **Audio cues** — only cues with an audio department, ~30 of 39, not all of them
4. **Patch** — `AUDIO_PATCH`, static. Ref mic, three handhelds, DJ line, TXWES shotguns
5. **Handoffs** — ref mic first, coin toss, anthem

The cue list falls back to the `RUN_OF_SHOW` seed when the stored copy is empty,
so A1 does not have to wait for someone to open Run of Show first.

Today keeps the weather hold, the signal-up gate and the incident log — those
are whole-crew concerns.

## ULX-D wireless (v37)

Shure publish the ULX-D control protocol — raw TCP, port 2202, ASCII command
strings — and the receiver **sends a REPORT whenever a value changes**, so the
bridge listens rather than polls. This is a genuine integration, unlike
Clear-Com, where CCM is a browser UI with no API.

- `ulxd-bridge.js` — Node 18+, no dependencies. Connects to each receiver,
  sends `< GET 0 ALL >` once, then listens. Reconnects on its own if a receiver
  power-cycles. `--probe` prints what it found and exits.
- `worker-ulxd-route.js` — paste into the Worker. Same `STATE` KV binding and
  `BRIDGE_KEY` as the TriCaster routes. KV expires at 30s so a dead bridge reads
  as "not reporting" rather than showing a battery level from twenty minutes ago
  — a stale reading is worse than none, because A1 will act on it.
- In the app: `ULXD_STATE_URL` is blank, so the panel is hidden until the bridge
  is running. Set it to the Worker GET route.

The panel leads with **minutes remaining**, not bars, because bars are what A1
already has on the receiver and minutes are what they don't. Green, amber under
60 minutes, red under 25. A channel with no transmitter reads "no transmitter",
never a zero battery.

Runs on the same PC as the TriCaster bridge — it is already on the LAN.

## Show documents and script import (v24–v26, v31)

- `showDocs/{gameId}` — uploaded files, tagged **ROS**, **SCRIPT** or **OTHER**.
  Type is a fixed choice at upload, never guessed from the filename.
- `showSettings/{gameId}/sheetUrl` — a linked Google Sheet, with a Refresh button.
- Import from `.docx`, `.xlsx`, `.csv` or a linked sheet. All land on the same
  preview; **nothing saves until the preview is confirmed**.
- Firebase Storage SDK is inlined (40KB) — no CDN, matching the rest of the app.
  **Storage rules are a separate console page** from the database rules.
- Google Sheets are read as **published CSV**, not via Drive OAuth. The OAuth
  token expires in about an hour with no refresh in the browser SDK, which would
  mean an auth prompt mid-show.
- The CISD sheet uses `SPEAKER/EVENT` and `BIG SCREEN` headers, repeats its
  header row as a section divider, and puts section names in the START column.
  The parser handles all three; it did not at first, and the import simply
  refused.

## Stadium monitor

Built by another session (v27–v29), merged at v30. Corner launcher on Today and
Run of Show; video only decodes while maximized. State comes from a Cloudflare
Worker and KV, video from MediaMTX through a tunnel — **it uses no Firebase**, so
it needs no database rules.

Two things changed since: the launcher is measured clear of the three stacked
sticky bars on Run of Show, and the demo is permanently watermarked.

**Still not deployed.** Bridge PC, MediaMTX, tunnel, and the TriCaster model
question all remain. See `stadium-monitor-handoff.md`.

**hls.js still loads from jsdelivr.** Everything else in this app is inlined so
it survives a bad stadium network. That CDN call fails on exactly the night a
confidence monitor matters. ~200KB inlined; worth doing.

## Season

16 games. `2026-08-27` Thu TXWES vs UCO, `2026-08-28` Fri NCHS vs Aledo, then
through `2026-11-05`. All weekday labels verified against the real 2026 calendar.

Camera positions — colours match tally, roster, checklist and maps:

| | Colour | Where | Cable |
|---|---|---|---|
| Camera 1 | Blue | High 50, press box opening | 10 ft |
| Camera 2 | Red | Field level under the LED wall | 200 ft to visitor side JBT |
| Camera 3 | Green | VIP balcony, opposite end from the LED wall | 100 ft up from JBT |
| Camera 4 | Yellow | Home sideline | 100 ft |

Camera 5 is the spare. All four take a converter and muffed headset; 1, 2 and 3
take viewfinders, 4 does not; only 3 needs a power cable.

**SMPTE ends must never get wet or touch the ground.** Dustin's rule, his
wording, in `football-package.html` and `FIBER_KB`. Do not reword it.
