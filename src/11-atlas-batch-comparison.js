/* ============================ ATLAS: BATCH COMPARISON ============================ */
/* Runs the whole pak through the same pipeline one map at a time, so the
   per-map numbers become a comparable set rather than thirty-two separate
   readings. Everything here is derived from the user's own files. */

const ATLAS = { rows:[], running:false, stop:false, sortKey:"order", sortDir:1, plotX:"floorArea", plotY:"detour", csv:false };

const METRICS = [
  { k:"order",     label:"#",         w:34,  fmt:function(r){ return r.order+1; }, num:true },
  { k:"name",      label:"MAP",       w:66,  fmt:function(r){ return r.name; } },
  { k:"title",     label:"TITLE",     w:150, fmt:function(r){ return r.title || "—"; } },
  { k:"monsters",  label:"MON",       w:46,  fmt:function(r){ return r.monsters; }, num:true },
  { k:"hard",      label:"HARD",      w:46,  fmt:function(r){ return r.hard; }, num:true },
  { k:"secrets",   label:"SEC",       w:40,  fmt:function(r){ return r.secrets; }, num:true },
  { k:"gates",     label:"LOCKS",     w:48,  fmt:function(r){ return r.gates; }, num:true },
  { k:"stages",    label:"STAGE",     w:48,  fmt:function(r){ return r.stages; }, num:true },
  { k:"pathLen",   label:"PATH",      w:62,  fmt:function(r){ return r.pathLen ? Math.round(r.pathLen/64) + "m" : "—"; }, num:true },
  { k:"detour",    label:"DETOUR",    w:56,  fmt:function(r){ return r.detour ? r.detour.toFixed(2) : "—"; }, num:true },
  { k:"backtrack", label:"BACK",      w:48,  fmt:function(r){ return pctf(r.backtrack); }, num:true },
  { k:"optional",  label:"OPT",       w:44,  fmt:function(r){ return pctf(r.optional); }, num:true },
  { k:"floorArea", label:"FLOOR",     w:58,  fmt:function(r){ return r.floorArea ? Math.round(r.floorArea/1000) + "k" : "—"; }, num:true },
  { k:"density",   label:"MON/FLR",   w:60,  fmt:function(r){ return r.density ? r.density.toFixed(2) : "—"; }, num:true },
  { k:"openness",  label:"OPEN",      w:48,  fmt:function(r){ return pctf(r.openness); }, num:true },
  { k:"light",     label:"LIGHT",     w:48,  fmt:function(r){ return pctf(r.light); }, num:true },
  { k:"darkShare", label:"DARK",      w:46,  fmt:function(r){ return pctf(r.darkShare); }, num:true },
  { k:"darkRoute", label:"DARKRTE",   w:56,  fmt:function(r){ return pctf(r.darkRoute); }, num:true },
  { k:"floorShare",label:"FLR%",      w:44,  fmt:function(r){ return pctf(r.floorShare); }, num:true },
  { k:"faces",     label:"FACES",     w:56,  fmt:function(r){ return r.faces; }, num:true },
  { k:"extent",    label:"EXTENT",    w:58,  fmt:function(r){ return Math.round(r.extent); }, num:true }
];

const PLOTTABLE = METRICS.filter(function(m){ return m.num && m.k !== "order"; });

function pctf(v){ return (v === undefined || v === null) ? "—" : Math.round(v*100) + "%"; }

/* mean fraction of the map's surfaces visible from a sampled leaf: a direct
   measure of how open or how compartmented a level is */
function pvsOpenness(bsp){
  const empties = [];
  for(let i=1;i<bsp.nLeafs;i++) if(bsp.lContents[i] === -1) empties.push(i);
  if(!empties.length || !bsp.nFaces) return 0;
  const N = Math.min(72, empties.length);
  const vf = new Uint8Array(bsp.nFaces);
  let sum = 0;
  for(let k=0;k<N;k++){
    const leaf = empties[Math.floor(k*empties.length/N)];
    const vis = decompressVis(bsp, leaf);
    vf.fill(0);
    for(let i=1;i<bsp.nLeafs;i++){
      if(!vis[i]) continue;
      const st = bsp.lFirst[i], ct = bsp.lCount[i];
      for(let q=0;q<ct;q++){ const f = bsp.marks[st+q]; if(f < bsp.nFaces) vf[f] = 1; }
    }
    let n = 0;
    for(let i=0;i<vf.length;i++) if(vf[i]) n++;
    sum += n/bsp.nFaces;
  }
  return sum/N;
}

function floorShareOf(bsp){
  let f = 0;
  for(let i=0;i<bsp.nFaces;i++){
    const pi = bsp.fPlane[i]*4;
    let nz = bsp.planes[pi+2];
    if(bsp.fSide[i]) nz = -nz;
    if(nz > FLOOR_NZ) f++;
  }
  return bsp.nFaces ? f/bsp.nFaces : 0;
}

function collectRow(order, short, bsp, st, lm){
  const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};
  const ep = episodeOf(short);
  let mon = 0, hard = 0;
  S.ents.forEach(function(e){
    const cn = (e.classname||"").toLowerCase();
    if(cn.indexOf("monster_") !== 0) return;
    mon++;
    if(!(parseInt(e.spawnflags||"0",10) & NOT_HARD)) hard++;
  });
  const m0 = bsp.models[0];
  const extent = Math.max(m0.max[0]-m0.min[0], m0.max[1]-m0.min[1], m0.max[2]-m0.min[2]);
  const r = {
    order: order, name: short, title: wm.message || "",
    episode: ep ? ep.num : "", faces: bsp.nFaces, leaves: bsp.nLeafs,
    brushEnts: bsp.models.length-1, extent: extent,
    monsters: mon, hard: hard,
    secrets: S.ents.filter(function(e){ return e.classname === "trigger_secret"; }).length,
    teleports: S.ents.filter(function(e){ return e.classname === "trigger_teleport"; }).length,
    gates: NAV.doors ? NAV.doors.length : 0,
    stages: NAV.stages || 0,
    openness: pvsOpenness(bsp),
    floorShare: floorShareOf(bsp),
    complete: !!(st && st.complete),
    exitFound: !!(st && st.exitFound),
    forced: !!NAV.forcedOpen,
    error: st && st.error ? st.error : null
  };
  if(lm){
    const ls = lightStats(bsp, lm);
    if(ls.hasLight){ r.light = ls.meanFloorLight; r.darkShare = ls.darkShare; r.unlitShare = ls.unlitShare; }
    r.darkRoute = NAV.darkRoute || 0;
  }
  if(st && !st.error){
    r.pathLen = st.length; r.direct = st.crow; r.detour = st.detour;
    r.backtrack = st.backtrack; r.optional = st.optional; r.floorArea = st.floorArea;
    r.density = st.floorArea ? mon/(st.floorArea/10000) : 0;
  }
  return r;
}

function freeNav(){
  NAV.type = null; NAV.walk = null; NAV.solidC = null; NAV.gate = null;
  NAV.dist = null; NAV.prev = null; NAV.near = null; NAV.links = null;
  NAV.built = false;
}

function atlasRun(step){
  if(!S.pakMaps || !pakBuf || ATLAS.running) return;
  ATLAS.running = true; ATLAS.stop = false; ATLAS.rows = [];
  const maps = S.pakMaps;
  const saved = { bsp:S.bsp, ents:S.ents, byT:S.byTarget, byTn:S.byTargetname, mapName:S.mapName,
                  faceLight:S.faceLight, faceArea:S.faceArea };
  const t0 = performance.now();
  let i = 0;

  function finish(){
    ATLAS.running = false;
    S.bsp = saved.bsp; S.ents = saved.ents;
    S.byTarget = saved.byT; S.byTargetname = saved.byTn; S.mapName = saved.mapName;
    S.faceLight = saved.faceLight; S.faceArea = saved.faceArea;
    freeNav(); resetNav();
    renderAtlas();
  }

  function step2(){
    if(ATLAS.stop || i >= maps.length){ finish(); return; }
    const m = maps[i];
    const done = i, total = maps.length;
    const per = done ? (performance.now()-t0)/done : 0;
    atlasProgress(done, total, m.short, per ? Math.round(per*(total-done)/1000) : null);

    let bsp;
    try { bsp = parseBSP(pakBuf.slice(m.ofs, m.ofs+m.size)); }
    catch(err){
      ATLAS.rows.push({ order:i, name:m.short, title:"", error:err.message, monsters:0, hard:0, secrets:0, gates:0, stages:0, faces:0, extent:0, openness:0, floorShare:0 });
      i++; setTimeout(step2, 0); return;
    }

    S.bsp = bsp;
    S.ents = parseEnts(bsp.entStr);
    S.ents.forEach(function(e,k){ e.__idx = k; e.__pos = entOrigin(e, bsp); });
    S.byTargetname = {}; S.byTarget = {};
    S.ents.forEach(function(e){
      if(e.targetname) (S.byTargetname[e.targetname] = S.byTargetname[e.targetname] || []).push(e);
      if(e.target)     (S.byTarget[e.target]         = S.byTarget[e.target]         || []).push(e);
    });
    const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};
    S.mapName = wm.message || m.short;

    freeNav();
    buildNav(step, function(){}, function(){
      let st = null;
      try { st = solveProgression(); } catch(err){ st = { error: err.message }; }
      let lm = null;
      try {
        lm = computeFaceLight(bsp);
        S.faceLight = lm.light; S.faceArea = lm.area;
        NAV.darkRoute = routeDarkness(bsp, lm);
      } catch(err){ lm = null; }
      ATLAS.rows.push(collectRow(i, m.short, bsp, st, lm));
      freeNav();
      i++;
      setTimeout(step2, 0);
    });
  }
  step2();
}

/* Without a built mesh there is nothing to raycast, so the batch reads the
   brightness of the floor face nearest each route step instead. */
function routeDarkness(bsp, lm){
  if(!NAV.path || !NAV.path.length) return 0;
  const cells = {};
  for(let f=0; f<bsp.nFaces; f++){
    if(lm.light[f] < 0 || !lm.area[f]) continue;
    const pi = bsp.fPlane[f]*4;
    let nz = bsp.planes[pi+2];
    if(bsp.fSide[f]) nz = -nz;
    if(nz <= FLOOR_NZ) continue;
    const n = bsp.fNEdge[f];
    if(n < 3) continue;
    let sx=0, sy=0, sz=0;
    for(let k=0;k<n;k++){
      const se = bsp.surfedges[bsp.fEdge[f]+k];
      const vi = se >= 0 ? bsp.edges[se*2] : bsp.edges[(-se)*2+1];
      sx += bsp.verts[vi*3]; sy += bsp.verts[vi*3+1]; sz += bsp.verts[vi*3+2];
    }
    const c = cellAt(sx/n, sy/n, sz/n + NAV.step);
    if(c < 0) return 0;
    if(cells[c] === undefined || lm.area[f] > cells[c].a) cells[c] = { v:lm.light[f], a:lm.area[f] };
  }
  let dist = 0, dark = 0, prev = null;
  for(let k=0;k<NAV.path.length;k++){
    const c = navCenter(NAV.path[k]);
    const seg = prev ? Math.hypot(c[0]-prev[0], c[1]-prev[1], c[2]-prev[2]) : 0;
    dist += seg; prev = c;
    let rec = cells[NAV.path[k]];
    if(!rec){
      const below = NAV.path[k] - NAV.nx*NAV.ny;
      rec = cells[below];
    }
    if(rec && rec.v < DARK_T) dark += seg;
  }
  return dist ? dark/dist : 0;
}

/* ---------- rendering ---------- */
function atlasProgress(done, total, name, eta){
  const el = document.getElementById("atlasProg");
  if(!el) return;
  const pct = Math.round(done/total*100);
  el.innerHTML = "<div class='abar'><span style='width:" + pct + "%'></span></div>" +
    "<div class='anote'>" + done + " of " + total + " · " + esc(name) +
    (eta !== null ? " · about " + eta + "s left" : "") + "</div>";
}

function atlasSorted(){
  const key = ATLAS.sortKey, dir = ATLAS.sortDir;
  const rows = ATLAS.rows.slice();
  rows.sort(function(a,b){
    const x = a[key], y = b[key];
    if(x === undefined && y === undefined) return 0;
    if(x === undefined) return 1;
    if(y === undefined) return -1;
    if(typeof x === "string") return dir*x.localeCompare(y);
    return dir*(x-y);
  });
  return rows;
}

function renderAtlas(){
  const host = document.getElementById("atlasBody");
  if(!host) return;
  if(!ATLAS.rows.length){
    host.innerHTML = "<p class='anote' style='padding:20px 2px'>" +
      (S.pakMaps ? "Nothing measured yet. RUN walks every map in the pak through the same solve and tabulates the result."
                 : "Load a pak rather than a single BSP to compare maps.") + "</p>";
    return;
  }
  const rows = atlasSorted();
  let h = "<div class='atable'><table><thead><tr>";
  METRICS.forEach(function(m){
    const on = ATLAS.sortKey === m.k;
    h += "<th data-sort='" + m.k + "' class='" + (on ? "on" : "") + "' style='min-width:" + m.w + "px'>" +
         m.label + (on ? (ATLAS.sortDir > 0 ? " \u2191" : " \u2193") : "") + "</th>";
  });
  h += "</tr></thead><tbody>";
  rows.forEach(function(r){
    const flag = r.error ? " err" : (!r.exitFound ? " warn" : "");
    h += "<tr class='arow" + flag + "' data-map='" + r.order + "'>";
    METRICS.forEach(function(m){ h += "<td>" + esc(String(m.fmt(r))) + "</td>"; });
    h += "</tr>";
  });
  h += "</tbody></table></div>";

  h += "<div class='aplotwrap'><div class='aaxes'>" +
       "<label>X <select id='plotX'>" + plotOpts(ATLAS.plotX) + "</select></label>" +
       "<label>Y <select id='plotY'>" + plotOpts(ATLAS.plotY) + "</select></label>" +
       "<span class='anote'>Click a point or a row to load that map.</span></div>" +
       "<canvas id='aplot'></canvas></div>";

  if(ATLAS.csv) h += "<pre class='acsv' id='acsv'>" + esc(atlasCSV()) + "</pre>";
  host.innerHTML = h;
  drawPlot();
}

function plotOpts(sel){
  return PLOTTABLE.map(function(m){
    return "<option value='" + m.k + "'" + (m.k === sel ? " selected" : "") + ">" + m.label + "</option>";
  }).join("");
}

function atlasCSV(){
  const keys = ["order","name","title","episode","faces","leaves","brushEnts","extent","monsters","hard",
    "secrets","teleports","gates","stages","pathLen","direct","detour","backtrack","optional",
    "floorArea","density","openness","floorShare","light","darkShare","darkRoute","unlitShare","exitFound"];
  let out = keys.join(",") + "\n";
  atlasSorted().forEach(function(r){
    out += keys.map(function(k){
      let v = r[k];
      if(v === undefined || v === null) return "";
      if(typeof v === "number") return Math.round(v*10000)/10000;
      return '"' + String(v).replace(/"/g,'""') + '"';
    }).join(",") + "\n";
  });
  return out;
}

const EP_COLOR = ["dim","quad","slime","lava","key"];

function drawPlot(){
  const cv = document.getElementById("aplot");
  if(!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight;
  if(W < 20 || H < 20) return;
  cv.width = W*devicePixelRatio; cv.height = H*devicePixelRatio;
  const ctx = cv.getContext("2d");
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.clearRect(0,0,W,H);
  const cs = getComputedStyle(document.documentElement);
  const cvar = function(n){ return cs.getPropertyValue("--"+n).trim() || "#888"; };

  const xk = ATLAS.plotX, yk = ATLAS.plotY;
  const pts = ATLAS.rows.filter(function(r){ return typeof r[xk] === "number" && typeof r[yk] === "number"; });
  if(!pts.length){ ctx.fillStyle = cvar("dimmer"); ctx.font = "11px 'IBM Plex Mono',monospace";
    ctx.fillText("No maps carry both of those values.", 14, 24); return; }

  let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
  pts.forEach(function(r){
    x0=Math.min(x0,r[xk]); x1=Math.max(x1,r[xk]);
    y0=Math.min(y0,r[yk]); y1=Math.max(y1,r[yk]);
  });
  if(x1-x0 < 1e-9){ x1 = x0+1; }
  if(y1-y0 < 1e-9){ y1 = y0+1; }
  const ml=52, mr=16, mt=14, mb=28;
  const px = function(v){ return ml + (v-x0)/(x1-x0)*(W-ml-mr); };
  const py = function(v){ return H-mb - (v-y0)/(y1-y0)*(H-mt-mb); };

  ctx.strokeStyle = cvar("rule"); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ml,mt); ctx.lineTo(ml,H-mb); ctx.lineTo(W-mr,H-mb); ctx.stroke();
  ctx.fillStyle = cvar("dimmer"); ctx.font = "9px 'IBM Plex Mono',monospace";
  ctx.fillText(fmtNum(x0), ml, H-mb+14);
  ctx.fillText(fmtNum(x1), W-mr-30, H-mb+14);
  ctx.fillText(fmtNum(y1), 6, mt+8);
  ctx.fillText(fmtNum(y0), 6, H-mb);

  ATLAS.plotPts = [];
  pts.forEach(function(r){
    const x = px(r[xk]), y = py(r[yk]);
    ctx.fillStyle = cvar(EP_COLOR[parseInt(r.episode,10)] || "dim");
    ctx.beginPath(); ctx.arc(x,y,4.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = cvar("bone"); ctx.globalAlpha = 0.75;
    ctx.font = "9px 'IBM Plex Mono',monospace";
    ctx.fillText(r.name, x+6, y+3);
    ctx.globalAlpha = 1;
    ATLAS.plotPts.push({ x:x, y:y, order:r.order });
  });
}

function fmtNum(v){
  if(Math.abs(v) >= 10000) return Math.round(v/1000) + "k";
  if(Math.abs(v) >= 10) return String(Math.round(v));
  return v.toFixed(2);
}
