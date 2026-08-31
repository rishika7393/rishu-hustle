// Netlify function: fetches your runs from Intervals.icu.
// (Named strava.js so the site's fetch URL stays the same — it reads runs.)
//
// Only NON-Strava-sourced runs come through with full data (distance/time),
// because Intervals must blank out Strava-sourced activities. Manual entries,
// direct device syncs, or Health-Sync pushes all work.
//
// Env vars (Netlify → Site configuration → Environment variables):
//   INTERVALS_API_KEY      (Settings → Developer Settings on intervals.icu)
//   INTERVALS_ATHLETE_ID   (your athlete id, e.g. i657102)

const API = "https://intervals.icu/api/v1";
const SEASON_START = "2026-09-01"; // the sprint window

exports.handler = async () => {
  try {
    const KEY = process.env.INTERVALS_API_KEY;
    const ATH = process.env.INTERVALS_ATHLETE_ID;
    if (!KEY || !ATH) return json([]); // not set up yet

    const auth = "Basic " + Buffer.from("API_KEY:" + KEY).toString("base64");
    const url = `${API}/athlete/${ATH}/activities?oldest=${SEASON_START}`;

    const res = await fetch(url, { headers: { Authorization: auth } });
    if (!res.ok) return json([]);
    const acts = await res.json();

    const runs = (Array.isArray(acts) ? acts : [])
      // keep runs that actually have data (Strava-sourced ones come back blank)
      .filter(a => (a.type || "").toLowerCase().includes("run") && a.distance != null)
      .map(a => ({
        date: (a.start_date_local || "").slice(0, 10),
        minutes: a.moving_time ? Math.round(a.moving_time / 60) : null,
        distance_km: a.distance ? Math.round(a.distance / 100) / 10 : null,
        name: a.name || "run",
      }));

    return json(runs, 300);
  } catch (e) {
    return json([]); // never break the site if Intervals hiccups
  }
};

function json(obj, cacheSeconds) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheSeconds ? "public, max-age=" + cacheSeconds : "no-store",
    },
    body: JSON.stringify(obj),
  };
}
