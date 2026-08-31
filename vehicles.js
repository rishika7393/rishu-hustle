/* =========================================================================
   vehicles.js — THE ASSET LIBRARY. Every car/van/etc. is drawn here in SVG.
   Add a new vehicle 'type' by adding a branch in vehicle(), then reference it
   from config.js. This is where visual assets grow.
   ========================================================================= */

function paint(c){ return getComputedStyle(document.documentElement).getPropertyValue('--'+c).trim() || c; }

function vehicle(v){
  const col = paint(v.color);
  const dark = "rgba(0,0,0,.28)";
  const glass = "rgba(230,240,255,.28)";
  const badge = v.badge ? `<text x="60" y="26" font-size="17" text-anchor="middle">${v.badge}</text>` : "";
  const wheels = `
    <g class="wheel"><circle cx="34" cy="54" r="9" fill="#1a1a1a"/><circle cx="34" cy="54" r="3.4" fill="#5a5140"/></g>
    <g class="wheel"><circle cx="86" cy="54" r="9" fill="#1a1a1a"/><circle cx="86" cy="54" r="3.4" fill="#5a5140"/></g>`;
  const head = `<ellipse class="lamp-on" cx="112" cy="42" rx="6" ry="4" fill="var(--lamp-s)" opacity="0"/>`;

  let body = "";
  if(v.type==="car"){
    body = `
      <path d="M14 46 q2-16 16-17 l14-9 q6-3 14-3 l14 0 q9 0 15 8 l6 8 q14 1 14 13 l0 6 q0 3-3 3 l-96 0 q-3 0-3-3z" fill="${col}"/>
      <path d="M48 20 l12 0 0 12 -22 0 q4-11 10-12z" fill="${glass}"/>
      <path d="M64 20 q7 0 12 6 l4 6 -16 0 0-12z" fill="${glass}"/>
      <rect x="14" y="48" width="94" height="4" rx="2" fill="${dark}"/>`;
  } else if(v.type==="van" || v.type==="party"){
    const stripe = v.type==="party" ? `<rect x="18" y="30" width="80" height="4" fill="var(--lamp-s)"/><rect x="18" y="38" width="80" height="4" fill="var(--coral)"/>` : "";
    body = `
      <path d="M14 20 q0-6 6-6 l70 0 q10 0 14 10 l4 12 q2 4 2 9 l0 3 q0 3-3 3 l-90 0 q-3 0-3-3z" fill="${col}"/>
      <rect x="22" y="22" width="20" height="14" rx="2" fill="${glass}"/>
      <rect x="46" y="22" width="20" height="14" rx="2" fill="${glass}"/>
      <path d="M92 18 q7 1 10 9 l3 9 -13 0 0-18z" fill="${glass}"/>
      ${stripe}
      <rect x="14" y="48" width="98" height="4" rx="2" fill="${dark}"/>`;
  } else if(v.type==="roadtrip"){
    body = `
      <rect x="30" y="8" width="52" height="9" rx="3" fill="${paint('brick')}"/>
      <rect x="34" y="4" width="14" height="6" rx="2" fill="${paint('sky')}"/>
      <rect x="52" y="3" width="12" height="7" rx="2" fill="${paint('mustard')}"/>
      <path d="M14 46 q2-16 16-17 l14-9 q6-3 14-3 l14 0 q9 0 15 8 l6 8 q14 1 14 13 l0 6 q0 3-3 3 l-96 0 q-3 0-3-3z" fill="${col}"/>
      <path d="M48 20 l12 0 0 12 -22 0 q4-11 10-12z" fill="${glass}"/>
      <path d="M64 20 q7 0 12 6 l4 6 -16 0 0-12z" fill="${glass}"/>`;
  } else if(v.type==="learner"){
    body = `
      <path d="M14 46 q2-16 16-17 l14-9 q6-3 14-3 l14 0 q9 0 15 8 l6 8 q14 1 14 13 l0 6 q0 3-3 3 l-96 0 q-3 0-3-3z" fill="${col}"/>
      <path d="M48 20 l12 0 0 12 -22 0 q4-11 10-12z" fill="${glass}"/>
      <path d="M64 20 q7 0 12 6 l4 6 -16 0 0-12z" fill="${glass}"/>
      <rect x="82" y="40" width="16" height="14" rx="2" fill="#d6483f"/>
      <text x="90" y="51" font-size="11" fill="#fff" text-anchor="middle" font-family="Space Mono, monospace" font-weight="700">L</text>`;
  } else if(v.type==="covered"){
    body = `
      <path d="M12 50 q0-22 20-30 q28-11 56 0 q20 8 20 30 q0 3-3 3 l-90 0 q-3 0-3-3z" fill="#2b2619"/>
      <path d="M12 50 q0-22 20-30 q28-11 56 0 q20 8 20 30" fill="none" stroke="#4a3d1e" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="60" y="40" font-size="15" text-anchor="middle">🚗</text>
      <path d="M60 15 q-4 -8 -12 -6" fill="none" stroke="#4a3d1e" stroke-width="1.5"/>`;
  }
  return `<svg class="car" viewBox="0 0 120 64" role="img" aria-label="${v.name}">
      ${head}${body}${v.type!=="covered"?badge:""}${v.type!=="covered"?wheels:`<g class="wheel"><circle cx="34" cy="54" r="8" fill="#1a1a1a"/></g><g class="wheel"><circle cx="86" cy="54" r="8" fill="#1a1a1a"/></g>`}
    </svg>`;
}

/* ---------- render ---------- */
