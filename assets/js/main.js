/* =========================================================================
   main.js — BOOTSTRAP (batch 1: 2D redesign, no 3D basement yet).
   ========================================================================= */

// LOGS → the log calendar, lately feed, and the live ticker (inside renderInfo)
fetchLogs().then(renderLog);

// PURSUITS → the road + parked grid (applyPursuits repaints from Baserow)
fetchPursuits().then(applyPursuits);

// PROJECTS → the lenny-100 highway plates (applyProjects redraws the strip)
fetchProjects().then(applyProjects);
