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

  // 2) EDIT THIS any time roster/schedule/positions change
  const CREW_KB = `CISD STADIUM BROADCAST — FALL 2026 SEASON
Home teams: North Crowley HS (NCHS), Crowley HS (CHS), Texas Wesleyan University
17 home games total this season.

CALL TIME: Always 2 hours before kickoff.
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

BROADCAST CHECKLIST APP: Clock in first, then continue to Pre-Shift checklist under "My Checklist." Tap "Signal Up" once ready, "Request Help" if something's wrong. Complete Post-Shift after the game, then clock out and submit invoice. Leads/PM/EIC w
