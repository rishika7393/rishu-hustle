/* =========================================================================
   config.js — THE CONTENT. Edit this file to change what the site shows.
   Your pursuits, the tracked activities, the calendar window, data source ids.
   No rendering logic lives here on purpose — it's the safe file to touch.
   ========================================================================= */

/* ================= THE LOG =================
   Data layer = 4 activities (lenny, fitness, vocals, drums).
   The UI groups vocals+drums into one "voice + drums" track.
   Reads live from Baserow; falls back to sample data if it can't reach it. */

// three UI tracks (each maps to one or more data activities)
const ACTIVITIES = [
  { key:"lenny",   name:"lenny 100",     color:"coral", match:["lenny"] },
  { key:"fitness", name:"fitness",       color:"teal",  match:["fitness"] },
  { key:"voice",   name:"voice + drums", color:"plum",  match:["vocals","drums"] },
];
// display info for each underlying data activity
const DATA_META = {
  lenny:  { name:"lenny 100", color:"coral" },
  fitness:{ name:"fitness",   color:"teal"  },
  vocals: { name:"vocals",    color:"plum"  },
  drums:  { name:"drums",     color:"plum"  },
};

const WIN_START = new Date(2026,8,1);   // sep 1
const WIN_END   = new Date(2026,11,31); // dec 31
const MN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

// ---- Baserow (read-only token — safe on the client) ----
const TABLE_ID   = 1165694;   // sessions (the log)
const PURSUITS_TABLE = 1178599; // pursuits (the cars)
const READ_TOKEN = "rYQOxjfcTxQ2kht7ouCmEcGkUv9lC9c0";
let LIVE = false;
let LAST_ERR = "";


/* ---- shared runtime state (filled in as the app runs) ---- */
let byDate = {};
let LOGS = [];
let current = "lenny";             // default view
const YWD = ["m","t","w","t","f"]; // mon–fri only

let toastTimer;

/* ---------- the data: change this, change the lot ---------- */
const active = [
  { name:"lenny 100", key:"lenny", type:"car", color:"coral", badge:"🎯",
    now:"applying with intention — study, build, reach out",
    unlock:"ship application #1 the right way: 1 company studied · 1 thing built · 1 human contacted",
    flag:"next stop → app #1" },
  { name:"fitness", key:"fitness", type:"car", color:"teal", badge:"💪",
    now:"20 knee pushups · 0 full ones · two races booked",
    unlock:"the first honest full pushup → then chase 15",
    flag:"sep 27 · dec 13 → 15 pushups" },
  { name:"voice + drums", key:"voice", type:"van", color:"plum", badge:"🎤",
    now:"vocal class on repeat · drums off pause",
    unlock:"carry one full song start-to-finish, on pitch, no hiding",
    flag:"next stop → one clean song" },
];

const parked = [
  { name:"guitar", type:"van", color:"mustard", badge:"🎸", now:"most songs", unlock:"ad libs → one clean solo" },
  { name:"bass", type:"car", color:"sky", badge:"🎵", now:"3–4 songs", unlock:"+1 song → +5 more" },
  { name:"piano", type:"van", color:"sage", badge:"🎹", now:"basics", unlock:"5 hrs of the course → basic reading" },
  { name:"swimming", type:"car", color:"teal", badge:"🏊", now:"butterfly only", unlock:"5 swims back → a lap target" },
  { name:"reading", type:"car", color:"brick", badge:"📚", now:"a few open", unlock:"finish + write a reflection → read 2 more" },
  { name:"visual art", type:"van", color:"coral", badge:"🎨", now:"solid", unlock:"make one small animation" },
  { name:"finance", type:"car", color:"mint", badge:"📈", now:"i get market structure", unlock:"read financials → swing trade" },
  { name:"badminton", type:"car", color:"sky", badge:"🏸", now:"okayish", unlock:"backhand + smashes" },
  { name:"table tennis", type:"car", color:"plum", badge:"🏓", now:"okayish", unlock:"post-smash rallies" },
  { name:"driving", type:"learner", color:"mustard", badge:"🚸", now:"nothing yet", unlock:"actually get the license" },
  { name:"maths", type:"car", color:"sage", badge:"➗", now:"rusty", unlock:"learn statistics" },
  { name:"photo + film", type:"van", color:"brick", badge:"🎬", now:"—", unlock:"shoot the beer movie → postcards for people" },
  { name:"travel", type:"roadtrip", color:"coral", badge:"✈️", now:"—", unlock:"girls&rsquo; trip → birthday trip" },
  { name:"curation", type:"car", color:"mustard", badge:"🎧", now:"—", unlock:"history of 10 great bands → nerd out on wine" },
  { name:"gen knowledge", type:"van", color:"teal", badge:"🌍", now:"—", unlock:"basics on every major country" },
  { name:"social", type:"party", color:"plum", badge:"🎉", now:"—", unlock:"lowkey jam in sept → a quest in oct" },
  { name:"shuffle dance", type:"car", color:"mint", badge:"🕺", now:"—", unlock:"just start" },
  { name:"— — —", type:"covered", color:"night", badge:"", now:"kept to myself", unlock:"private. there&rsquo;s a car under here. that&rsquo;s all you get." },
];
