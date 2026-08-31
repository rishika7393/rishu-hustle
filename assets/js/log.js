/* =========================================================================
   log.js — THE LOG UI. Calendar strip, 'lately' feed, and the day toast.
   ========================================================================= */

function showToast(html){
  const t = document.getElementById("toast");
  t.innerHTML = html; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}
function hideToast(){
  const t = document.getElementById("toast");
  if(t) t.classList.remove("show");
  clearTimeout(toastTimer);
  document.querySelectorAll(".cell.sel").forEach(c=>c.classList.remove("sel"));
}

function select(key){
  document.querySelectorAll(".cell.sel").forEach(c=>c.classList.remove("sel"));
  document.querySelectorAll('[data-d="'+key+'"]').forEach(c=>c.classList.add("sel"));
  const items = byDate[key] || [];
  const [y,m,d] = key.split("-").map(Number);
  const head = `<div class="pd">${d} ${MN[m-1]}</div>`;
  const body = items.length
    ? items.map(e=>`<div class="prow"><span class="chip" style="background:var(--${e.color})"></span> ${e.name} <span class="nt">— ${e.note}</span></div>`).join("")
    : `<div class="pempty">rest day — nothing logged.</div>`;
  showToast(head + body);
}

function renderCal(){
  const act = ACTIVITIES.find(a=>a.key===current);
  const done = new Set(LOGS.filter(l=> act.match.includes(l.activity)).map(l=>l.date));

  const days = [];
  for(let d=new Date(WIN_START); d<=WIN_END; d.setDate(d.getDate()+1)){
    if(offset(d) < 5) days.push(new Date(d));
  }
  let cells = "", total = 0, prevM = null;
  for(let p=0; p<offset(days[0]); p++) cells += `<div class="cell pad"></div>`;
  days.forEach(d=>{
    const key = ymd(d), on = done.has(key); if(on) total++;
    const first = d.getMonth()!==prevM ? " mstart" : ""; prevM = d.getMonth();
    cells += `<div class="cell${on?' on':''}${first}" style="--c:var(--${act.color})" data-d="${key}"></div>`;
  });
  document.getElementById("cal").innerHTML = cells;
  document.getElementById("ylab").innerHTML = YWD.map(w=>`<span>${w}</span>`).join("");
  document.getElementById("logcap").innerHTML =
    `<b>${act.name}</b> · ${total} sessions across sept–dec · weekends hidden`;

  document.querySelectorAll("#logtabs button").forEach(b=>{
    b.classList.toggle("active", b.dataset.k===current);
    b.style.setProperty("--tc", `var(--${ACTIVITIES.find(a=>a.key===b.dataset.k).color})`);
  });
}

function fmtDate(s){ const [y,m,d]=s.split("-").map(Number); return d+" "+MN[m-1]; }
function renderRecent(logs){
  const box = document.getElementById("recent");
  if(!box) return;
  const recent = [...logs].sort((a,b)=> a.date<b.date?1:(a.date>b.date?-1:0)).slice(0,3);
  if(!recent.length){ box.innerHTML = `<div class="rdet" style="padding:4px 2px">nothing logged yet — go tap a form.</div>`; return; }
  box.innerHTML = recent.map(r=>{
    const m = DATA_META[r.activity] || { name:r.activity||"—", color:"dim" };
    return `<div class="ritem">
      <span class="chip" style="background:var(--${m.color})"></span>
      <div class="mid"><div class="rname">${m.name}</div><div class="rdet">${describe(r)}</div></div>
      <span class="rdate">${fmtDate(r.date)}</span>
    </div>`;
  }).join("");
}

function renderLog(logs){
  LOGS = logs;
  byDate = {};
  logs.forEach(l=>{ const m = DATA_META[l.activity]; if(!m) return;
    (byDate[l.date]=byDate[l.date]||[]).push({ name:m.name, color:m.color, note:describe(l) }); });

  renderRecent(logs);

  const tabs = document.getElementById("logtabs");
  tabs.innerHTML = ACTIVITIES.map(a=>
    `<button data-k="${a.key}"><span class="chip" style="background:var(--${a.color})"></span>${a.name}</button>`).join("");
  tabs.addEventListener("click", e=>{
    const btn = e.target.closest("button"); if(!btn) return;
    current = btn.dataset.k; renderCal();
  });

  document.getElementById("cal").addEventListener("click", e=>{
    const c = e.target.closest(".cell");
    if(c && !c.classList.contains("pad")){ e.stopPropagation(); select(c.dataset.d); }
  });

  const foot = document.querySelector(".logfoot");
  if(foot){
    if(LIVE && logs.length) foot.textContent = `live from baserow ✓ — ${logs.length} sessions loaded`;
    else if(LIVE)           foot.textContent = `connected ✓ but read 0 rows — make sure the date + activity fields have values`;
    else                    foot.textContent = `couldn't reach baserow — ${LAST_ERR || "unknown error"} (showing sample data)`;
  }

  renderCal();
}
