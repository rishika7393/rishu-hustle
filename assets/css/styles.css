/* =========================================================================
   scene.js — THE SCENE. Builds the road (active cars) and the lot (parked).
   Renders the built-in list from config.js instantly, then re-renders with
   the live Baserow list when main.js hands it over via applyPursuits().
   ========================================================================= */

function stall(v, driving){
  const priv   = !!v.private;                                  // private car → drawn as a tarp, details hidden
  const shown  = priv ? Object.assign({}, v, { type:"covered" }) : v;
  const name   = priv ? "— — —" : v.name;
  const nowL   = priv ? "kept to myself" : v.now;
  const unlockL= priv ? "private. that’s all you get." : v.unlock;

  const el = document.createElement("div");
  el.className = "stall" + (driving ? " drive" : "");
  el.innerHTML = `
    <button class="spot" aria-expanded="false">
      ${vehicle(shown)}
      <span class="name">${name}</span>
    </button>
    ${driving ? `<div class="flag">${v.flag}</div>` : ""}
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
    // clicking a car on the road also swings the calendar to that pursuit
    if(driving && v.key && typeof renderCal==="function"){ current = v.key; renderCal(); }
    hideToast();
  });
  return el;
}

/* live copies — start as the built-in fallback from config.js, get replaced when Baserow answers.
   the config arrays are `const` (they never change); these are `let` (they do). that's the whole reason. */
let sceneActive = active;
let sceneParked = parked;

function buildScene(){
  const roadEl = document.getElementById("road");
  const lotEl  = document.getElementById("lot");
  if(!roadEl || !lotEl) return;
  roadEl.innerHTML = "";                                       // clear first so re-renders don't stack
  lotEl.innerHTML  = "";
  sceneActive.forEach(v => roadEl.appendChild(stall(v, true)));
  sceneParked.forEach(v => lotEl.appendChild(stall(v, false)));
}

// main.js calls this once Baserow returns; null/empty → keep the built-in list
function applyPursuits(p){
  if(p && (p.active.length || p.parked.length)){
    sceneActive = p.active;
    sceneParked = p.parked;
  }
  buildScene();
}

buildScene(); // first paint — from the built-in list, instantly, before the network answers

document.addEventListener("click", ()=>{
  document.querySelectorAll(".stall.open").forEach(s=>{ s.classList.remove("open"); s.querySelector(".spot").setAttribute("aria-expanded","false"); });
  hideToast();
});
