/* ============================ PICKING ============================ */
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function setNDC(ev){
  const r = canvas.getBoundingClientRect();
  ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
}
function pick(ev){
  if(!S.mesh) return null;
  setNDC(ev);
  ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObject(S.mesh, false);
  if(!hits.length) return null;
  return hits[0];
}
function esc(s){ return String(s).replace(/[<>&"]/g, function(c){ return ({"<":"&lt;",">":"&gt;","&":"&amp;","\"":"&quot;"})[c]; }); }

function pickEnt(ev){
  if(!S.entGroup) return null;
  const objs = S.entGroup.children.filter(function(o){ return o.visible; });
  if(!objs.length) return null;
  setNDC(ev);
  ray.setFromCamera(ndc, cam);
  const hits = ray.intersectObjects(objs, false);
  for(let i=0;i<hits.length;i++){
    const e = hits[i].object.userData.list[hits[i].instanceId];
    if(e && e.__on !== false) return { e:e, dist:hits[i].distance };
  }
  return null;
}

function entBox(e){
  const b = new THREE.Box3();
  if(e.model && e.model.charAt(0) === "*"){
    const m = S.bsp.models[parseInt(e.model.slice(1),10)];
    if(m){
      b.set(new THREE.Vector3(m.min[0],m.min[1],m.min[2]), new THREE.Vector3(m.max[0],m.max[1],m.max[2]));
      return b;
    }
  }
  const p = e.__pos || entOrigin(e, S.bsp) || [0,0,0];
  b.setFromCenterAndSize(new THREE.Vector3(p[0],p[1],p[2]), new THREE.Vector3(52,52,52));
  return b;
}

function selectEntity(e){
  S.selected = e;
  if(S.selBox){ scene.remove(S.selBox); S.selBox = null; }
  const helper = new THREE.Box3Helper(entBox(e), TH.ref);
  helper.material.depthTest = false;
  helper.material.transparent = true;
  helper.material.opacity = 0.95;
  helper.renderOrder = 999;
  S.selBox = helper; scene.add(helper);
  renderInspect(e, true);
}
function deselect(){
  S.selected = null;
  if(S.selBox){ scene.remove(S.selBox); S.selBox = null; }
  document.getElementById("inspect").classList.remove("show");
}
function selectByIndex(i){
  const e = S.ents[i];
  if(!e) return;
  selectEntity(e);
  frameBox(entBox(e), 3.2);
}

const DOOR_FLAGS = [[1,"start open"],[4,"don't link"],[8,"gold key"],[16,"silver key"],[32,"toggle"]];

function renderInspect(e, pinned){
  const box = document.getElementById("inspect");
  if(!e){ box.classList.remove("show"); return; }
  const cn = (e.classname||"?").toLowerCase();
  const sf = parseInt(e.spawnflags||"0",10);

  const cat = classify(cn, e);
  const meta = CATS.find(function(x){ return x.id === cat; });
  const col = meta ? (TH.ent[meta.id] !== undefined ? TH.ent[meta.id] : meta.color) : 0x777777;
  const hex = "#" + col.toString(16).padStart(6,"0");
  let head = "<div class='ihead'><div class='top'>" +
    "<h3><span class='idot' style='background:" + hex + "'></span>" + esc(e.classname||"?") + "</h3>" +
    (pinned ? "<button data-act='close' title='Deselect'>&times;</button>" : "") +
    "</div><div class='iaccent'></div></div>";

  let b = "<div class='ibody'>";
  Object.keys(e).forEach(function(k){
    if(k.slice(0,2) === "__" || k === "classname") return;
    b += "<div class='kv'><i>" + esc(k) + "</i><em>" + esc(e[k]) + "</em></div>";
  });

  const p = e.__pos || entOrigin(e, S.bsp);
  if(p) b += "<div class='kv der'><i>position</i><em>" + p.map(Math.round).join("  ") + "</em></div>";

  const sk = [];
  if(!(sf & NOT_EASY)) sk.push("easy");
  if(!(sf & NOT_NORMAL)) sk.push("normal");
  if(!(sf & NOT_HARD)) sk.push("hard");
  b += "<div class='kv der'><i>appears on</i><em>" + (sk.join(", ") || "no skill") + "</em></div>";

  if(cn === "func_door" && sf){
    const f = DOOR_FLAGS.filter(function(d){ return sf & d[0]; }).map(function(d){ return d[1]; });
    if(f.length) b += "<div class='kv der'><i>door flags</i><em>" + f.join(", ") + "</em></div>";
  }
  if(p){
    const lf = findLeaf(S.bsp, p[0], p[1], p[2]);
    if(lf >= 0 && lf < S.bsp.nLeafs) b += "<div class='kv der'><i>leaf</i><em>" + lf + "</em></div>";
  }

  if(pinned){
    const outs = e.target ? (S.byTargetname[e.target] || []) : [];
    const ins  = e.targetname ? (S.byTarget[e.targetname] || []) : [];
    if(outs.length){
      b += "<div class='lab'>Fires</div>";
      outs.forEach(function(t){ b += "<button class='chip' data-go='" + t.__idx + "'>" + esc(t.classname||"?") + "</button>"; });
    }
    if(ins.length){
      b += "<div class='lab'>Fired by</div>";
      ins.forEach(function(t){ b += "<button class='chip' data-go='" + t.__idx + "'>" + esc(t.classname||"?") + "</button>"; });
    }
    b += "<div class='acts'>" +
      "<button data-act='frame'>FRAME</button>" +
      "<button data-act='probe'>PROBE HERE</button>" +
      "</div>";
  }
  b += "</div>";
  box.innerHTML = head + b;
  box.classList.add("show");
}

document.getElementById("inspect").addEventListener("click", function(ev){
  const go = ev.target.closest("[data-go]");
  if(go){ selectByIndex(parseInt(go.dataset.go,10)); return; }
  const act = ev.target.closest("[data-act]");
  if(!act || !S.selected) return;
  if(act.dataset.act === "close") deselect();
  if(act.dataset.act === "frame") frameBox(entBox(S.selected), 3.2);
  if(act.dataset.act === "probe"){
    const p = S.selected.__pos || entOrigin(S.selected, S.bsp);
    if(p) setProbe(new THREE.Vector3(p[0], p[1], p[2] + 16), null);
  }
});

function hover(ev){
  if(S.probeMode && S.probeFollow && S.bsp){
    const t = performance.now();
    if(t - S.lastFollow > 45){
      S.lastFollow = t;
      const g = pick(ev);
      if(g) setProbe(g.point, g.face ? g.face.normal : null);
    }
  }
  if(!S.entGroup || innerWidth < 861 || S.selected) return;
  const h = pickEnt(ev);
  if(!h){ document.getElementById("inspect").classList.remove("show"); return; }
  renderInspect(h.e, false);
}

function click(ev){
  if(S.measMode){
    const m = pick(ev);
    if(!m) return;
    S.measPts.push(m.point.clone());
    if(S.measPts.length > 2) S.measPts = [m.point.clone()];
    drawMeasure();
    return;
  }
  const pe = pickEnt(ev);
  const ph = pick(ev);
  if(pe && (!ph || pe.dist <= ph.distance + 12)){ selectEntity(pe.e); return; }
  deselect();
  if(ph && S.probeMode) setProbe(ph.point, ph.face ? ph.face.normal : null);
}

function setProbe(pt, nrm){
  const p = pt.clone();
  if(nrm) p.addScaledVector(nrm, 2);
  const leaf = findLeaf(S.bsp, p.x, p.y, p.z);
  if(leaf < 0 || leaf >= S.bsp.nLeafs) return;
  S.probeLeaf = leaf; S.probePt = p;
  const vis = decompressVis(S.bsp, leaf);
  const vf = new Uint8Array(S.faceCount);
  let visLeaves = 0;
  for(let i=1;i<S.bsp.nLeafs;i++){
    if(!vis[i]) continue;
    visLeaves++;
    const st = S.bsp.lFirst[i], ct = S.bsp.lCount[i];
    for(let k=0;k<ct;k++){ const f = S.bsp.marks[st+k]; if(f < S.faceCount) vf[f] = 1; }
  }
  S.visFaces = vf;
  let n = 0; for(let i=0;i<vf.length;i++) if(vf[i]) n++;
  S.visPct = Math.round(n/Math.max(1,S.faceCount)*100);
  document.getElementById("visval").textContent = S.visPct + "% of faces · leaf " + leaf;
  if(S.ref){ S.ref.position.copy(p); S.ref.visible = document.getElementById("tRef").checked; }
  if(S.probeMark){ S.probeMark.position.copy(p); S.probeMark.visible = true; }
  recolor();
}

function drawMeasure(){
  if(S.measGroup){ scene.remove(S.measGroup); S.measGroup = null; }
  const out = document.getElementById("measout");
  if(S.measPts.length === 0){ out.textContent = "Measure: click two surfaces."; return; }
  if(S.measPts.length === 1){ out.textContent = "First point set. Click a second."; return; }
  const a = S.measPts[0], b = S.measPts[1];
  const d = a.distanceTo(b);
  const g = new THREE.BufferGeometry().setFromPoints([a,b]);
  const grp = new THREE.Group();
  grp.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color:TH.measure })));
  S.measGroup = grp; scene.add(grp);
  out.innerHTML = "<b style='color:var(--bone)'>" + Math.round(d) + " units</b> · " +
    (d/56).toFixed(1) + " player heights · Δz " + Math.round(Math.abs(a.z-b.z)) +
    " (" + (Math.abs(a.z-b.z) <= 18 ? "steppable" : Math.abs(a.z-b.z) <= 45 ? "jumpable" : "needs a lift or drop") + ")";
}
