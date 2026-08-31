// Netlify function: fetches your runs from Intervals.icu.
// (File is still named strava.js so the site's fetch URL doesn't change —
//  it reads runs, wherever they come from.)
//
// Intervals.icu is simple: no OAuth, no refresh tokens. Just an API key,
// which we keep server-side here so it never touches the browser.
//
// Env vars to set in Netlify (Site configuration → Environment variables):
//   INTERVALS_API_KEY      (Settings → Developer Settings on intervals.icu)
//   INTERVALS_ATHLETE_ID   (your athlete id, also on that settings page — e.g. i123456)

const API = "https://intervals.icu/api/v1";
const SEASON_START = "2026-09-01"; // only pull runs from the sprint window on

exports.handler = async () => {
  const KEY = process.env.56fmzkvy13kj3ugrcbs71zyrx;
  const ATH = process.env.i657102;
  if (!KEY || !ATH) return json([]); // not set up yet — site just shows no runs

  // Intervals.icu basic auth: username "API_KEY", password = your key
  const auth = "Basic " + Buffer.from("API_KEY:" + KEY).toString("base64");
  const url = `${API}/athlete/${ATH}/activities`
            + `?oldest=${SEASON_START}`
            + `&fields=name,start_date_local,type,distance,moving_time`;

  try {
    const res = await fetch(url, { headers: { Authorization: auth } });
    if (!res.ok) return json([]);
    const acts = await res.json();

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
    return json([]);
  }
};

function json(obj, cacheSeconds) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cacheSeconds ? `public, max-age=${cacheSeconds}` : "no-store",
    },
    body: JSON.stringify(obj),
  };
}
