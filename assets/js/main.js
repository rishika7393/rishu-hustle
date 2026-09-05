/* =========================================================================
   main.js — BOOTSTRAP. Kicks off the data loads and the ticker.
   ========================================================================= */

fetchLogs().then(renderLog);

// pull the lot from Baserow; applyPursuits re-renders it (or keeps the built-in list on failure)
if(typeof fetchPursuits==="function"){
  fetchPursuits().then(applyPursuits);
}

/* ---------- ticker ---------- */
const items = [
  "up next", "sep 27 — race no.1", "ship application #1", "dec 13 — race no.2",
  "lowkey jam in sept", "a quest in oct", "first full pushup", "one clean song",
];
const line = items.map((t,i)=> i===0 ? `<b>${t}</b>` : t).join(`<span class="sep">/</span>`);
document.getElementById("tick").innerHTML = `<span>${line}<span class="sep">/</span>${line}</span>`;
