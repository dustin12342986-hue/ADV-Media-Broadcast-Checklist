/* ===========================================================================
   BLUE BONNET — FIBER & CAMERA KNOWLEDGE BASE
   SMPTE 311M hybrid fiber · Blackmagic URSA Broadcast · fiber converters · CCU
   ===========================================================================

   HOW TO USE THIS FILE

   Paste the FIBER_KB constant below into your CURRENT blue-bonnet-widget.js,
   alongside CREW_KB and GEAR_KB, then join all three for the system prompt:

       const SYSTEM = CREW_KB + "\n\n" + GEAR_KB + "\n\n" + FIBER_KB;

   Separate constant on purpose — camera gear changes on a different schedule
   than the audio rig or the roster, and this block drops into any other Blue
   Bonnet app that needs it.

   WHAT THIS IS AND ISN'T

   An operating reference for a person standing at a camera position with a
   dead fiber run, written in plain terms. It is not the manufacturer manuals
   and doesn't reproduce them — those are copyrighted and far too long for a
   system prompt. Grounded in Blackmagic's published documentation and the
   LEMO/Camplex cleaning-kit instructions; official sources linked below so
   the assistant can send people to the real thing:

     Blackmagic fiber converters
       https://www.blackmagicdesign.com/products/blackmagicfiberconverters
     URSA Broadcast fiber converters
       https://www.blackmagicdesign.com/products/blackmagicursabroadcast/fiberconverters
     Camplex SMPTE 304/311M cleaning kit instructions
       https://www.camplex.com/Portals/0/Documents/Data%20Sheets/FIBERCLEAN-1_MAN.pdf

   VERIFY AGAINST YOUR OWN KIT. I don't know which URSA generation, which
   converters, or whose cable ADV owns. Connector styles differ (FUW vs PUW
   vs Canare), and the cleaning steps differ between plug and socket. The
   answering rules at the bottom tell the assistant not to guess.
   =========================================================================== */

const FIBER_KB = `
=== FIBER & CAMERA REFERENCE ===

--------------------------------------------------
SMPTE HYBRID FIBER — WHAT IT IS
--------------------------------------------------
SMPTE 311M hybrid camera cable carries optical fibers and copper power
conductors in one jacket. One cable and one connector replaces what used to be
triax for video plus separate power, intercom and data runs. Connectors are
LEMO FUW/PUW style (Canare and others make compatible parts) and are often
referred to as SMPTE 304/311M.

It is lighter and thinner than triax for the same run, which is why it's worth
the extra care it demands.

--------------------------------------------------
CLEANING — THE SINGLE MOST IMPORTANT HABIT
--------------------------------------------------
Contamination on the fiber end face is the number one cause of SMPTE failures.
Dust, skin oil from a fingerprint, and grit from a stadium floor will kill a
link that is otherwise perfectly good. A cleaning kit costs a fraction of a
connector replacement.

THE RULE: inspect and clean before every mate. Every time, both ends.

WHAT'S IN A KIT
- One-click cleaner with the correct tip size for the ferrule
- Lint-free precision wipes
- Non-residue fiber optic cleaner (Electro-Wash PX or 99% isopropyl)
- LEMO/SMPTE alignment tool
- Fiber inspection scope

THERE IS A VIDEO. If someone is cleaning a connector for the first time, point them
at the SMPTE / LEMO cleaning video in the video library — the plug and socket differ and
it's easier to watch once than to read.

CLEANING A SOCKET (PUW, EDW, PEW, PBW style — the receptacle end)
1. Gently remove the first/front cap to expose the fibers.
2. Insert the one-click cleaner tip into the connector and push.
3. Push until you hear the audible click — that's the tool engaging.
4. Repeat if the scope still shows contamination.

CLEANING A PLUG (FUW, FXW, FMW style — the cable end)
1. Gently remove the secondary cap.
2. DO NOT remove the alignment sleeve. This is the step people get wrong.
3. Insert the cleaner tip and push until it clicks.
4. Re-inspect.

WET CLEANING, when a dry click-cleaner won't shift it
- Fold a lint-free wipe, dampen one section with non-residue cleaner.
- Wipe the end face in ONE direction across the damp section, then across a
  dry section of the same wipe.
- Never re-use a section. Never re-use a wipe.

INSPECT
Use a fiber inspection scope before and after cleaning. If it still looks
contaminated, clean again — don't mate it and hope.

WATER — THE ONE THAT ENDS A CABLE ON THE SPOT
SMPTE fiber can never get wet on the ends. Covered or not, capped or not, the ends must
never be dragged through wet turf or through puddles. It ruins them instantly. There is
no partial failure and no field repair: the camera still powers up and there is simply no
picture.

STRIKING A RUN — the order matters
1. Unplug the SMPTE from the JBT.
2. Cap the end straight away.
3. Plastic sleeve bag over the capped end. A cap is not a water seal.
4. Same on the other end. Both ends, every time.

THE ENDS NEVER TOUCH THE GROUND. Not wet turf, not dry concrete, not for a second while
someone coils. Grit does the same damage as water, it just takes another show to appear.

USE REELS for every camera run. A reel keeps the ends off the ground by design rather than
by everyone remembering, which is the only version of this rule that survives a wet night.

IF AN END GETS WET OR DROPPED: do not plug it in to test it. Tag the cable, tell the EIC
or A1, use a spare. Mating a contaminated end pushes the contamination into the other
connector and costs two ends instead of one.

THINGS THAT WRECK CONNECTORS
- Leaving a connector uncapped, even for a minute. Cap it the moment it's
  unmated, both ends, every time.
- Touching the ferrule with a finger.
- Canned air — it drives debris in and can leave propellant residue.
- Dragging a connector across the ground while pulling cable.
- Coiling tighter than the cable's minimum bend radius.
- Setting a connector down on a truck floor or grass.

SAFETY
Never look into the end of a fiber or into a socket that may be live. The
light is invisible and can damage your eye. Check with a scope or a power
meter, not with your eye.

--------------------------------------------------
SMPTE TROUBLESHOOTING, IN ORDER
--------------------------------------------------
1. CLEAN IT FIRST. Before swapping anything, before blaming the camera, clean
   and inspect both ends and any barrel in the run. This resolves most faults.
2. Check every mating point, not just the two ends. Inline barrels and
   patch panels are connections too, and they get skipped.
3. Look at the cable physically. Crush damage at a door threshold, a spot
   that got driven over, a kink from a tight coil, or a pinch under a case.
4. Swap the cable for a known-good run to split the problem between cable and
   equipment. If a spare exists, this is faster than any other test.
5. Use a cable checker / loopback if you have one — it gives an actual dB loss
   figure rather than a guess.
6. Intermittent that comes and goes with camera movement usually means a
   marginal connector or a damaged section near a flex point, not electronics.

--------------------------------------------------
BLACKMAGIC URSA BROADCAST + FIBER CONVERTERS
--------------------------------------------------
THE PAIR
- Blackmagic Camera Fiber Converter — mounts on the back of the URSA Broadcast
  or URSA Mini in place of the battery plate. 12G-SDI connections run between
  the converter and the camera.
- Blackmagic Studio Fiber Converter — the control room / truck end. Converts
  SMPTE fiber to SDI, audio, talkback, tally and control.

Together they carry video, camera power, talkback, tally, camera control, PTZ
and tracker down one SMPTE fiber cable, at distances up to 2 km.

HOW THE LINK ACTUALLY WORKS
The SMPTE fiber connection is a standard 10G Ethernet link, and video is IP
based with 10-bit lossless encoding. Talkback, tally, camera control and lens
control are all converted to low latency IP as well. Useful to know when
diagnosing: it is a network link, not a baseband video link.

CAMERA CONVERTER CONNECTIONS
- 2x 5-pin XLR broadcast talkback, with a three-way audio mixer
- 2x 3-pin XLR audio inputs with phantom, embedding into SDI channels 3 and 4
- 3 return video feeds, plus 1x 3G-SDI camera return out
- 10-pin Hirose: extra talkback output plus red and green tally — the one to
  use when the camera is on a crane
- 9-pin PTZ connector, wired through the fiber to the studio converter's PTZ
- DC and D-tap outputs for powering accessories
- VLock plate on top for the URSA Studio Viewfinder
- Return, intercom, record, focus and iris controls on the rear, so the
  operator runs it like a traditional studio camera

STUDIO CONVERTER CONNECTIONS
- SMPTE fiber connector on the FRONT panel, next to a built-in 5" LCD, so you
  can plug a camera in and see the feed immediately
- Rear: SDI for HD/UHD and HD return feeds, 4x XLR audio, reference in and
  out, PTZ and intercom/tally on D connectors, Ethernet, SFP fiber
- Two fit side by side in a rack with the optional rack mount kit
- Supplies power to the camera and its accessories down the fiber

TWO SAFETY BEHAVIOURS WORTH KNOWING
- The converters constantly monitor the power conductors. If they detect
  damage or a leak, power is shut down instantly. So a link that dies the
  moment you power it up may be the system protecting you from a damaged
  cable — inspect the cable, don't keep re-seating it.
- There is a BACKUP TALKBACK LINK that keeps working even when the main fiber
  link is offline. If you can still talk to the camera position but have no
  video, that tells you the fault is in the optical path, not the whole cable.

--------------------------------------------------
CAMERA CONTROL / CCU
--------------------------------------------------
- Camera control travels over SDI, and over the fiber link when converters are
  in use. The ATEM Camera Control Panel controls up to 4 URSA Mini, URSA
  Broadcast, Blackmagic Studio or Micro Studio cameras. Software control is
  also available in ATEM Software Control.
- NO CAMERA CONTROL, video is fine: check the camera ID number set on the
  camera matches the switcher input it's plugged into. Two cameras sharing an
  ID is the classic cause.
- Control rides on the PROGRAM RETURN feed. If the return feed to the camera
  isn't connected, control won't work even though the camera's output looks
  perfect at the switcher.
- Mismatched firmware between camera, converters and switcher causes control
  and tally faults that look like hardware failures. Blackmagic Camera Setup /
  Camera Utility handles updates. Update the whole chain together.
- Tally not lighting: same chain as control — ID number, return feed, firmware.

--------------------------------------------------
ANSWERING RULES FOR THIS SECTION
--------------------------------------------------
- Cleaning advice: always say to inspect with a scope, and always say to cap
  connectors when unmated. Those two habits prevent most of the faults people
  ask about.
- Never tell anyone to look into a fiber end.
- Plug and socket cleaning steps are DIFFERENT, and the alignment sleeve stays
  in place on plugs. If someone doesn't say which end they're cleaning, ask.
- Don't assert which URSA generation, which converters or whose cable ADV
  owns — connector styles and menus differ. Ask, or tell them to read it off
  the unit.
- If a fault involves camera power or a suspected damaged cable, say to stop
  and inspect rather than repeatedly re-seating a live connector.
- For anything this reference doesn't cover, point at the official manual
  rather than guessing. Wrong advice during a live show is worse than none.
`;
