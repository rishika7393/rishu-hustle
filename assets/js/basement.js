
/* =========================================================================
   basement.js — the 3D parking garage (Three.js). Reads the live parked list
   from scene.js (LIVE_PARKED), masks any private car, draws them in stalls.
   ========================================================================= */

/* ============ 3D BASEMENT (hand-drawn, single scene) ============ */
function __initBasement(){
  if(window.__basementStarted) return; window.__basementStarted=true;
  const q = id => document.getElementById(id);
  if(typeof THREE==="undefined"){ const e=q("gload"); if(e) e.textContent="3d couldn't load — check your connection, then reload"; return; }

  const INK=0x2b2a26;
  function col(n){ return new THREE.Color(paint(n)||"#cccccc"); }
  function lambert(c){ return new THREE.MeshLambertMaterial({color:c}); }
  function carMat(c){ return new THREE.MeshLambertMaterial({color:c, emissive:c.clone().multiplyScalar(0.16)}); }
  const inkLine=new THREE.LineBasicMaterial({color:INK});
  function withEdges(m){ m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),inkLine)); return m; }
  const outlineMat=new THREE.MeshBasicMaterial({color:INK,side:THREE.BackSide});
  function outlined(geo,mat,grow){ const g=new THREE.Group(); g.add(new THREE.Mesh(geo,mat));
    const s=new THREE.Mesh(geo,outlineMat); const k=1+(grow||0.05); s.scale.set(k,k,k); g.add(s); return g; }
  const shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.22});
  function shadowBlob(r){ const s=new THREE.Mesh(new THREE.CircleGeometry(r||2.1,20),shadowMat);
    s.rotation.x=-Math.PI/2; s.position.y=0.03; return s; }
  function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r);
    c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function clean(s){ return (s||"").replace(/&rsquo;/g,"'").replace(/&amp;/g,"&"); }

  function plateTexture(name){
    const cv=document.createElement("canvas"); cv.width=256; cv.height=84; const c=cv.getContext("2d");
    c.fillStyle="#f6f6f1"; c.fillRect(0,0,256,84);                 // plate body
    c.fillStyle="#12357f"; c.fillRect(0,0,30,84);                  // EU-style blue strip
    c.fillStyle="#f2c53d"; c.font="600 15px Oswald, sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText("IND",15,58);
    c.strokeStyle="#0d0d0d"; c.lineWidth=6; c.strokeRect(4,4,248,76);
    const nm=clean(name).toUpperCase();
    c.fillStyle="#111"; c.textAlign="center"; c.textBaseline="middle";
    c.font=(nm.length>8?"700 40px ":"700 54px ")+"Oswald, 'Arial Narrow', Arial, sans-serif";
    c.fillText(nm, 30+(226/2), 44, 210);
    const t=new THREE.CanvasTexture(cv); t.anisotropy=4; return t;
  }
  function plate(name){ return new THREE.Mesh(new THREE.PlaneGeometry(1.75,0.58),
    new THREE.MeshBasicMaterial({map:plateTexture(name)})); }

  function buildCar(v){
    const g=new THREE.Group(); const t=v.type; const paintC=col(v.color);
    if(t==="covered"){
      const body=outlined(new THREE.BoxGeometry(5.4,2.0,2.9),lambert(new THREE.Color(0x8b8270)),0.045); body.position.y=1.3; g.add(body);
      const hump=outlined(new THREE.SphereGeometry(1.7,10,8),lambert(new THREE.Color(0x9a917c)),0.04);
      hump.scale.set(1.5,0.7,0.95); hump.position.set(-0.3,2.3,0); g.add(hump);
      g.add(shadowBlob(2.2)); g.userData.pursuit=v; return g;
    }
    const long=(t==="van"||t==="party")?6.2:5.4;
    const body=outlined(new THREE.BoxGeometry(long,1.5,2.7),carMat(paintC),0.05); body.position.y=1.05; g.add(body);
    const cabH=(t==="van"||t==="party")?1.7:1.25, cabLen=(t==="van"||t==="party")?long-1.4:long-2.6;
    const cabin=outlined(new THREE.BoxGeometry(cabLen,cabH,2.4),carMat(paintC.clone().offsetHSL(0,0,0.06)),0.05);
    cabin.position.set(-0.2,1.05+0.4+cabH/2,0); g.add(cabin);
    const win=new THREE.Mesh(new THREE.BoxGeometry(cabLen*0.92,cabH*0.55,2.46),new THREE.MeshLambertMaterial({color:0x2b3540}));
    win.position.copy(cabin.position); win.position.y+=0.05; g.add(win);
    const wheelGeo=new THREE.CylinderGeometry(0.8,0.8,0.6,14), wheelMat=new THREE.MeshLambertMaterial({color:0x24211c});
    [[long/2-1.1,-1.45],[long/2-1.1,1.45],[-long/2+1.1,-1.45],[-long/2+1.1,1.45]].forEach(([x,z])=>{
      const w=new THREE.Mesh(wheelGeo,wheelMat); w.rotation.x=Math.PI/2; w.position.set(x,0.8,z); withEdges(w); g.add(w); });
    if(t==="roadtrip"){
      const rack=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.25,2),lambert(col("brick"))); rack.position.set(-0.2,3.0,0); withEdges(rack); g.add(rack);
      const bag=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.7,1.3),lambert(col("sky"))); bag.position.set(-0.2,3.45,0); withEdges(bag); g.add(bag);
    }
    if(t==="party"){
      const s1=new THREE.Mesh(new THREE.BoxGeometry(long+0.05,0.32,2.75),lambert(col("mustard"))); s1.position.y=1.35; g.add(s1);
      const s2=new THREE.Mesh(new THREE.BoxGeometry(long+0.05,0.32,2.75),lambert(col("coral"))); s2.position.y=1.0; g.add(s2);
    }
    if(t==="learner"){
      const pl=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.9,0.9),new THREE.MeshBasicMaterial({color:0xffffff})); pl.position.set(long/2+0.06,1.1,0); g.add(pl);
      const bar=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.62,0.14),new THREE.MeshBasicMaterial({color:0xd6483f})); bar.position.set(long/2+0.12,1.1,0); g.add(bar);
    }
    const pf=plate(v.name); pf.position.set(long/2+0.05,0.92,0); pf.rotation.y=Math.PI/2; g.add(pf);
    const pr=plate(v.name); pr.position.set(-long/2-0.05,0.92,0); pr.rotation.y=-Math.PI/2; g.add(pr);
    g.add(shadowBlob(2.1)); g.userData.pursuit=v; return g;
  }

  /* ---------- interactive stage (drag-orbit; NO wheel zoom) ---------- */
  function Stage(o){
    const stage=q(o.stage), canvas=q(o.canvas), note=q(o.note), load=q(o.load), tip=q(o.tip);
    const W=()=>stage.clientWidth||800, H=()=>stage.clientHeight||480;
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.setSize(W(),H(),false);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(o.fov||46,W()/H(),0.1,400);
    let yaw=o.yaw,pitch=o.pitch,dist=o.dist; const target=o.target.clone();
    const reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    function applyCam(){
      pitch=Math.max(o.pitchMin,Math.min(o.pitchMax,pitch)); dist=Math.max(o.distMin,Math.min(o.distMax,dist));
      camera.position.set(target.x+dist*Math.cos(pitch)*Math.sin(yaw), target.y+dist*Math.sin(pitch), target.z+dist*Math.cos(pitch)*Math.cos(yaw));
      camera.lookAt(target);
    }
    applyCam();
    const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
    const pointers=new Map(); let dragging=false,moved=0,last=performance.now(),hovered=null;
    const pickables=[];
    function setNDC(e){ const r=stage.getBoundingClientRect(); ndc.x=((e.clientX-r.left)/r.width)*2-1; ndc.y=-((e.clientY-r.top)/r.height)*2+1; }
    function pick(){ ray.setFromCamera(ndc,camera); const h=ray.intersectObjects(pickables,true); if(!h.length)return null; let g=h[0].object; while(g&&!g.userData.pursuit)g=g.parent; return g; }
    stage.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0)return;
      stage.setPointerCapture(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); dragging=true; moved=0; last=performance.now(); stage.classList.add("grabbing"); });
    stage.addEventListener("pointermove",e=>{ const prev=pointers.get(e.pointerId);
      if(prev){ const dx=e.clientX-prev.x,dy=e.clientY-prev.y; moved+=Math.abs(dx)+Math.abs(dy); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        yaw-=dx*0.006; pitch+=dy*0.006; applyCam(); last=performance.now();
      } else { setNDC(e); const g=pick(); hovered=g;
        if(g){ stage.style.cursor="pointer";
          if(tip){ tip.textContent=clean(g.userData.pursuit.name); tip.style.display="block";
            const r=stage.getBoundingClientRect(); tip.style.left=Math.min(r.width-tip.offsetWidth-8,Math.max(6,(e.clientX-r.left)+14))+"px"; tip.style.top=Math.max(6,(e.clientY-r.top)-8)+"px"; } }
        else { stage.style.cursor=dragging?"grabbing":"grab"; if(tip)tip.style.display="none"; } }
    });
    function end(e){ pointers.delete(e.pointerId);
      if(pointers.size===0){ dragging=false; stage.classList.remove("grabbing"); if(moved<7){ setNDC(e); const g=pick(); g?open(g):close(); } } }
    stage.addEventListener("pointerup",end); stage.addEventListener("pointercancel",end);
    stage.addEventListener("pointerleave",()=>{ if(tip)tip.style.display="none"; });
    stage.addEventListener("wheel",e=>{ e.preventDefault(); dist*=(1+e.deltaY*0.0012); applyCam(); last=performance.now(); },{passive:false});
    function open(g){ const v=g.userData.pursuit;
      note.querySelector(".dn").textContent=clean(v.name);
      note.querySelector(".now").textContent="now · "+clean(v.now||"—");
      note.querySelector(".unlock").innerHTML='<b>next</b> <span class="arrow">→</span> '+clean(v.unlock||"—");
      stage.classList.add("picked"); note._t=g; posNote(g); if(tip)tip.style.display="none"; }
    function close(){ stage.classList.remove("picked"); note._t=null; }
    note.addEventListener("pointerdown",e=>e.stopPropagation());
    function posNote(g){ const p=new THREE.Vector3(); g.getWorldPosition(p); p.y+=o.noteLift||3.6; p.project(camera);
      const r=stage.getBoundingClientRect(); let x=(p.x*0.5+0.5)*r.width, y=(-p.y*0.5+0.5)*r.height;
      x=Math.max(12,Math.min(r.width-228,x-108)); y=Math.max(10,Math.min(r.height-150,y+8)); note.style.left=x+"px"; note.style.top=y+"px"; }
    function resize(){ renderer.setSize(W(),H(),false); camera.aspect=W()/H(); camera.updateProjectionMatrix(); }
    if(window.ResizeObserver)new ResizeObserver(resize).observe(stage); window.addEventListener("resize",resize);
    let started=false;
    return { scene, addPick(g){pickables.push(g);}, get hovered(){return hovered;},
      render(now,updater){
        if(o.autoRotate&&!reduce&&!dragging&&now-last>3200){ yaw+=0.0015; applyCam(); }
        if(updater)updater(now,{hovered}); if(note._t)posNote(note._t);
        renderer.render(scene,camera); if(!started){started=true; if(load)load.style.display="none";}
      } };
  }

  const FLOOR_W=46, FLOOR_D=30, COLS=9;
  function stallLayout(i){ const row=i<COLS?0:1,k=i%COLS; const sw=FLOOR_W/(COLS+0.4), startX=-FLOOR_W/2+sw*0.7;
    return {x:startX+k*sw, z:row===0?-6.5:6.5, row, sw}; }

  function makeBasement(){
    const st=Stage({stage:"garage",canvas:"scene",note:"g3ddetail",load:"gload",tip:"g3dtip",
      fov:46,yaw:-0.68,pitch:0.6,dist:35,target:new THREE.Vector3(2,1.2,0),
      pitchMin:0.12,pitchMax:1.15,distMin:17,distMax:54,autoRotate:true,noteLift:3.8});
    const S=st.scene; S.background=new THREE.Color(0x120f26); S.fog=new THREE.Fog(0x120f26,30,74);
    S.add(new THREE.AmbientLight(0xd2caf5,0.52));
    S.add(new THREE.HemisphereLight(0xafa4ff,0x1a1330,0.44));
    function strip(x){ const p=new THREE.PointLight(0xffedc4,0.36,52,1.8); p.position.set(x,8.4,0); S.add(p);
      const s=new THREE.Mesh(new THREE.BoxGeometry(1.0,0.12,12),new THREE.MeshBasicMaterial({color:0xfff4d8})); s.position.set(x,8.5,0); withEdges(s); S.add(s); }
    strip(-13); strip(13);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W,FLOOR_D),lambert(new THREE.Color(0x241f42))); floor.rotation.x=-Math.PI/2; S.add(floor);
    const ceil=new THREE.Mesh(new THREE.PlaneGeometry(FLOOR_W,FLOOR_D),lambert(new THREE.Color(0x1c1830))); ceil.rotation.x=Math.PI/2; ceil.position.y=8.6; S.add(ceil);
    const wallMat=lambert(new THREE.Color(0x392f63));
    function wall(w,h,x,y,z,ry){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wallMat); m.position.set(x,y,z); m.rotation.y=ry; withEdges(m); S.add(m); }
    wall(FLOOR_W,8.6,0,4.3,-15,0); wall(FLOOR_D,8.6,-23,4.3,0,Math.PI/2); wall(FLOOR_D,8.6,23,4.3,0,-Math.PI/2);
    const pipeMat=lambert(new THREE.Color(0x453d5e));
    for(const z of [-11,11]){ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,FLOOR_W,10),pipeMat); p.rotation.z=Math.PI/2; p.position.set(0,7.9,z); withEdges(p); S.add(p); }
    function pillar(x){ const p=new THREE.Mesh(new THREE.BoxGeometry(1.5,8.6,1.5),lambert(new THREE.Color(0x453472))); p.position.set(x,4.3,0); withEdges(p); S.add(p); }
    pillar(-9); pillar(0); pillar(9);
    const ramp=new THREE.Mesh(new THREE.BoxGeometry(10,0.4,9),lambert(new THREE.Color(0x332e49))); ramp.position.set(26,2.1,0); ramp.rotation.z=-0.42; withEdges(ramp); S.add(ramp);
    const exit=new THREE.Mesh(new THREE.PlaneGeometry(9,8.4),new THREE.MeshBasicMaterial({color:0x2a3b55})); exit.position.set(30.5,4.2,0); exit.rotation.y=-Math.PI/2; S.add(exit);
    // a touch of neon accent (no text)
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,FLOOR_W,8),new THREE.MeshBasicMaterial({color:0x33e6ff}));
    tube.rotation.z=Math.PI/2; tube.position.set(0,0.22,-12); S.add(tube);
    const cyan=new THREE.PointLight(0x33e6ff,0.45,34,2); cyan.position.set(0,1,-9); S.add(cyan);
    const arrow=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,6,6),new THREE.MeshBasicMaterial({color:0xa6ff4f})); arrow.rotation.z=Math.PI/2; arrow.position.set(20,0.22,4); S.add(arrow);
    // vivid neon bars + colored fills
    function neonBar(color,x,y,z,len,vert,lz){
      const geo=vert?new THREE.BoxGeometry(0.16,len,0.16):new THREE.BoxGeometry(len,0.16,0.16);
      const b=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color})); b.position.set(x,y,z); S.add(b);
      const L=new THREE.PointLight(color,0.6,32,2); L.position.set(x,y,z+(lz||0)); S.add(L); }
    neonBar(0xff2fa6, 0,7.7,-14.3, 30,false, 1.4);   // magenta back wall
    neonBar(0x33e6ff, -22.6,4.2,0, 8,true, 1.4);      // cyan left wall
    neonBar(0xb44dff, 22.6,4.2,0, 8,true, -1.4);      // purple right wall
    const magenta=new THREE.PointLight(0xff4fb0,0.5,42,2); magenta.position.set(0,4,-9); S.add(magenta);
    const teal=new THREE.PointLight(0x39f0d0,0.4,40,2); teal.position.set(8,3,8); S.add(teal);
    // props: traffic cones
    function cone(x,z){ const g=new THREE.Group();
      const base=new THREE.Mesh(new THREE.BoxGeometry(0.95,0.12,0.95),lambert(new THREE.Color(0xe07a2a))); base.position.y=0.06; withEdges(base); g.add(base);
      const bodyc=outlined(new THREE.ConeGeometry(0.42,1.3,16),lambert(new THREE.Color(0xf2842f)),0.05); bodyc.position.y=0.75; g.add(bodyc);
      const strp=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.37,0.2,16),new THREE.MeshBasicMaterial({color:0xf3ece0})); strp.position.y=0.7; g.add(strp);
      g.position.set(x,0,z); g.rotation.y=Math.random()*6.28; S.add(g); }
    cone(6,1.7); cone(-6,-1.5); cone(19,2.6); cone(-16,1.3); cone(1,-2.3);
    // props: hanging work-lights (warm pools)
    const bulbs=[];
    function hangLight(x,z){
      const cord=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,2.6,6),new THREE.MeshBasicMaterial({color:0x1e1c26})); cord.position.set(x,7.2,z); S.add(cord);
      const shade=new THREE.Mesh(new THREE.ConeGeometry(0.5,0.5,14),lambert(new THREE.Color(0x2f2a44))); shade.position.set(x,5.95,z); shade.rotation.x=Math.PI; withEdges(shade); S.add(shade);
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8),new THREE.MeshBasicMaterial({color:0xfff0bf})); bulb.position.set(x,5.7,z); S.add(bulb);
      const light=new THREE.PointLight(0xffd98a,0.62,24,1.8); light.position.set(x,5.55,z); S.add(light); bulbs.push({light,base:0.62}); }
    hangLight(-4.5,0); hangLight(4.5,0); hangLight(18,1);
    // stalls + tagged cars
    const stallMat=new THREE.LineBasicMaterial({color:0xbdb187});
    const cars=[];
    // read the live parked list from scene.js; mask any private car so nothing leaks in 3D
    const lot = (typeof LIVE_PARKED !== "undefined" ? LIVE_PARKED : parked).map(v =>
      v.private ? Object.assign({}, v, { name:"— — —", now:"kept to myself", unlock:"private. that’s all you get.", type:"covered" }) : v);
    lot.forEach((v,i)=>{ const L=stallLayout(i);
      const w=L.sw*0.82, d=6.8, x0=L.x-w/2,x1=L.x+w/2,z0=L.z-d/2,z1=L.z+d/2;
      const pts=[[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,z0]].map(([x,z])=>new THREE.Vector3(x+(Math.random()-0.5)*0.14,0.03,z+(Math.random()-0.5)*0.14));
      S.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),stallMat));
      const g=buildCar(v); g.position.set(L.x,0,L.z); g.rotation.y=(L.row===0?Math.PI/2:-Math.PI/2)+(Math.random()-0.5)*0.08;
      S.add(g); st.addPick(g); cars.push(g);
    });
    const updater=(now,ctx)=>{ cars.forEach(g=>{ const lift=g===ctx.hovered?0.4:0; g.position.y+=(lift-g.position.y)*0.2; });
      if(bulbs[0]) bulbs[0].light.intensity=bulbs[0].base+(Math.random()<0.04?-0.4:0)+Math.sin(now*0.02)*0.05; };
    return {st,updater};
  }

  function showErr(e){ const el=q("gload"); if(el){ el.style.display="flex"; el.textContent="3d error: "+((e&&e.message)||e); } if(window.console)console.error(e); }
  let base=null;
  try{ base=makeBasement(); }catch(e){ showErr(e); }
  function tick(now){ requestAnimationFrame(tick); if(base){ try{ base.st.render(now,base.updater); }catch(e){ showErr(e); base=null; } } }
  requestAnimationFrame(tick);
  const gh=q("ghint"); if(gh) setTimeout(()=>{ gh.style.opacity="0"; },7000);
}
