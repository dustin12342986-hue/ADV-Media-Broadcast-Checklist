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
    title: "URSA Broadcast G2 setup walkthrough",
    url: "https://www.youtube.com/watch?v=UHVHmoYAigI",
    covers: "URSA Broadcast G2 first-time setup, camera menus, getting configured",
    source: "third party",
    minutes: null,
  },

  // ---- [ADD YOURS] ---------------------------------------------------------
  // Slots worth filling first, based on what crew actually ask about:
  //
  // { title: "Cleaning a SMPTE fiber connector",
  //   url: "", covers: "SMPTE cleaning, one-click cleaner, plug vs socket, dirty fiber, no picture",
  //   source: "", minutes: null },
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
