/* ============================ CAMERA ============================ */
function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w,h);
  camP.aspect = w/h; camP.updateProjectionMatrix();
  camP.updateMatrixWorld();
  updateOrtho();
}
function updateOrtho(){
  const w = canvas.clientWidth || innerWidth, h = viewH();
  const span = orbit.dist * 0.55 / orbit.zoom;
  const a = w/h;
  camO.left = -span*a; camO.right = span*a; camO.top = span; camO.bottom = -span;
  camO.updateProjectionMatrix();
}
function viewH(){ return canvas.clientHeight || innerHeight; }
function pxScale(){
  return camMode === "persp"
    ? (2*Math.tan(camP.fov*Math.PI/360)*orbit.dist)/viewH()
    : (camO.top - camO.bottom)/viewH();
}
function placeCam(){
  if(Math.abs(orbit.el) > 1.552) cam.up.set(0,1,0); else cam.up.set(0,0,1);
  const d = orbit.dist, ce = Math.cos(orbit.el), se = Math.sin(orbit.el);
  cam.position.set(
    orbit.target.x + d*ce*Math.cos(orbit.az),
    orbit.target.y + d*ce*Math.sin(orbit.az),
    orbit.target.z + d*se);
  cam.lookAt(orbit.target);
  if(S.pivot) S.pivot.position.copy(orbit.target);
}
/* damped follow of the goal state */
function camTick(dt){
  const k = 1 - Math.exp(-dt*17);
  orbit.target.lerp(goal.target, k);
  orbit.dist += (goal.dist - orbit.dist)*k;
  orbit.zoom += (goal.zoom - orbit.zoom)*k;
  orbit.az   += (goal.az   - orbit.az  )*k;
  orbit.el   += (goal.el   - orbit.el  )*k;
  updateOrtho(); placeCam();
  if(S.pivot) S.pivot.scale.setScalar(Math.max(0.6, pxScale()*5));
}
function snapCam(){
  orbit.target.copy(goal.target);
  orbit.dist = goal.dist; orbit.zoom = goal.zoom; orbit.az = goal.az; orbit.el = goal.el;
  updateOrtho(); placeCam();
}
function setCam(mode){
  camMode = mode;
  cam = (mode === "persp") ? camP : camO;
  if(mode === "plan"){ goal.az = -Math.PI/2; goal.el = Math.PI/2 - 0.0006; }
  else if(mode === "elev"){ goal.az = -Math.PI/2; goal.el = 0.0001; }
  else if(mode === "iso"){ goal.az = ISO_AZ; goal.el = ISO_EL; }
  else if(Math.abs(goal.el) > 1.5) goal.el = 0.72;
  document.querySelectorAll("[data-cam]").forEach(function(b){ b.classList.toggle("on", b.dataset.cam === mode); });
  updateOrtho(); placeCam();
}
/* frame any Box3 in both projections */
function frameBox(box, pad){
  pad = pad || 1.35;
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(24, box.getSize(new THREE.Vector3()).length()/2);
  goal.target.copy(c);
  goal.dist = r / Math.sin(camP.fov*Math.PI/360) * 0.82 * pad;
  goal.zoom = (goal.dist*0.55) / (r*pad);
}
function frameAll(){ if(S.bsp) frameBox(S.bounds, 1.3); }
function frameSelection(){
  if(S.selected){ frameBox(entBox(S.selected), 3.2); return; }
  if(S.probePt){
    const b = new THREE.Box3().setFromCenterAndSize(S.probePt, new THREE.Vector3(320,320,320));
    frameBox(b, 1.2); return;
  }
  frameAll();
}
function focusPoint(pt){
  goal.target.copy(pt);
  goal.dist = Math.max(120, Math.min(goal.dist, 700));
  goal.zoom = Math.max(goal.zoom, (goal.dist*0.55)/700);
}

/* input */
let dragging = 0, lx = 0, ly = 0, moved = 0;
canvas.addEventListener("pointerdown", function(ev){
  dragging = (ev.button === 2 || ev.shiftKey) ? 2 : 1;
  lx = ev.clientX; ly = ev.clientY; moved = 0;
  canvas.setPointerCapture(ev.pointerId);
});
canvas.addEventListener("pointermove", function(ev){
  if(!dragging){ hover(ev); return; }
  const dx = ev.clientX - lx, dy = ev.clientY - ly;
  lx = ev.clientX; ly = ev.clientY; moved += Math.abs(dx)+Math.abs(dy);
  if(dragging === 1){
    goal.az -= dx*0.005;
    goal.el = Math.max(-1.545, Math.min(1.545, goal.el + dy*0.005));
    if(S.pivot) S.pivot.visible = true;
  } else {
    const scale = pxScale();
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const right = new THREE.Vector3().copy(dir).cross(cam.up).normalize();
    const up = new THREE.Vector3().copy(right).cross(dir).normalize();
    goal.target.addScaledVector(right, -dx*scale);
    goal.target.addScaledVector(up, dy*scale);
    orbit.target.copy(goal.target);
    placeCam();
  }
});
canvas.addEventListener("pointerup", function(ev){
  const wasDrag = moved > 5;
  const btn = dragging;
  dragging = 0;
  if(S.pivot) S.pivot.visible = false;
  if(!wasDrag && btn === 1) click(ev);
});
canvas.addEventListener("contextmenu", function(e){ e.preventDefault(); });
canvas.addEventListener("wheel", function(ev){
  ev.preventDefault();
  if(!S.bsp) return;
  const f = Math.max(0.85, Math.min(1.18, Math.pow(1.0016, ev.deltaY)));
  const t = performance.now();
  if(f < 1 && t - lastWheelPick > 45){
    lastWheelPick = t;
    const h = pick(ev);
    if(h) goal.target.lerp(h.point, Math.min(0.55, (1-f)*3.2));
  }
  if(camMode === "persp") goal.dist = Math.max(24, Math.min(400000, goal.dist*f));
  else goal.zoom = Math.max(0.01, Math.min(400, goal.zoom/f));
}, {passive:false});

canvas.addEventListener("dblclick", function(ev){
  const pe = pickEnt(ev);
  const ph = pick(ev);
  if(pe && (!ph || pe.dist <= ph.distance + 12)){ frameBox(entBox(pe.e), 3.2); return; }
  if(ph) focusPoint(ph.point);
});

let lastWheelPick = 0;
const keys = {};
addEventListener("keydown", function(e){
  if(e.target.tagName === "INPUT") return;
  const k = e.key.toLowerCase();
  keys[k] = 1;
  if(k === "f") frameAll();
  if(k === "g") frameSelection();
  if(k === "[" && S.pakMaps && S.pakIndex > 0) loadFromPak(S.pakIndex-1);
  if(k === "]" && S.pakMaps && S.pakIndex < S.pakMaps.length-1) loadFromPak(S.pakIndex+1);
  if(k === "escape"){
    if(document.getElementById("picker").classList.contains("show") && S.bsp)
      document.getElementById("picker").classList.remove("show");
    else if(!document.getElementById("drop").classList.contains("gone") && S.bsp)
      document.getElementById("drop").classList.add("gone");
    else if(S.probeMode || S.measMode){
      setProbeMode(false);
      S.measMode = false; S.measPts = [];
      document.getElementById("measBtn").classList.remove("on");
      drawMeasure();
    }
    else deselect();
  }
});
addEventListener("keyup", function(e){ keys[e.key.toLowerCase()] = 0; });

function fly(dt){
  if(camMode !== "persp") return;
  const sp = (keys["shift"] ? 1600 : 520) * dt;
  const fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
  const right = new THREE.Vector3().copy(fwd).cross(cam.up).normalize();
  const mv = new THREE.Vector3();
  if(keys["w"]) mv.add(fwd); if(keys["s"]) mv.sub(fwd);
  if(keys["d"]) mv.add(right); if(keys["a"]) mv.sub(right);
  if(keys["e"]) mv.z += 1; if(keys["q"]) mv.z -= 1;
  if(mv.lengthSq() > 0){ mv.normalize().multiplyScalar(sp); goal.target.add(mv); orbit.target.add(mv); }
}
