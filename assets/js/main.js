/* =========================================================================
   main.js — BOOTSTRAP (full: 2D redesign + 3D basement).
   ========================================================================= */

// LOGS → the log calendar, lately feed, and the live ticker
fetchLogs().then(renderLog);

// PURSUITS → the road (applyPursuits repaints from Baserow); also feeds the basement
const pursuitsReady = fetchPursuits().then(applyPursuits);

// PROJECTS → the lenny-100 highway plates
fetchProjects().then(applyProjects);

// BASEMENT → needs the 3D lib + fonts (for plate text) + the parked data, whichever is slowest
function startBasement(){
  const gload = document.getElementById("gload");
  if(typeof THREE === "undefined"){ if(gload) gload.textContent = "3d couldn't load — check your connection, then reload"; return; }
  if(typeof __initBasement === "function") __initBasement();   // self-guards against double-init
}
const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.all([document.fonts.load("700 40px Oswald"), document.fonts.load("700 40px Caveat")]).catch(()=>{})
  : Promise.resolve();
Promise.all([fontsReady, pursuitsReady]).then(startBasement).catch(startBasement);
setTimeout(startBasement, 4000);   // fallback if something stalls; init is guarded
