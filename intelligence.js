/* =========================================================================
   intelligence.js — THE BRAIN (not wired up yet).

   This is the seam for the future conversational goal-adjuster. It is kept
   completely separate from rendering so that adding AI never risks the UI.

   When we build it, it will:
     1. read LOGS (produced by sources.js) — your real sessions,
     2. look at momentum per pursuit (streaks, tempo, pushups, distance),
     3. propose new "unlock" text for a car in config.js,
     4. optionally talk to a model via a Netlify function (secret stays server-side,
        exactly like strava.js).

   Nothing below runs. It's a shape to build into.
   ========================================================================= */

const Intelligence = {
  enabled: false,

  // e.g. how consistent has a track been lately?
  momentum(trackKey){
    const track = ACTIVITIES.find(a => a.key === trackKey);
    if(!track || !Array.isArray(LOGS)) return null;
    const hits = LOGS.filter(l => track.match.includes(l.activity));
    return { sessions: hits.length /*, streaks, last-done, etc. later */ };
  },

  // future: return a proposed next-unlock string for a track
  suggestUnlock(/* trackKey */){
    // will call a model (via a serverless function) using momentum() as context
    return null;
  },
};
