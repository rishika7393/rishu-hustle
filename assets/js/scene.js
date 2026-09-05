/* =========================================================================
   scene.js — the road (active) + a parked grid, reading LIVE pursuits from
   the backend (fetchPursuits). Config arrays are the fallback until Baserow
   answers. The 3D basement (batch 2) will replace the parked grid.
   ========================================================================= */

function stall(v, driving){
  const priv   = !!v.private;                                   // private → tarp + details hidden
  const shown  = priv ? Object.assign({}, v, { type:"covered" }) : v;
  const name   = priv ? "— — —" : v.name;
  const nowL   = priv ? "kept to myself" : v.now;
  const unlockL= priv ? "private. that’s all you get." : v.unlock;

  const el = document.createElement("div");
  el.className = "stall" + (driving ? " drive" : "");
  el.innerHTML = `
    <button class="spot" aria-expanded="false" aria-label="${name}">
      ${vehicle(shown)}
    </button>
    ${driving
      ? `<div class="mrow"><div class="mname">${name}</div><div class="flag">${v.flag||""}</div></div>`
      : `<div class="cap">${name}</div>`}
    <div class="detail">
      <div class="dn">${name}</div>
      <div class="now">now · ${nowL}</div>
      <div class="unlock"><b>next</b> <span class="arrow">→</span> ${unlockL}</div>
    </div>`;

  const btn = el.querySelector(".spot");
  btn.addEventListener("click", (e)=>{
    e.stopPropagation();
    const wasOpen = el.classList.contains("open");
    document.querySelectorAll(".stall.open").forEach(s=>{ s.classList.remove("open"); s.querySelector(".spot").setAttribute("aria-expanded","false"); });
    if(!wasOpen){ el.classList.add("open"); btn.setAttribute("aria-expanded","true"); }
    if(driving && v.key && typeof renderCal==="function"){ current = v.key; renderCal(); }
    hideToast();
  });
  return el;
}

/* live pursuits — start as the config fallback, get replaced when Baserow answers.
   config arrays are `const` (fixed); these are `let` (they get swapped). */
let LIVE_ACTIVE = active;
let LIVE_PARKED = parked;

function buildRoad(){
  const roadEl = document.getElementById("road");
  if(!roadEl) return;
  roadEl.innerHTML = "";
  LIVE_ACTIVE.forEach(v => roadEl.appendChild(stall(v, true)));
}

/* temporary parked grid inside the basement section — batch 2 swaps in the 3D */
function buildLot(){
  const g = document.getElementById("garage");
  if(!g) return;
  ["scene","ghint","gload","g3dtip","g3ddetail"].forEach(id=>{ const n=g.querySelector("#"+id); if(n) n.style.display="none"; });
  let grid = g.querySelector(".lotgrid");
  if(!grid){ grid = document.createElement("div"); grid.className = "lotgrid"; g.appendChild(grid); }
  grid.innerHTML = "";
  LIVE_PARKED.forEach(v => grid.appendChild(stall(v, false)));
}

// main.js calls this once Baserow returns; null/empty keeps the fallback
function applyPursuits(p){
  if(p && (p.active.length || p.parked.length)){ LIVE_ACTIVE = p.active; LIVE_PARKED = p.parked; }
  buildRoad();
  buildLot();
}

buildRoad();  // instant paint from the fallback; repaints when Baserow answers
buildLot();

document.addEventListener("click", ()=>{
  document.querySelectorAll(".stall.open").forEach(s=>{ s.classList.remove("open"); s.querySelector(".spot").setAttribute("aria-expanded","false"); });
  hideToast();
});
