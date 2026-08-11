/* ============================ PALETTES ============================ */
/* Every scene colour is routed through the active theme so the whole
   instrument re-skins in one call. */
const THEME_BASE = {
  face:[0.68,0.66,0.61], shadeLo:0.42, shadeHi:0.58,
  hidden:[0.043,0.043,0.043], occl:[0.26,0.28,0.34],
  edge:0x000000, edgeOp:0.50,
  edgeLight:0xffffff, edgeLightOp:0.32,
  optLo:[0.30,0.26,0.44], optHi:[0.86,0.36,0.95],
  lightLo:[0.05,0.05,0.08], lightMid:[0.36,0.38,0.44], lightHi:[1.0,0.97,0.88],
  grid:0x2a2822, gridOp:0.55,
  leaf:0x4a7de0, leafOp:0.22,
  link:0xe0d24a, linkOp:0.50,
  measure:0xd4622b, probe:0x4a7de0, ref:0xffffff, refOp:0.85,
  path:0xe8c34a, mark:0xffffff, exitMark:0xd4622b,
  heightLo:[0.16,0.19,0.30], heightMid:[0.71,0.71,0.72], heightHi:[0.91,0.58,0.28],
  navLo:[0.16,0.30,0.55],   navMid:[0.71,0.72,0.73],   navHi:[0.93,0.43,0.18],
  sky:[0.20,0.26,0.40], lavaC:[0.83,0.38,0.17], slimeC:[0.49,0.61,0.25], waterC:[0.29,0.49,0.88],
  texPal:[0x8a8377,0x7b7f86,0x8d7f6c,0x6f7a70,0x8b7570,0x77736a,
          0x92887a,0x6d7480,0x847b64,0x7a6f6a,0x898172,0x707a78],
  ent:{}
};

const THEMES = [
  { id:"slipgate", label:"Slipgate", bg:0x1e1e1e,
    css:{ ink:"#1e1e1e", panel:"#2b2b2b", panel2:"#363636", rule:"#464646",
          bone:"#d7d7d7", dim:"#979797", dimmer:"#6b6b6b", accent:"#b6ff1f",
          quad:"#22d3ee", lava:"#ff7a1a", slime:"#b6ff1f", key:"#e364ff", blood:"#ff4d4d" },
    face:[0.61,0.62,0.62], shadeLo:0.40, shadeHi:0.60,
    hidden:[0.082,0.082,0.082], occl:[0.28,0.29,0.30],
    edge:0x0f0f0f, edgeOp:0.60,
    edgeLight:0xffffff, edgeLightOp:0.34,
    optLo:[0.30,0.22,0.42], optHi:[0.89,0.39,1.0],
    lightLo:[0.05,0.05,0.06], lightMid:[0.34,0.36,0.36], lightHi:[0.96,1.0,0.80],
    grid:0x343434, gridOp:0.9,
    leaf:0x22d3ee, leafOp:0.26,
    link:0xb6ff1f, linkOp:0.55,
    measure:0xff7a1a, probe:0x22d3ee, ref:0xffffff, refOp:0.88,
    path:0xb6ff1f, mark:0xffffff, exitMark:0xff7a1a,
    heightLo:[0.14,0.16,0.20], heightMid:[0.60,0.62,0.63], heightHi:[0.71,1.0,0.12],
    navLo:[0.10,0.78,0.90], navMid:[0.71,1.0,0.12], navHi:[1.0,0.42,0.08],
    sky:[0.22,0.26,0.32], lavaC:[1.0,0.45,0.10], slimeC:[0.71,1.0,0.12], waterC:[0.13,0.72,0.92],
    texPal:[0x6e6e6e,0x7a7a7a,0x646464,0x828282,0x5e5e5e,0x757575,
            0x6a6a6a,0x7f7f7f,0x606060,0x787878,0x686868,0x717171],
    ent:{ start:0xffffff, monster:0xff4d4d, key:0xe364ff, weapon:0xffd21f, ammo:0x9c9040,
          health:0xb6ff1f, power:0x22d3ee, tele:0x00e5c0, secret:0xfff23d, exit:0xff7a1a,
          trigger:0x8a8a8a, light:0x4a4a4a } },

  { id:"blueprint", label:"Blueprint", bg:0x08111f,
    css:{ ink:"#08111f", panel:"#0c1729", panel2:"#12203a", rule:"#1d2f4d",
          bone:"#d8e6ff", dim:"#7791bb", dimmer:"#48618a", accent:"#4fd6e8",
          quad:"#4fd6e8", lava:"#ff9a52", slime:"#7fc98a", key:"#c58fe8", blood:"#e06a62" },
    face:[0.34,0.50,0.76], shadeLo:0.40, shadeHi:0.60,
    hidden:[0.03,0.05,0.09], occl:[0.22,0.26,0.36],
    edge:0xc3dbff, edgeOp:0.30,
    edgeLight:0xffffff, edgeLightOp:0.50,
    optLo:[0.36,0.28,0.20], optHi:[0.98,0.70,0.36],
    lightLo:[0.04,0.07,0.14], lightMid:[0.24,0.44,0.66], lightHi:[0.94,0.99,1.0],
    grid:0x16273f, gridOp:0.8,
    leaf:0x4fd6e8, link:0x8fd9ff, linkOp:0.55,
    measure:0xff9a52, probe:0x4fd6e8, ref:0xffffff,
    path:0x9fe8ff, mark:0xffffff, exitMark:0xff9a52,
    heightLo:[0.09,0.17,0.36], heightMid:[0.44,0.63,0.90], heightHi:[0.86,0.96,1.0],
    navLo:[0.10,0.20,0.42], navMid:[0.35,0.72,0.86], navHi:[0.92,0.98,1.0],
    sky:[0.14,0.26,0.46], lavaC:[0.90,0.52,0.26], slimeC:[0.46,0.72,0.52], waterC:[0.31,0.72,0.92],
    texPal:[0x3d5a86,0x33507c,0x456190,0x2f4c79,0x4a6795,0x385584,
            0x40598a,0x2b4570,0x506d9c,0x35527f,0x445f8e,0x304a75] },

  { id:"vellum", label:"Vellum", bg:0xefeade,
    css:{ ink:"#efeade", panel:"#e6e0d1", panel2:"#dbd3c1", rule:"#c2b8a3",
          bone:"#26241f", dim:"#5f584c", dimmer:"#8a8272", accent:"#26241f",
          quad:"#2a5fc0", lava:"#b8471c", slime:"#5c7a24", key:"#8a3fb0", blood:"#9c2f26" },
    face:[0.84,0.82,0.76], shadeLo:0.74, shadeHi:0.26,
    hidden:[0.93,0.91,0.86], occl:[0.94,0.93,0.90],
    edge:0x26241f, edgeOp:0.55,
    edgeLight:0xffffff, edgeLightOp:0.75,
    optLo:[0.66,0.62,0.74], optHi:[0.38,0.28,0.58],
    lightLo:[0.16,0.15,0.13], lightMid:[0.58,0.55,0.50], lightHi:[0.98,0.96,0.90],
    grid:0xc2b8a3, gridOp:0.85,
    leaf:0x2a5fc0, leafOp:0.28,
    link:0xb8891c, linkOp:0.75,
    measure:0xb8471c, probe:0x2a5fc0, ref:0x1b1a17, refOp:0.9,
    path:0xc27a12, mark:0x1b1a17, exitMark:0xb8471c,
    heightLo:[0.46,0.55,0.74], heightMid:[0.93,0.90,0.83], heightHi:[0.78,0.34,0.16],
    navLo:[0.40,0.52,0.76], navMid:[0.90,0.86,0.76], navHi:[0.80,0.30,0.12],
    sky:[0.62,0.72,0.86], lavaC:[0.85,0.42,0.20], slimeC:[0.58,0.68,0.32], waterC:[0.44,0.64,0.88],
    texPal:[0x9c9484,0xa39a88,0x968d7c,0xa8a08e,0x8f8776,0xaba392,
            0x999183,0xa29a89,0x8d8574,0xa69e8c,0x948c7b,0x9f9785],
    ent:{ start:0x1b1a17, health:0x4a7a1c, ammo:0x7a6a2a, trigger:0x6a6255, light:0xb5ac99 } },

  { id:"contrast", label:"Contrast", bg:0x000000,
    css:{ ink:"#000000", panel:"#0d0d0d", panel2:"#171717", rule:"#333333",
          bone:"#ffffff", dim:"#a8a8a8", dimmer:"#6e6e6e", accent:"#ffffff",
          quad:"#3d8bff", lava:"#ff6a1f", slime:"#6ee01f", key:"#d060ff", blood:"#ff3b30" },
    face:[0.86,0.86,0.86], shadeLo:0.30, shadeHi:0.70,
    hidden:[0.0,0.0,0.0], occl:[0.18,0.18,0.20],
    edge:0x000000, edgeOp:0.85,
    edgeLight:0xffffff, edgeLightOp:0.55,
    optLo:[0.30,0.14,0.44], optHi:[0.92,0.24,1.0],
    lightLo:[0.0,0.0,0.0], lightMid:[0.30,0.30,0.34], lightHi:[1.0,1.0,1.0],
    grid:0x2e2e2e, gridOp:0.9,
    leaf:0x3d8bff, leafOp:0.32,
    link:0xffe000, linkOp:0.8,
    measure:0xff6a1f, probe:0x3d8bff, ref:0xffffff,
    path:0xffe000, mark:0xffffff, exitMark:0xff6a1f,
    heightLo:[0.10,0.16,0.62], heightMid:[0.94,0.94,0.94], heightHi:[1.0,0.42,0.08],
    navLo:[0.08,0.20,0.72], navMid:[0.95,0.95,0.95], navHi:[1.0,0.40,0.05],
    sky:[0.22,0.36,0.66], lavaC:[1.0,0.36,0.10], slimeC:[0.44,0.82,0.14], waterC:[0.20,0.52,1.0],
    texPal:[0xb0b0b0,0x8f8f8f,0xc4c4c4,0x7a7a7a,0xa5a5a5,0x999999,
            0xbdbdbd,0x868686,0xacacac,0x939393,0xb6b6b6,0x808080] }
].map(function(t){
  const o = Object.assign({}, THEME_BASE, t);
  o.css = t.css; o.ent = t.ent || {};
  return o;
});

let TH = THEMES[0];

function applyTheme(id){
  const t = THEMES.find(function(x){ return x.id === id; }) || THEMES[0];
  TH = t;
  const root = document.documentElement;
  Object.keys(t.css).forEach(function(k){ root.style.setProperty("--"+k, t.css[k]); });
  renderer.setClearColor(t.bg, 1);

  if(S.lineParts) S.lineParts.forEach(function(l){
    l.material.color.setHex(S.lightEdges ? t.edgeLight : t.edge);
  });
  if(S.grid){ S.grid.material.color.setHex(t.grid); S.grid.material.opacity = t.gridOp; }
  if(S.leafBoxes){ S.leafBoxes.material.color.setHex(t.leaf); S.leafBoxes.material.opacity = t.leafOp; }
  if(S.linkGroup) S.linkGroup.traverse(function(o){ if(o.material){ o.material.color.setHex(t.link); o.material.opacity = t.linkOp; } });
  if(S.probeMark) S.probeMark.material.color.setHex(t.probe);
  if(S.ref) S.ref.traverse(function(o){ if(o.material){ o.material.color.setHex(t.ref); if(o.material.opacity < 0.5) o.material.opacity = 0.12; else o.material.opacity = t.refOp; } });
  if(S.selBox) S.selBox.material.color.setHex(t.ref);
  if(S.pivot) S.pivot.material.color.setHex(t.ref);
  if(S.measGroup) S.measGroup.traverse(function(o){ if(o.material) o.material.color.setHex(t.measure); });
  if(S.entGroup) S.entGroup.children.forEach(function(inst){
    const c = CATS.find(function(x){ return x.id === inst.userData.cat; });
    if(c) inst.material.color.setHex(t.ent[c.id] !== undefined ? t.ent[c.id] : c.color);
  });
  if(S.mesh){ recolor(); applySurfaces(); }
  if(NAV.built){ buildNavOverlay(); applyCut(); }
  drawGraph();
  document.querySelectorAll("[data-theme]").forEach(function(b){ b.classList.toggle("on", b.dataset.theme === id); });
}

/* ---------- geometry construction ---------- */

function hashStr(s){ let h = 2166136261; for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = (h*16777619)>>>0; } return h>>>0; }

function isSky(n){ return n.indexOf("sky") === 0; }
function isLiquid(n){ return n.charAt(0) === "*"; }

/* Faces are split by orientation into floor / wall / ceiling groups, so each
   can carry its own opacity and be switched off independently. The 0.7 normal-z
   cutoff is Quake's own: the engine calls you grounded above it. */
const FLOOR_NZ = 0.7;

function build(bsp){
  const pos = [], nrm = [];
  const lineArr = [[],[],[]];
  const nF = bsp.nFaces;
  const faceVertStart = new Int32Array(nF), faceVertCount = new Int32Array(nF);
  const faceModel = new Int32Array(nF), faceCls = new Uint8Array(nF);
  const faceTexName = new Array(nF).fill("");
  const faceC = new Float32Array(nF*3), faceZ = new Float32Array(nF);
  const triFace = [];

  const modelOfFace = new Int32Array(nF);
  for(let m=0;m<bsp.models.length;m++){
    const mo = bsp.models[m];
    for(let f=mo.firstFace; f<mo.firstFace+mo.numFaces; f++) if(f>=0 && f<nF) modelOfFace[f] = m;
  }

  for(let f=0; f<nF; f++){
    const pi = bsp.fPlane[f]*4;
    let nz = bsp.planes[pi+2];
    if(bsp.fSide[f]) nz = -nz;
    faceCls[f] = nz > FLOOR_NZ ? 0 : (nz < -FLOOR_NZ ? 2 : 1);
  }

  const V = bsp.verts, E = bsp.edges, SE = bsp.surfedges;
  const tmp = [];
  const groups = [];

  for(let cls=0; cls<3; cls++){
    const gStart = pos.length/3;
    for(let f=0; f<nF; f++){
      if(faceCls[f] !== cls) continue;
      const n = bsp.fNEdge[f];
      const ti = bsp.fTexinfo[f];
      const mip = bsp.texMip[ti];
      faceTexName[f] = (mip >= 0 && mip < bsp.texNames.length) ? bsp.texNames[mip] : "";
      faceModel[f] = modelOfFace[f];
      if(n < 3) continue;

      tmp.length = 0;
      for(let k=0;k<n;k++){
        const se = SE[bsp.fEdge[f]+k];
        tmp.push(se >= 0 ? E[se*2] : E[(-se)*2+1]);
      }
      const pi = bsp.fPlane[f]*4;
      let nx = bsp.planes[pi], ny = bsp.planes[pi+1], nz = bsp.planes[pi+2];
      if(bsp.fSide[f]){ nx = -nx; ny = -ny; nz = -nz; }

      const start = pos.length/3;
      for(let k=1;k<n-1;k++){
        const a = tmp[0], b = tmp[k], c = tmp[k+1];
        pos.push(V[a*3],V[a*3+1],V[a*3+2], V[b*3],V[b*3+1],V[b*3+2], V[c*3],V[c*3+1],V[c*3+2]);
        nrm.push(nx,ny,nz, nx,ny,nz, nx,ny,nz);
        triFace.push(f);
      }
      let sx=0, sy=0, sz=0;
      for(let k=0;k<n;k++){
        const a = tmp[k], b = tmp[(k+1)%n];
        lineArr[cls].push(V[a*3],V[a*3+1],V[a*3+2], V[b*3],V[b*3+1],V[b*3+2]);
        sx += V[a*3]; sy += V[a*3+1]; sz += V[a*3+2];
      }
      faceC[f*3] = sx/n; faceC[f*3+1] = sy/n; faceC[f*3+2] = sz/n;
      faceZ[f] = sz/n;
      faceVertStart[f] = start;
      faceVertCount[f] = pos.length/3 - start;
    }
    groups.push([gStart, pos.length/3 - gStart]);
  }

  const g = new THREE.BufferGeometry();
  const posArr = new Float32Array(pos);
  g.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nrm), 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(posArr.length), 3));
  groups.forEach(function(gr,i){ g.addGroup(gr[0], gr[1], i); });
  g.computeBoundingBox();

  const mats = [0,1,2].map(function(){
    return new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.DoubleSide });
  });
  const mesh = new THREE.Mesh(g, mats);

  const lgrp = new THREE.Group();
  S.lineParts = [];
  for(let cls=0; cls<3; cls++){
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineArr[cls]),3));
    const ls = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
      color:TH.edge, transparent:true, opacity:TH.edgeOp }));
    S.lineParts.push(ls); lgrp.add(ls);
  }

  const lm = computeFaceLight(bsp);
  S.faceLight = lm.light; S.faceArea = lm.area;

  S.mesh = mesh; S.lines = lgrp;
  S.faceVertStart = faceVertStart; S.faceVertCount = faceVertCount;
  S.faceModel = faceModel; S.faceTex = faceTexName; S.faceZ = faceZ;
  S.faceC = faceC; S.faceCls = faceCls;
  S.triFace = triFace; S.colorAttr = g.attributes.color;
  S.faceCount = nF;
  S.bounds.copy(g.boundingBox);
  S.bounds.getCenter(S.center); S.bounds.getSize(S.size);
}

/* per-orientation visibility and opacity */
function applySurfaces(){
  if(!S.mesh) return;
  const cfg = [
    { on:S.surf.floor, op:1 },
    { on:S.surf.wall,  op:S.surf.wallOp },
    { on:S.surf.ceil,  op:S.surf.ceilOp }
  ];
  S.mesh.material.forEach(function(m,i){
    const o = Math.max(0.02, Math.min(1, cfg[i].op));
    m.visible = cfg[i].on;
    m.opacity = o;
    m.transparent = o < 0.995;
    m.depthWrite = o >= 0.995;
    m.needsUpdate = true;
  });
  const ec = S.lightEdges ? TH.edgeLight : TH.edge;
  const eo = S.lightEdges ? TH.edgeLightOp : TH.edgeOp;
  if(S.lineParts) S.lineParts.forEach(function(l,i){
    l.visible = cfg[i].on;
    l.material.color.setHex(ec);
    l.material.opacity = eo * Math.max(0.22, cfg[i].op);
  });
  document.querySelectorAll("[data-surf]").forEach(function(b){
    b.classList.toggle("on", !!S.surf[b.dataset.surf]);
  });
  const wv = document.getElementById("wallval"), cv = document.getElementById("ceilval");
  if(wv) wv.textContent = Math.round(S.surf.wallOp*100) + "%";
  if(cv) cv.textContent = Math.round(S.surf.ceilOp*100) + "%";
}

/* face-per-face shading */
function shadeFace(f, out){
  const tex = S.faceTex[f];
  let r,g2,b;
  if(S.shade === "height"){
    const t = (S.faceZ[f] - S.bounds.min.z) / Math.max(1, S.size.z);
    const a = TH.heightLo, m = TH.heightMid, hi = TH.heightHi;
    if(t < 0.5){ const u = t*2; r = a[0]+(m[0]-a[0])*u; g2 = a[1]+(m[1]-a[1])*u; b = a[2]+(m[2]-a[2])*u; }
    else { const u = (t-0.5)*2; r = m[0]+(hi[0]-m[0])*u; g2 = m[1]+(hi[1]-m[1])*u; b = m[2]+(hi[2]-m[2])*u; }
  } else if(S.shade === "material"){
    if(isSky(tex)){ r=TH.sky[0]; g2=TH.sky[1]; b=TH.sky[2]; }
    else if(tex.indexOf("*lava")===0){ r=TH.lavaC[0]; g2=TH.lavaC[1]; b=TH.lavaC[2]; }
    else if(tex.indexOf("*slime")===0){ r=TH.slimeC[0]; g2=TH.slimeC[1]; b=TH.slimeC[2]; }
    else if(isLiquid(tex)){ r=TH.waterC[0]; g2=TH.waterC[1]; b=TH.waterC[2]; }
    else { const c = TH.texPal[hashStr(tex) % TH.texPal.length];
           r = ((c>>16)&255)/255; g2 = ((c>>8)&255)/255; b = (c&255)/255; }
  } else if(S.shade === "light"){
    const L = S.faceLight ? S.faceLight[f] : -1;
    if(L < 0){ r = TH.face[0]*0.30; g2 = TH.face[1]*0.30; b = TH.face[2]*0.34; }
    else {
      const t = Math.pow(Math.min(1, L/210), 0.75);
      const a = TH.lightLo, m = TH.lightMid, hi = TH.lightHi;
      if(t < 0.5){ const u=t*2; r=a[0]+(m[0]-a[0])*u; g2=a[1]+(m[1]-a[1])*u; b=a[2]+(m[2]-a[2])*u; }
      else { const u=(t-0.5)*2; r=m[0]+(hi[0]-m[0])*u; g2=m[1]+(hi[1]-m[1])*u; b=m[2]+(hi[2]-m[2])*u; }
    }
  } else if(S.shade === "model"){
    const m = S.faceModel[f];
    if(m === 0){ r = TH.face[0]*0.62; g2 = TH.face[1]*0.62; b = TH.face[2]*0.62; }
    else { const h = (m*0.37)%1; const c = hsl(h, 0.55, TH.id === "vellum" ? 0.42 : 0.58); r=c[0];g2=c[1];b=c[2]; }
  } else {
    r=TH.face[0]; g2=TH.face[1]; b=TH.face[2];
  }
  out[0]=r; out[1]=g2; out[2]=b;
}

function hsl(h,s,l){
  const a = s*Math.min(l,1-l);
  function f(n){ const k=(n+h*12)%12; return l - a*Math.max(-1,Math.min(Math.min(k-3,9-k),1)); }
  return [f(0),f(8),f(4)];
}

function floorReached(f){
  const x = S.faceC[f*3], y = S.faceC[f*3+1], z = S.faceC[f*3+2];
  for(let k=0;k<4;k++){
    const c = cellAt(x, y, z + 20 + k*NAV.step);
    if(c >= 0 && NAV.dist[c] >= 0) return true;
  }
  return false;
}

function recolor(){
  if(!S.mesh) return;
  const reachedCheck = S.reachedOnly && NAV.built && NAV.dist && NAV.walk;
  const arr = S.colorAttr.array;
  const nrm = S.mesh.geometry.attributes.normal.array;
  const c = [0,0,0];
  const LX=0.35, LY=0.42, LZ=0.84;
  for(let f=0; f<S.faceCount; f++){
    const st = S.faceVertStart[f], ct = S.faceVertCount[f];
    if(ct === 0) continue;
    shadeFace(f, c);
    let mul = 1;
    if(S.shade !== "light"){
      const nx = nrm[st*3], ny = nrm[st*3+1], nz = nrm[st*3+2];
      const d = Math.abs(nx*LX + ny*LY + nz*LZ);
      mul = TH.shadeLo + TH.shadeHi*d;
    }

    let hidden = false;
    if(!S.showSky && isSky(S.faceTex[f])) hidden = true;
    if(S.visOnly && S.visFaces && !S.visFaces[f]) hidden = true;
    let unreached = false;
    if(reachedCheck && S.faceCls[f] === 0 && S.faceVertCount[f]){
      unreached = !floorReached(f);
    }

    let rr, gg, bb;
    if(hidden){ rr = TH.hidden[0]; gg = TH.hidden[1]; bb = TH.hidden[2]; }
    else if(S.visFaces && !S.visOnly && S.probeLeaf >= 0){
      if(S.visFaces[f]){ rr = c[0]*mul; gg = c[1]*mul; bb = c[2]*mul; }
      else {
        const g0 = (c[0]+c[1]+c[2])/3*mul;
        rr = TH.occl[0]*0.4 + g0*TH.occl[0]; gg = TH.occl[1]*0.4 + g0*TH.occl[1]; bb = TH.occl[2]*0.4 + g0*TH.occl[2];
      }
    } else { rr = c[0]*mul; gg = c[1]*mul; bb = c[2]*mul; }
    if(unreached){ const g0 = (rr+gg+bb)/3*0.42; rr = g0; gg = g0; bb = g0*1.05; }

    for(let i=st;i<st+ct;i++){ arr[i*3]=rr; arr[i*3+1]=gg; arr[i*3+2]=bb; }
  }
  S.colorAttr.needsUpdate = true;
}

/* ---------- leaf volumes ---------- */
function buildLeafBoxes(bsp){
  const pts = [];
  const seg = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  for(let i=1;i<bsp.nLeafs;i++){
    if(bsp.lContents[i] !== -1) continue;
    const x0=bsp.lMins[i*3],y0=bsp.lMins[i*3+1],z0=bsp.lMins[i*3+2];
    const x1=bsp.lMaxs[i*3],y1=bsp.lMaxs[i*3+1],z1=bsp.lMaxs[i*3+2];
    const v = [[x0,y0,z0],[x1,y0,z0],[x0,y1,z0],[x1,y1,z0],[x0,y0,z1],[x1,y0,z1],[x0,y1,z1],[x1,y1,z1]];
    for(let s=0;s<12;s++){
      const a=v[seg[s][0]], b=v[seg[s][1]];
      pts.push(a[0],a[1],a[2], b[0],b[1],b[2]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts),3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:TH.leaf, transparent:true, opacity:TH.leafOp }));
}

/* ---------- grid ---------- */
function buildGrid(){
  const step = 64, pts = [];
  const min = S.bounds.min, max = S.bounds.max;
  const x0 = Math.floor(min.x/step)*step, x1 = Math.ceil(max.x/step)*step;
  const y0 = Math.floor(min.y/step)*step, y1 = Math.ceil(max.y/step)*step;
  const z = min.z;
  const maxLines = 400;
  const sx = Math.max(1, Math.ceil((x1-x0)/step/maxLines));
  const sy = Math.max(1, Math.ceil((y1-y0)/step/maxLines));
  for(let x=x0; x<=x1; x+=step*sx) pts.push(x,y0,z, x,y1,z);
  for(let y=y0; y<=y1; y+=step*sy) pts.push(x0,y,z, x1,y,z);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts),3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:TH.grid, transparent:true, opacity:TH.gridOp }));
}

/* ---------- entity markers ---------- */
function entOrigin(e, bsp){
  if(e.origin){
    const p = e.origin.trim().split(/\s+/).map(Number);
    if(p.length === 3 && p.every(function(v){return !isNaN(v);})) return p;
  }
  if(e.model && e.model.charAt(0) === "*"){
    const mi = parseInt(e.model.slice(1),10);
    const m = bsp.models[mi];
    if(m) return [(m.min[0]+m.max[0])/2, (m.min[1]+m.max[1])/2, (m.min[2]+m.max[2])/2];
  }
  return null;
}

function buildEntities(){
  const grp = new THREE.Group();
  const bsp = S.bsp;
  const byCat = {};
  CATS.forEach(function(c){ byCat[c.id] = []; });

  S.ents.forEach(function(e, idx){
    const cn = (e.classname||"").toLowerCase();
    const cat = classify(cn, e);
    if(!cat) return;
    const o = entOrigin(e, bsp);
    if(!o) return;
    e.__pos = o; e.__cat = cat; e.__idx = idx;
    byCat[cat].push(e);
  });

  CATS.forEach(function(c){
    const list = byCat[c.id];
    if(!list.length) return;
    const geo = new THREE.OctahedronGeometry(c.size, 0);
    const mat = new THREE.MeshBasicMaterial({ color: TH.ent[c.id] !== undefined ? TH.ent[c.id] : c.color });
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    const mtx = new THREE.Matrix4();
    list.forEach(function(e,i){
      mtx.makeTranslation(e.__pos[0], e.__pos[1], e.__pos[2]);
      inst.setMatrixAt(i, mtx);
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.userData = { cat:c.id, list:list };
    inst.frustumCulled = false;
    grp.add(inst);
  });

  S.entByCat = byCat;
  return grp;
}

/* Markers hold a constant size on screen, so they never fall below a
   clickable radius however far out the camera pulls. */
const _mtx = new THREE.Matrix4(), _mv = new THREE.Vector3();
let markScale = 1.0;
let UI = 1;                      // interface zoom; the 3D canvas is never scaled

function refreshEntityMatrices(){
  if(!S.entGroup) return;
  const persp = camMode === "persp";
  const kf = persp ? (2*Math.tan(camP.fov*Math.PI/360)/viewH()) : pxScale();
  S.entGroup.children.forEach(function(inst){
    if(!inst.visible) return;
    const list = inst.userData.list;
    for(let i=0;i<list.length;i++){
      const e = list[i];
      _mv.set(e.__pos[0], e.__pos[1], e.__pos[2]);
      let sc;
      if(e.__on === false) sc = 1e-5;
      else {
        sc = markScale * (persp ? kf * cam.position.distanceTo(_mv) : kf);
        sc = Math.max(0.10, Math.min(28, sc));
      }
      _mtx.makeScale(sc,sc,sc); _mtx.setPosition(_mv.x,_mv.y,_mv.z);
      inst.setMatrixAt(i, _mtx);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
}

function updateEntityVisibility(){
  if(!S.entGroup) return;
  let n = 0;
  S.entGroup.children.forEach(function(inst){
    const on = !!S.catOn[inst.userData.cat];
    inst.visible = on;
    let shown = 0;
    inst.userData.list.forEach(function(e){ e.__on = inSkill(e, S.skill); if(e.__on) shown++; });
    if(on) n += shown;
  });
  refreshEntityMatrices();
  document.getElementById("entval").textContent = n + " shown";
}

/* ---------- trigger links ---------- */
function buildLinks(){
  const grp = new THREE.Group();
  const byName = {};
  S.ents.forEach(function(e){
    if(e.targetname){ (byName[e.targetname] = byName[e.targetname] || []).push(e); }
  });
  const pts = [], nodes = {}, edges = [];
  S.ents.forEach(function(e){
    if(!e.target) return;
    const dst = byName[e.target];
    if(!dst) return;
    const a = e.__pos || entOrigin(e, S.bsp);
    if(!a) return;
    dst.forEach(function(d){
      const b = d.__pos || entOrigin(d, S.bsp);
      if(!b) return;
      const mid = [(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2 + Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])*0.18];
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a[0],a[1],a[2]),
        new THREE.Vector3(mid[0],mid[1],mid[2]),
        new THREE.Vector3(b[0],b[1],b[2]));
      const p = curve.getPoints(14);
      for(let i=0;i<p.length-1;i++) pts.push(p[i].x,p[i].y,p[i].z, p[i+1].x,p[i+1].y,p[i+1].z);
      const ka = (e.classname||"?") + "\u0001" + (e.targetname||("#"+e.__idx));
      const kb = (d.classname||"?") + "\u0001" + (d.targetname||"");
      nodes[ka] = { label:(e.targetname||e.classname||"?"), cls:e.classname||"", idx:e.__idx };
      nodes[kb] = { label:(d.targetname||d.classname||"?"), cls:d.classname||"", idx:d.__idx };
      edges.push([ka,kb]);
    });
  });
  if(pts.length){
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts),3));
    grp.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:TH.link, transparent:true, opacity:TH.linkOp })));
  }
  S.graph = { nodes:nodes, edges:edges };
  graphLayout = null;
  return grp;
}

/* ---------- player reference solid ---------- */
function buildRef(){
  const g = new THREE.BoxGeometry(32,32,56);
  g.translate(0,0,4); // origin is 24 above mins, 32 below maxs
  const grp = new THREE.Group();
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g),
    new THREE.LineBasicMaterial({ color:TH.ref, transparent:true, opacity:TH.refOp }));
  const f = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color:TH.ref, transparent:true, opacity:0.10 }));
  grp.add(e); grp.add(f);
  grp.visible = false;
  return grp;
}
