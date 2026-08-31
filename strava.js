// Netlify function: keeps your Strava client_secret server-side.
// Two jobs:
//   1) FIRST-TIME SETUP — visit .../strava?code=XXX (Strava sends this after you approve).
//      It swaps the code for a refresh token and prints it, so you can save it as an env var.
//   2) NORMAL USE — with STRAVA_REFRESH_TOKEN set, it returns your recent runs as JSON.
//
// Env vars to set in Netlify (Site configuration → Environment variables):
//   STRAVA_CLIENT_ID       (from your Strava API app)
//   STRAVA_CLIENT_SECRET   (from your Strava API app — NEVER put this in the site)
//   STRAVA_REFRESH_TOKEN   (you get this from the one-time setup step below)

const TOKEN_URL = "https://www.strava.com/oauth/token";
const ACTS_URL  = "https://www.strava.com/api/v3/athlete/activities";
const SEASON_START = "2026-09-01"; // only pull runs from the sprint window on

exports.handler = async (event) => {
  const CID    = process.env.STRAVA_CLIENT_ID;
  const SECRET = process.env.STRAVA_CLIENT_SECRET;
  const REFRESH = process.env.STRAVA_REFRESH_TOKEN;
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!CID || !SECRET) {
    return { statusCode: 500, body: "Missing STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET env vars." };
  }

  // ---------- 1) one-time setup: exchange the auth code for a refresh token ----------
  if (code) {
    const r = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: CID, client_secret: SECRET, code, grant_type: "authorization_code" }),
    });
    const t = await r.json();
    const rt = t.refresh_token || "(no refresh_token — check scope/code)";
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `<div style="font-family:system-ui;max-width:640px;margin:40px auto;line-height:1.6">
        <h2>Almost there.</h2>
        <p>Copy this value and add it in Netlify as <b>STRAVA_REFRESH_TOKEN</b>, then redeploy:</p>
        <pre style="background:#f4f4f4;padding:16px;border-radius:8px;font-size:18px;user-select:all">${rt}</pre>
        <p>Then delete this browser tab. Your site will start showing runs.</p>
      </div>`,
    };
  }

  // ---------- 2) normal use: refresh the token, fetch recent runs ----------
  if (!REFRESH) return json([]); // not finished setup yet — site just shows no runs

  const tr = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CID, client_secret: SECRET, refresh_token: REFRESH, grant_type: "refresh_token" }),
  });
  const tok = await tr.json();
  if (!tok.access_token) return json([]);

  const after = Math.floor(new Date(SEASON_START).getTime() / 1000);
  const ar = await fetch(`${ACTS_URL}?after=${after}&per_page=100`, {
    headers: { Authorization: "Bearer " + tok.access_token },
  });
  const acts = await ar.json();

  const runs = (Array.isArray(acts) ? acts : [])
    .filter(a => a.type === "Run" || a.sport_type === "Run")
    .map(a => ({
      date: (a.start_date_local || "").slice(0, 10),
      minutes: a.moving_time ? Math.round(a.moving_time / 60) : null,
      distance_km: a.distance ? Math.round(a.distance / 100) / 10 : null,
      name: a.name || "run",
    }));

  return json(runs, 300);
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
