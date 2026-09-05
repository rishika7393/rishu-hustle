/* =========================================================================
   highway.js — lenny-100 highway + the live information layer (renderInfo, ticker).
   ========================================================================= */

const RACES = [
  { name:"race no.1", date:"2026-09-27" },
  { name:"race no.2", date:"2026-12-13" },
];

/* ---------- lenny 100 ----------
   100 days of shipping small things. a project owns a RANGE of days, so a
   week-long build reads as seven days of work, not six days of nothing.
   status: "wip" while it's in the shop, "shipped" once it's out. */
const LENNY_START = new Date(2026, 7, 20);   // aug 20 '26 = day 1. change me.
let projects = [   // fallback until Baserow answers (see applyProjects)
  { n:1, name:"the lot",      week:1, status:"shipped", url:"" },
  { n:2, name:"dusk palette", week:1, status:"shipped", url:"" },
  { n:3, name:"the basement", week:2, status:"shipped", url:"" },
  { n:4, name:"the 100 wall", week:2, status:"wip",     url:"" },
];

/* ---------- draw a vehicle in SVG ---------- */

const DAY = 86400000;
function midnight(d){ const x = new Date(d); x.setHours(0,0,0,0); return x; }
function today0(){ return midnight(new Date()); }
function parseYMD(s){ const [y,m,d] = String(s).split("-").map(Number); return new Date(y, m-1, d); }
function daysAgo(s){ return s ? Math.round((today0() - midnight(parseYMD(s))) / DAY) : null; }

function dayOf100(){
  return Math.max(1, Math.min(100, Math.floor((today0() - midnight(LENNY_START)) / DAY) + 1));
}

// only rows up to today — a future-dated row shouldn't inflate a streak
function pastLogs(){ const t = ymd(today0()); return LOGS.filter(l => l.date <= t); }

function logsFor(key){
  const a = ACTIVITIES.find(x => x.key === key);
  if(!a) return [];
  return pastLogs().filter(l => a.match.includes(l.activity)).sort((x,y) => x.date < y.date ? -1 : 1);
}

// weekdays only — a weekend off shouldn't kill a streak, and today being blank shouldn't either
function streakOf(dateSet){
  let n = 0, guard = 0;
  const d = today0();
  if(!dateSet.has(ymd(d))) d.setDate(d.getDate() - 1);
  while(guard++ < 400){
    const dow = d.getDay();
    if(dow === 0 || dow === 6){ d.setDate(d.getDate() - 1); continue; }
    if(!dateSet.has(ymd(d))) break;
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}
function longestStreak(dateSet){
  const days = [...dateSet].sort();
  let best = 0, run = 0, prev = null;
  days.forEach(s => {
    const d = parseYMD(s);
    if(prev){
      let step = midnight(prev); let gap = 0;
      do { step.setDate(step.getDate() + 1); if(step.getDay() !== 0 && step.getDay() !== 6) gap++; }
      while(step < d && gap < 9);
      run = gap <= 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run); prev = d;
  });
  return best;
}
function lanesThisWeek(){
  const cut = ymd(new Date(today0() - 6 * DAY));
  const keys = pastLogs().filter(l => l.date >= cut)
    .map(l => { const a = ACTIVITIES.find(x => x.match.includes(l.activity)); return a ? a.key : null; })
    .filter(Boolean);
  return new Set(keys).size;
}

// tiny inline sparkline
function runningMax(a){ let m = -Infinity; return a.map(v => (m = Math.max(m, v))); }
function cumulative(a){ let s = 0; return a.map(v => (s += (v || 0))); }
function spark(series, w, h){
  if(!series || series.length < 2) return "";
  const mn = Math.min(...series), mx = Math.max(...series), r = (mx - mn) || 1;
  const pts = series.map((v,i) => [ 2 + i * (w - 4) / (series.length - 1), h - 2 - ((v - mn) / r) * (h - 4) ]);
  const d = pts.map((p,i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
    <path d="${d}"/><circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.6"/></svg>`;
}

/* the headline capability number per active pursuit — "got better", not "showed up" */
function gaugeFor(key){
  const rows = logsFor(key);
  if(!rows.length) return null;

  if(key === "fitness"){
    const p = rows.map(r => r.pushups).filter(v => v != null);
    if(!p.length) return { text: rows.length + " sessions", series: [] };
    return { text: p[0] + " → " + Math.max(...p) + " pushups", series: runningMax(p) };
  }
  if(key === "voice"){
    const b = rows.map(r => r.scales_bpm != null ? r.scales_bpm : r.fundamentals_bpm).filter(v => v != null);
    const songs = new Set(rows.map(r => r.song).filter(Boolean)).size;
    const sl = songs + " song" + (songs === 1 ? "" : "s");
    if(!b.length) return { text: sl + " touched", series: [] };
    return { text: b[0] + " → " + Math.max(...b) + " bpm · " + sl, series: runningMax(b) };
  }
  if(key === "lenny"){
    const co = new Set(rows.map(r => r.company).filter(Boolean)).size;
    const applied = rows.filter(r => /appl/i.test(r.stage || "")).length;
    const out = rows.filter(r => r.reached_out).length;
    return { text: co + " studied · " + applied + " applied · " + out + " reach-outs",
             series: cumulative(rows.map(r => r.apps_added || 0)) };
  }
  return { text: rows.length + " sessions", series: [] };
}

/* ---------- races ---------- */
function nextRace(){
  const t = ymd(today0());
  return RACES.filter(r => r.date >= t).sort((a,b) => a.date < b.date ? -1 : 1)[0] || null;
}
function daysTo(dateStr){ return -daysAgo(dateStr); }

/* ---------- the 100 ----------
   15 weeks laid out along a road you scroll. the wheel and the strip are two
   handles on the same value: strip.scrollLeft is the only source of truth. */
const WEEKS = Math.ceil(100 / 7);
const TURNS = 0.75;                     // wheel turns across the WHOLE strip. lower = more scroll per turn.
const TOTAL_DEG = 360 * TURNS;
function currentWeek(){ return Math.ceil(dayOf100() / 7); }

function renderWall(){
  const box = document.getElementById("strip100");
  if(!box) return;
  const now = currentWeek(), byWeek = {};
  projects.forEach(p => (byWeek[p.week] = byWeek[p.week] || []).push(p));

  let h = "";
  for(let w = 1; w <= WEEKS; w++){
    const list = byWeek[w] || [];
    const cls = "wcol" + (w === now ? " now" : "") + (w > now ? " ahead" : "");
    const plates = list.length
      ? list.map(p => {
          const pc = "plate" + (p.status === "wip" ? " wip" : "");
          const inner = `<span class="no">${String(p.n).padStart(2,"0")}</span>${p.name}`;
          return p.url ? `<a class="${pc}" href="${p.url}" target="_blank" rel="noopener">${inner}</a>`
                       : `<div class="${pc}">${inner}</div>`;
        }).join("")
      : `<div class="plate blank"></div>`;
    h += `<div class="${cls}" data-w="${w}"><div class="wlab">wk ${String(w).padStart(2,"0")}</div>${plates}</div>`;
  }
  box.innerHTML = '<div class="wspacer"></div>' + h + '<div class="wspacer"></div>';
  initWheel(1);   // start centered on week 1; spacers let the ends reach the focal centre
}

let wheelWired = false;
function initWheel(startWeek){
  if(wheelWired){ requestAnimationFrame(()=>{ if(initWheel.remeasure) initWheel.remeasure(); if(initWheel.centerOn) initWheel.centerOn(startWeek); }); return; }
  const strip = document.getElementById("strip100");
  const wheel = document.getElementById("swheel");
  const rot   = document.getElementById("swrot");
  const road  = document.getElementById("hwroad");
  const label = document.getElementById("wtxt");
  if(!strip || !wheel || !rot) return;
  wheelWired = true;

  let COLS = [];                                   // cached; re-read only on resize
  function measure(){
    const cw0 = (strip.querySelector(".wcol") || {}).offsetWidth || 120;
    const pad = Math.max(0, strip.clientWidth / 2 - cw0 / 2);
    strip.querySelectorAll(".wspacer").forEach(sp => { sp.style.flex = "none"; sp.style.width = pad + "px"; });
    COLS = [...strip.querySelectorAll(".wcol")].map(c => ({
    el: c, w: Number(c.dataset.w), mid: c.offsetLeft + c.offsetWidth / 2,
    left: c.offsetLeft, width: c.offsetWidth,
    base: c.classList.contains("ahead") ? 0.5 : 1 })); }
  const maxScroll = () => Math.max(1, strip.scrollWidth - strip.clientWidth);

  // `pos` is the float truth for the animation. reading back scrollLeft every frame
  // rounds to whole pixels, which is what made the motion stutter.
  let pos = 0, target = 0, deg = 0, raf = 0, dragging = false, lastNear = -1;

  function paint(){
    rot.setAttribute("transform", `rotate(${deg.toFixed(2)} 50 50)`);
    if(road) road.style.setProperty("--dash", (-pos * 0.55).toFixed(1) + "px");

    const half = strip.clientWidth / 2, mid = pos + half;
    let near = 1, best = Infinity;
    for(const c of COLS){
      const dist = c.mid - mid, ad = Math.abs(dist);
      if(ad < best){ best = ad; near = c.w; }
      // 0 at the centre of the view, 1 once it's off the edge — drives scale + fade
      const t = Math.min(1, Math.max(0, (ad - half * 0.34) / (half * 0.72)));
      c.el.style.opacity   = (c.base * (1 - 0.82 * t * t)).toFixed(3);
      c.el.style.transform = `scale(${(1 - 0.17 * t).toFixed(3)})`;
    }
    if(near !== lastNear){                          // only touch the DOM when the week changes
      lastNear = near;
      const list = projects.filter(p => p.week === near);
      if(label) label.innerHTML = `week <b>${near}</b> of ${WEEKS}` +
        `<span class="hint">${list.length ? list.map(p => p.name).join(" · ") : "nothing shipped"}</span>`;
      wheel.setAttribute("aria-valuenow", near);
    }
  }

  function loop(){
    const d = target - pos;
    if(Math.abs(d) < 0.15){ pos = target; strip.scrollLeft = pos; paint(); raf = 0; return; }
    pos += d * 0.24;
    strip.scrollLeft = pos;
    paint();
    raf = requestAnimationFrame(loop);
  }
  function run(){ if(!raf) raf = requestAnimationFrame(loop); }

  function setTarget(px){
    target = Math.max(0, Math.min(maxScroll(), px));
    deg = (target / maxScroll()) * TOTAL_DEG;
  }
  function centerOn(w){
    const c = COLS.find(x => x.w === w);
    if(c) setTarget(c.left - (strip.clientWidth - c.width) / 2);
    run();
  }
  initWheel.centerOn = centerOn;
  initWheel.remeasure = measure;

  // swiping the road directly — the wheel follows it
  strip.addEventListener("scroll", () => {
    steered();
    if(dragging || raf) return;                     // the wheel is driving; don't fight it
    pos = target = strip.scrollLeft;
    deg = (pos / maxScroll()) * TOTAL_DEG;
    paint();
  }, { passive:true });

  window.addEventListener("resize", () => { measure(); paint(); });

  // ---- turning the wheel ----
  function polar(e){
    const r = wheel.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    return { a: Math.atan2(dy, dx) * 180 / Math.PI, grip: Math.hypot(dx, dy) / (r.width / 2) };
  }
  const glass = wheel.closest(".glass");
  let touched = false;
  function steered(){ if(touched) return; touched = true; if(glass) glass.classList.add("steered"); }
  setTimeout(steered, 15000);                        // stop nagging eventually

  const DEAD = 0.30;     // inside this radius the angle is meaningless
  const MAXSTEP = 40;    // never accept more than this from one move event
  let prev = null;

  wheel.addEventListener("pointerdown", e => {
    e.preventDefault();
    wheel.setPointerCapture(e.pointerId);
    dragging = true;
    const p = polar(e);
    prev = p.grip < DEAD ? null : p.a;
    pos = target = strip.scrollLeft;
    deg = (pos / maxScroll()) * TOTAL_DEG;
    wheel.classList.add("grabbing");
    steered();
  });
  wheel.addEventListener("pointermove", e => {
    if(!dragging) return;
    if(e.pointerType === "mouse" && e.buttons === 0){   // button not held -> not a real drag; stop
      dragging = false; prev = null; wheel.classList.remove("grabbing"); return;
    }
    const p = polar(e);
    if(p.grip < DEAD){ prev = null; return; }        // hand on the hub: no turn
    if(prev === null){ prev = p.a; return; }         // re-acquire without jumping
    let d = p.a - prev;
    while(d > 180) d -= 360;
    while(d < -180) d += 360;
    prev = p.a;
    if(Math.abs(d) > MAXSTEP) d = Math.sign(d) * MAXSTEP;
    deg = Math.max(0, Math.min(TOTAL_DEG, deg + d));  // wheel answers the hand with no lag
    target = (deg / TOTAL_DEG) * maxScroll();         // road catches up
    run();
  });
  const release = () => { dragging = false; prev = null; wheel.classList.remove("grabbing"); run(); };
  wheel.addEventListener("pointerup", release);
  wheel.addEventListener("pointercancel", release);
  window.addEventListener("pointerup", release);      // release even if the mouse-up lands off the wheel
  window.addEventListener("pointercancel", release);

  wheel.addEventListener("keydown", e => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if(!step) return;
    e.preventDefault();
    centerOn(Math.max(1, Math.min(WEEKS, Number(wheel.getAttribute("aria-valuenow")) + step)));
  });

  requestAnimationFrame(() => { measure(); pos = strip.scrollLeft; centerOn(startWeek); });
}

/* ---------- head numbers, strip, odometer ---------- */
function renderInfo(){
  const past = pastLogs();
  const all = new Set(past.map(l => l.date));
  const streak = streakOf(all);
  const lastDay = [...all].sort().pop();
  const since = daysAgo(lastDay);

  document.getElementById("stamp").innerHTML = `lenny 100 · day ${dayOf100()} of 100`;

  renderWall();

  const week = ymd(new Date(today0() - 6 * DAY));
  const weekSessions = past.filter(l => l.date >= week).length;
  document.getElementById("roadnum").innerHTML =
    `<b>${weekSessions}</b> sessions this week · <b>${lanesThisWeek()}</b> of 3 lanes touched`;

  // the odometer: every number lives here, and nowhere else
  const fit = logsFor("fitness").map(r => r.pushups).filter(v => v != null);
  const race = nextRace();
  const shipped = projects.filter(p => p.status !== "wip").length;

  const items = [];
  items.push(`<span class="up">day ${dayOf100()}/100</span>`);
  items.push(`<b>${streak}</b> day logging streak`);
  if(fit.length) items.push(`<b>${Math.max(...fit)}</b> pushups reached · from ${fit[0]}`);
  items.push(`<b>${shipped}</b> projects shipped`);
  if(race) items.push(`<b>${daysTo(race.date)}</b> days to ${race.name}`);
  ACTIVITIES.forEach(a => { const g = gaugeFor(a.key); if(g) items.push(`${a.name} · <b>${g.text}</b>`); });
  items.push(`<b>${past.length}</b> sessions logged`);
  if(since != null) items.push(since === 0 ? `logged today ✓` : `last logged <b>${since}d</b> ago`);
  items.push(`best streak <b>${longestStreak(all)}</b>`);

  const line = items.join(`<span class="sep">/</span>`);
  document.getElementById("tick").innerHTML = `<span>${line}<span class="sep">/</span>${line}</span>`;
}


/* live projects — main.js calls this when Baserow answers; redraws the strip + wheel */
function applyProjects(list){
  if(list && list.length){ projects = list; }
  if(typeof renderInfo === "function" && Array.isArray(LOGS) && LOGS.length){
    try{ renderInfo(); }catch(e){ console.warn("projects re-render:", e); }
  }
}
