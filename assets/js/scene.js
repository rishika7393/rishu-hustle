/* =========================================================================
   scene.js — THE SCENE. Builds the road (active cars) and the lot (parked),
   using vehicles.js + the data in config.js. Runs on load.
   ========================================================================= */

function stall(v, driving){
  const el = document.createElement("div");
  el.className = "stall" + (driving ? " drive" : "");
  el.innerHTML = `
    <button class="spot" aria-expanded="false">
      ${vehicle(v)}
      <span class="name">${v.name}</span>
    </button>
    ${driving ? `<div class="flag">${v.flag}</div>` : ""}
    <div class="detail">
      <div class="dn">${v.name}</div>
      <div class="now">now · ${v.now}</div>
      <div class="unlock"><b>next</b> <span class="arrow">→</span> ${v.unlock}</div>
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

const roadEl = document.getElementById("road");
active.forEach(v => roadEl.appendChild(stall(v, true)));
const lotEl = document.getElementById("lot");
parked.forEach(v => lotEl.appendChild(stall(v, false)));

document.addEventListener("click", ()=>{
  document.querySelectorAll(".stall.open").forEach(s=>{ s.classList.remove("open"); s.querySelector(".spot").setAttribute("aria-expanded","false"); });
  hideToast();
});

