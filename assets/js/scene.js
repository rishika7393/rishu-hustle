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

  // custom car image (assets/cars/<img>) when set + not private; otherwise the SVG car
  const carHTML = (v.img && !priv)
    ? `<img class="carimg" src="assets/cars/${v.img}" alt="${name}" loading="lazy">`
    : vehicle(shown);

  const el = document.createElement("div");
  el.className = "stall" + (driving ? " drive" : "");
  el.innerHTML = `
    <button class="spot" aria-expanded="false" aria-label="${name}">
      ${vehicle(shown)}
    </button>
    ${driving
      ? `<div class="mrow"><div class="mname">${name}</div><div class="flag">${v.flag||""}</div></div>`
      : `<div class="cap">${name}</div>`}`;

  const btn = el.querySelector(".spot");
  btn.addEventListener("click", (e)=>{
    e.stopPropagation();
    if(driving && v.key && typeof renderCal==="function"){ current = v.key; renderCal(); }  // road car -> swing the calendar
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

// main.js calls this once Baserow returns; null/empty keeps the fallback
function applyPursuits(p){
  if(p && (p.active.length || p.parked.length)){ LIVE_ACTIVE = p.active; LIVE_PARKED = p.parked; }
  buildRoad();
}

buildRoad();  // instant paint from the fallback; repaints when Baserow answers

document.addEventListener("click", ()=>{ hideToast(); });
