// Netlify function: fetches your runs from Intervals.icu.
// TEMP diagnostic + widened window. Add ?debug=1 to inspect raw data.
//
// Env vars: INTERVALS_API_KEY, INTERVALS_ATHLETE_ID

const API = "https://intervals.icu/api/v1";
const SEASON_START = "2026-03-01"; // TEMP widened for testing (set back to 2026-09-01 later)

exports.handler = async (event) => {
  try {
    const KEY = process.env.INTERVALS_API_KEY;
    const ATH = process.env.INTERVALS_ATHLETE_ID;
    if (!KEY) return debug("missing INTERVALS_API_KEY env var");
    if (!ATH) return debug("missing INTERVALS_ATHLETE_ID env var");

    const wantDebug = event.queryStringParameters && event.queryStringParameters.debug;

    const auth = "Basic " + Buffer.from("API_KEY:" + KEY).toString("base64");
    // NOTE: no more fields= filter — let Intervals return the full objects
    const url = `${API}/athlete/${ATH}/activities?oldest=${SEASON_START}`;

    const res = await fetch(url, { headers: { Authorization: auth } });
    const text = await res.text();
    if (!res.ok) return debug("intervals responded " + res.status, text.slice(0, 300));

    let acts;
    try { acts = JSON.parse(text); }
    catch (e) { return debug("could not parse intervals response", text.slice(0, 300)); }

    if (wantDebug) {
      const first = Array.isArray(acts) && acts[0] ? acts[0] : null;
      return json({
        count: Array.isArray(acts) ? acts.length : 0,
        types_seen: Array.isArray(acts) ? [...new Set(acts.map(a => a.type))] : "not-array",
        field_names_on_first: first ? Object.keys(first) : null,
        first_activity_full: first,
      });
    }

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

function debug(reason, detail) { return json({ error: reason, detail: detail || null }); }
