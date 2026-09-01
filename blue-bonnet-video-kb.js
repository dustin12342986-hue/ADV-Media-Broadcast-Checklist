/* ===========================================================================
   BLUE BONNET — VIDEO LIBRARY
   ===========================================================================

   HOW TO USE

   Load this before blue-bonnet-widget.js:

       <script src="blue-bonnet-video-kb.js"></script>

   The widget picks it up automatically, describes the library to the
   assistant, and — this is the part that matters — refuses to display any
   link that isn't in this file. A model asked for a video will happily
   invent a plausible YouTube URL. Rather than only telling it not to, the
   widget strips any URL that isn't on this list before the message reaches
   the screen. Fabricated links can't get through.

   ADDING A VIDEO

   Copy an entry, fill it in, commit. No rebuild.

     title   what it is, in plain words
     url     the real link. OPEN IT before you paste it.
     covers  what problem it solves — this is what the assistant matches on,
             so write the words a crew member would actually use
     source  who made it, so people know whether to trust it
     minutes roughly how long, so nobody starts a 40 minute video at 6:45pm

   ONE RULE: never paste a link you haven't opened yourself. A dead link
   during a show is worse than no link.

   WHY THIS IS NEARLY EMPTY

   I only include links I've confirmed exist. Everything below marked
   [ADD YOURS] is a slot for a video you've watched and know is good. The
   assistant handles an empty library fine — it just says it doesn't have a
   video for that and gives the written answer instead.
   =========================================================================== */

const VIDEO_KB = [
  {
    title: "Cleaning a SMPTE / LEMO fiber connector",
    url: "https://www.youtube.com/watch?v=v06c4lwcMKs",
    covers: "SMPTE cleaning, LEMO connector, one-click cleaner, dirty fiber, no picture, "
          + "no video from camera, cleaning the plug, cleaning the socket, fiber inspection",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Connecting and disconnecting a SMPTE cable",
    url: "https://www.youtube.com/watch?v=stnkAEMsCv8",
    covers: "how to plug in SMPTE, mating the connector, unplugging, latch, "
          + "won't go in, stuck connector, disconnecting safely, camera end, JBT end",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Over-under cable coiling",
    url: "https://www.youtube.com/watch?v=TbxMyytWw60",
    covers: "coiling cable, over under, wrapping, kinks, twisted cable, "
          + "how to wrap without damaging, strike, packing cable away",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Finalizing and calibrating a studio camera system — URSA Broadcast G2",
    url: "https://www.youtube.com/watch?v=sLgGLd4PzCk",
    covers: "camera calibration, matching cameras, studio setup, finalising the rig, "
          + "cameras don't match, colour match, black balance, setting up the system",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Shading the URSA Broadcast over fiber with a SKAARHOJ RCP",
    url: "https://www.youtube.com/watch?v=vrLT1EWlfsU",
    covers: "shading, shader position, RCP, remote control panel, CCU, iris, "
          + "black level, painting cameras, matching over fiber, SKAARHOJ",
    source: "supplied by ADV",
    minutes: null,
    note: "Publisher marks this LEGACY — check current firmware behaviour before relying on menu paths.",
  },
  {
    title: "Connecting URSA Cine to the internet",
    url: "https://www.youtube.com/watch?v=l86YxVK4RoM",
    covers: "network setup, connecting camera to internet, wifi, ethernet, cloud",
    source: "supplied by ADV",
    minutes: null,
    note: "URSA CINE, not URSA Broadcast — network menus differ. Confirm which body before following.",
  },
  {
    title: "Update your camera software",
    url: "https://www.youtube.com/watch?v=mf4RcOM5ogs",
    covers: "firmware update, camera software, updating the camera, version mismatch, "
          + "camera control not working, tally not working, Blackmagic Camera Setup",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Using LUTs with your Blackmagic camera",
    url: "https://www.youtube.com/watch?v=SwjyE9foXRs&t=3s",
    covers: "LUTs, look up table, loading a LUT, monitoring LUT, picture looks flat, "
          + "washed out image, colour looks wrong, matching the look, film to video",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Blackmagic URSA Studio Viewfinder",
    url: "https://www.youtube.com/watch?v=ro5E5WAhoNw",
    covers: "studio viewfinder, viewfinder setup, mounting the viewfinder, "
          + "tally light on the viewfinder, VLock plate, operator monitor",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "Transferring media from a URSA Cine camera",
    url: "https://www.youtube.com/watch?v=wI0QLD0Wh4k",
    covers: "offloading footage, transferring media, getting files off the camera, media management",
    source: "supplied by ADV",
    minutes: null,
    note: "URSA CINE, not URSA Broadcast — confirm which body before following.",
  },
  {
    title: "Connecting URSA Cine to Blackmagic Cloud",
    url: "https://www.youtube.com/watch?v=0vhj3R3SXA8",
    covers: "Blackmagic Cloud, cloud sync, uploading footage, remote workflow",
    source: "supplied by ADV",
    minutes: null,
    note: "URSA CINE, not URSA Broadcast — confirm which body before following.",
  },
  {
    title: "Blackmagic URSA menu setup",
    url: "https://www.youtube.com/watch?v=4Dd97s-4h9w&t=17s",
    covers: "URSA menus, camera settings, setup, frame rate, shutter, ISO, "
          + "white balance, camera ID number, configuring the camera",
    source: "supplied by ADV",
    minutes: null,
  },
  {
    title: "URSA Broadcast G2 setup walkthrough",
    url: "https://www.youtube.com/watch?v=UHVHmoYAigI",
    covers: "URSA Broadcast G2 first-time setup, camera menus, getting configured",
    source: "third party",
    minutes: null,
  },

  // ---- [ADD YOURS] ---------------------------------------------------------
  // Slots worth filling first, based on what crew actually ask about:
  //
  // { title: "ULX-D group scan and IR sync",
  //   url: "", covers: "wireless scan, sync, dropouts, RF interference, no audio from a mic",
  //   source: "", minutes: null },
  //
  // { title: "SQ-5 basics — patching, gain, mutes",
  //   url: "", covers: "dead channel, no audio, routing, scene recall, gain staging",
  //   source: "", minutes: null },
  //
  // { title: "Fiber converter camera-to-truck setup",
  //   url: "", covers: "camera fiber converter, studio fiber converter, no camera control, tally",
  //   source: "", minutes: null },
  //
  // { title: "Our stadium walkthrough — where everything lives",
  //   url: "", covers: "check in, where to go, camera positions, control room layout",
  //   source: "ADV Media", minutes: null },
];

/* Rendered into the system prompt. Kept as a function so an empty library
   produces an honest sentence rather than a heading with nothing under it. */
function videoKbText() {
  const usable = (VIDEO_KB || []).filter((v) => v && v.url && v.title);
  if (!usable.length) {
    return "VIDEO LIBRARY: empty right now. You have no videos to offer. "
      + "If someone asks for one, say there isn't one yet and answer in writing instead. "
      + "Never invent a video link.";
  }
  return "VIDEO LIBRARY — the ONLY videos you may ever link to:\n"
    + usable.map((v) =>
        "- " + v.title
        + "\n  URL: " + v.url
        + "\n  Covers: " + (v.covers || "")
        + (v.source ? "\n  Source: " + v.source : "")
        + (v.minutes ? "\n  Length: about " + v.minutes + " min" : "")
        + (v.note ? "\n  CAVEAT (say this when you offer it): " + v.note : "")
      ).join("\n")
    + "\n\nRULES FOR VIDEOS — firm:\n"
    + "- Offer a video only when one above genuinely covers the question. A rough match is worse than none.\n"
    + "- Paste the URL exactly as written above. Do not shorten, guess, or reconstruct it.\n"
    + "- NEVER produce a video link that is not on this list, even if you are confident it exists. "
    + "If there's no fit, say there's no video for that yet and answer in writing.\n"
    + "- Answer the question first. The video is a follow-up, not a substitute — someone mid-failure "
    + "with kickoff close needs the fix, not a 12 minute watch.\n"
    + "- Say roughly how long it is if that's known, so nobody starts a long one at 6:45pm.";
}

/* The allowlist the widget enforces against. */
function videoKbUrls() {
  return (VIDEO_KB || []).filter((v) => v && v.url).map((v) => v.url);
}
