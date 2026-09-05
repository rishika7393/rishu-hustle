/* =========================================================================
   sources.js — DATA LAYER. Reads Baserow + Strava, normalises rows, and
   turns a row into a human 'describe()' line. Swap/extend data sources here.
   ========================================================================= */

function val(f){ return (f && typeof f==="object" && "value" in f) ? f.value : f; }
// find a field by name regardless of caps/spaces/underscores (Baserow may rename)
function field(row, name){
  if(row && name in row) return row[name];
  const t = name.toLowerCase().replace(/[\s_]/g,"");
  for(const k in row){ if(k.toLowerCase().replace(/[\s_]/g,"")===t) return row[k]; }
  return undefined;
}
function num(f){ const v=val(f); return (v==null||v==="") ? null : Number(v); }
function txt(f){ const v=val(f); return (v==null) ? "" : String(v); }
function isoDate(raw){
  if(!raw) return null;
  const s = String(raw);
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);   // dd/mm/yyyy → yyyy-mm-dd
  return dmy ? `${dmy[3]}-${dmy[2]}-${dmy[1]}` : s.slice(0,10);
}
function mapRow(r){
  const g = n => field(r, n);
  const o = {
    date: isoDate(g("date")),
    activity: txt(g("activity")).toLowerCase(),
    minutes: num(g("minutes")),
    note: txt(g("note")),
    apps_added: num(g("apps_added")),
    reached_out: !!val(g("reached_out")),
    company: txt(g("company")),
    stage: txt(g("stage")),
    fitness_type: txt(g("fitness_type")),
    pushups: num(g("pushups")),
    scales: !!val(g("scales")),
    scales_bpm: num(g("scales_bpm")),
    fundamentals: !!val(g("fundamentals")),
    fundamentals_bpm: num(g("fundamentals_bpm")),
    song: txt(g("song")),
  };
  // safety net: if the form didn't tag the activity, infer it from the fields present
  if(!o.activity){
    if(o.scales || o.scales_bpm) o.activity = "vocals";
    else if(o.fundamentals || o.fundamentals_bpm) o.activity = "drums";
    else if(o.fitness_type || o.pushups) o.activity = "fitness";
    else if(o.apps_added || o.company || o.stage) o.activity = "lenny";
  }
  return o;
}

async function fetchBaserow(){
  const url = `https://api.baserow.io/api/database/rows/table/${TABLE_ID}/?user_field_names=true&size=200`;
  try{
    const res = await fetch(url, { headers:{ Authorization:"Token "+READ_TOKEN } });
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    if(!Array.isArray(data.results)) throw new Error("unexpected response");
    LIVE = true;
    return data.results.map(mapRow).filter(r => r.date && r.activity);
  }catch(e){
    console.warn("baserow read failed — showing sample data:", e);
    LIVE = false;
    LAST_ERR = (e && e.message) ? e.message : String(e);
    return sampleLogs();
  }
}

// pull runs from Strava via our Netlify function (returns [] until it's set up)
async function fetchStravaRuns(){
  try{
    const res = await fetch("/.netlify/functions/strava");
    if(!res.ok) return [];
    const runs = await res.json();
    if(!Array.isArray(runs)) return [];
    return runs.map(a => ({
      date: (a.date || "").slice(0,10),
      activity: "fitness",
      fitness_type: "run",
      minutes: (a.minutes ?? null),
      distance_km: (a.distance_km ?? null),
      note: a.name || "",
      source: "strava",
    })).filter(r => r.date);
  }catch(e){ return []; }
}

// the site reads both sources and merges them
async function fetchLogs(){
  const [base, runs] = await Promise.all([ fetchBaserow(), fetchStravaRuns() ]);
  return base.concat(runs);
}

function ymd(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function offset(d){ return (d.getDay()+6)%7; } // mon-first

// stand-in data if Baserow can't be reached
function sampleLogs(){
  const out=[];
  for(let d=new Date(WIN_START); d<=WIN_END; d.setDate(d.getDate()+1)){
    const dow=d.getDay(), dd=d.getDate(), date=ymd(d);
    if([1,3,5,6].includes(dow) && dd%7!==4) out.push({date, activity:"fitness", fitness_type:"strength", pushups:2+(dd%6), minutes:30});
    if([2,4].includes(dow))                 out.push({date, activity:"vocals", scales:true, scales_bpm:80+(dd%5)*5, song: dd%2?"a thousand years":"", minutes:30});
    if([3,6].includes(dow) && dd%2===0)     out.push({date, activity:"drums", fundamentals:true, fundamentals_bpm:90+(dd%4)*5, minutes:25});
    if([1,2,3,4].includes(dow) && dd%3===0) out.push({date, activity:"lenny", apps_added:1+(dd%3), reached_out:dd%2===0, company:dd%2?"linear":"vercel", stage:["researching","building","applied","reached out"][dd%4], minutes:60});
  }
  return out;
}

// turn a row into a short human line for the toast
function describe(r){
  const bits=[];
  if(r.activity==="lenny"){
    if(r.apps_added) bits.push(r.apps_added+" app"+(r.apps_added>1?"s":""));
    if(r.reached_out) bits.push("reached out");
    if(r.company) bits.push(r.company);
    if(r.stage) bits.push(r.stage);
  } else if(r.activity==="fitness"){
    if(r.fitness_type==="run"){
      const d=[]; if(r.distance_km) d.push(r.distance_km+"km"); if(r.minutes) d.push(r.minutes+"min");
      bits.push("run"+(d.length?" · "+d.join(" · "):"")+(r.source==="strava"?" ↗strava":""));
    } else {
      if(r.fitness_type) bits.push(r.fitness_type);
      if(r.pushups) bits.push(r.pushups+" pushups");
      else if(r.minutes) bits.push(r.minutes+" min");
    }
  } else if(r.activity==="vocals"){
    if(r.scales) bits.push("scales"+(r.scales_bpm?" @ "+r.scales_bpm+"bpm":""));
    if(r.song) bits.push(r.song);
  } else if(r.activity==="drums"){
    if(r.fundamentals) bits.push("fundamentals"+(r.fundamentals_bpm?" @ "+r.fundamentals_bpm+"bpm":""));
    if(r.song) bits.push(r.song);
  }
  if(r.note) bits.push(r.note);
  return bits.join(" · ") || "logged";
}


/* ---------- pursuits: the cars, read from Baserow (falls back to config.js) ---------- */
function mapPursuit(r){
  const g = n => field(r, n);
  const p = val(g("private"));
  return {
    sort:   num(g("sort")) ?? 0,
    name:   txt(g("name")),
    key:    txt(g("key")),
    status: txt(g("status")).toLowerCase(),
    private: (p===true || String(p).toLowerCase()==="true"),
    type:   txt(g("type")).toLowerCase()  || "car",
    color:  txt(g("color")).toLowerCase() || "coral",
    badge:  txt(g("badge")),
    now:    txt(g("now")),
    unlock: txt(g("unlock")),
    flag:   txt(g("flag")),
  };
}

async function fetchPursuits(){
  const url = `https://api.baserow.io/api/database/rows/table/${PURSUITS_TABLE}/?user_field_names=true&size=200`;
  try{
    const res = await fetch(url, { headers:{ Authorization:"Token "+READ_TOKEN } });
    if(!res.ok) throw new Error("HTTP "+res.status);
    const data = await res.json();
    if(!Array.isArray(data.results)) throw new Error("unexpected response");
    const all = data.results.map(mapPursuit).filter(p => p.name && p.name !== "");
    all.sort((a,b) => a.sort - b.sort);
    const active = all.filter(p => p.status === "active");
    const parked = all.filter(p => p.status !== "active");
    if(!active.length && !parked.length) throw new Error("no usable rows");
    return { active, parked };
  }catch(e){
    console.warn("pursuits read failed — keeping the built-in list:", e);
    return null;
  }
}
