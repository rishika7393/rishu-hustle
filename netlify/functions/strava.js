// Netlify function: fetches your runs from Intervals.icu.
// (Still named strava.js so the site's fetch URL doesn't change.)
//
// Env vars (Netlify → Site configuration → Environment variables):
//   INTERVALS_API_KEY      (Settings → Developer Settings on intervals.icu)
//   INTERVALS_ATHLETE_ID   (your athlete id from that page, e.g. i657102)
//
// Never hard-crashes: on any problem it returns small JSON describing why.

const API = "https://intervals.icu/api/v1";
const SEASON_START = "2026-09-01";

exports.handler = async () => {
  try {
    const KEY = process.env.INTERVALS_API_KEY;
    const ATH = process.env.INTERVALS_ATHLETE_ID;
    if (!KEY) return debug("missing INTERVALS_API_KEY env var");
    if (!ATH) return debug("missing INTERVALS_ATHLETE_ID env var");

    const auth = "Basic " + Buffer.from("API_KEY:" + KEY).toString("base64");
    const url = `${API}/athlete/${ATH}/activities`
              + `?oldest=${SEASON_START}`
              + `&fields=name,start_date_local,type,distance,moving_time`;

    const res = await fetch(url, { headers: { Authorization: auth } });
    const text = await res.text();

    if (!res.ok) {
      return debug("intervals responded " + res.status, text.slice(0, 300));
    }

    let acts;
    try { acts = JSON.parse(text); }
    catch (e) { return debug("could not parse intervals response", text.slice(0, 300)); }

    const runs = (Array.isArray(acts) ? acts : [])
      .filter(a => (a.type || "").toLowerCase().includes("run"))
      .map(a => ({
        date: (a.start_date_local || "").slice(0, 10),
        minutes: a.moving_time ? Math.round(a.moving_time / 60) : null,
        distance_km: a.distance ? Math.round(a.distance / 100) / 10 : null,
        name: a.name || "run",
      }));

    return json(runs, 300);
  } catch (e) {
    return debug("function threw", String((e && e.message) || e));
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

function debug(reason, detail) {
  return json({ error: reason, detail: detail || null });
}
