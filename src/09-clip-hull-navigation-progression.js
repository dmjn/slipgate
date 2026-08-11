/* ===================== CLIP HULL / NAVIGATION / PROGRESSION ===================== */
/* Quake ships its own navmesh. Hull 1 of the world model is the collision geometry
   already expanded by the player's 32x32x56 box, so a single point test at the
   player's origin answers "does the body fit here" with no swept collision. */

const T_SOLID = 0, T_EMPTY = 1, T_WATER = 2, T_SLIME = 3, T_LAVA = 4;

function hullContents(bsp, head, x, y, z){
  let n = head, guard = 0;
  while(n >= 0 && guard++ < 8192){
    const pi = bsp.clipPlane[n]*4;
    const d = bsp.planes[pi]*x + bsp.planes[pi+1]*y + bsp.planes[pi+2]*z - bsp.planes[pi+3];
    n = bsp.clipChild[n*2 + (d >= 0 ? 0 : 1)];
  }
  return n;
}

const NAV = {
  built:false, running:false, step:16,
  nx:0, ny:0, nz:0, ox:0, oy:0, oz:0,
  type:null, walk:null, gate:null, jump:null,
  doors:[], links:null,
  start:-1, exitCells:null,
  dist:null, prev:null,
  waypoints:[], path:[], stats:null, stages:0, near:null, nearLimit:0, nearMax:1,
  forcedOpen:false, diag:null, solidC:null,
  mesh:null, tube:null, marks:null, doorOf:null,
  showFloor:true, showPath:true, showTime:true, showOptional:true, dimOptional:true
};

function navIdx(x,y,z){ return x + y*NAV.nx + z*NAV.nx*NAV.ny; }
function navXYZ(i){
  const z = (i/(NAV.nx*NAV.ny))|0, r = i - z*NAV.nx*NAV.ny, y = (r/NAV.nx)|0;
  return [r - y*NAV.nx, y, z];
}
function navCenter(i){
  const c = navXYZ(i), h = NAV.step/2;
  return [NAV.ox + c[0]*NAV.step + h, NAV.oy + c[1]*NAV.step + h, NAV.oz + c[2]*NAV.step + h];
}
function cellAt(x,y,z){
  const cx = Math.floor((x-NAV.ox)/NAV.step), cy = Math.floor((y-NAV.oy)/NAV.step), cz = Math.floor((z-NAV.oz)/NAV.step);
  if(cx<0||cy<0||cz<0||cx>=NAV.nx||cy>=NAV.ny||cz>=NAV.nz) return -1;
  return navIdx(cx,cy,cz);
}
function nodeOK(i){ return NAV.walk[i] === 1 || NAV.type[i] === T_WATER || NAV.type[i] === T_SLIME; }

/* nearest navigable cell to a world point, spiralling outward */
function nearestNode(x,y,z,maxR){
  maxR = maxR || 6;
  const c0 = cellAt(x,y,z);
  if(c0 >= 0 && nodeOK(c0)) return c0;
  const p = [Math.floor((x-NAV.ox)/NAV.step), Math.floor((y-NAV.oy)/NAV.step), Math.floor((z-NAV.oz)/NAV.step)];
  for(let r=1;r<=maxR;r++){
    for(let dz=-r;dz<=r;dz++) for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz)) !== r) continue;
      const x2=p[0]+dx, y2=p[1]+dy, z2=p[2]+dz;
      if(x2<0||y2<0||z2<0||x2>=NAV.nx||y2>=NAV.ny||z2>=NAV.nz) continue;
      const i = navIdx(x2,y2,z2);
      if(nodeOK(i)) return i;
    }
  }
  return -1;
}

/* ---------- voxelisation ---------- */
function buildNav(step, onProgress, onDone){
  const bsp = S.bsp, m = bsp.models[0];
  const head = m.head[1];               // hull 1: player-sized
  const pad = step*2;
  NAV.step = step;
  NAV.ox = Math.floor((m.min[0]-pad)/step)*step;
  NAV.oy = Math.floor((m.min[1]-pad)/step)*step;
  NAV.oz = Math.floor((m.min[2]-pad)/step)*step;
  NAV.nx = Math.ceil((m.max[0]+pad-NAV.ox)/step);
  NAV.ny = Math.ceil((m.max[1]+pad-NAV.oy)/step);
  NAV.nz = Math.ceil((m.max[2]+pad-NAV.oz)/step);
  const total = NAV.nx*NAV.ny*NAV.nz;
  const type = NAV.type = new Uint8Array(total);
  const solidC = NAV.solidC = new Uint8Array(total);
  const h = step/2;
  /* A doorway 48 units wide leaves only 16 units of clearance once hull 1 has
     expanded it by the player box, so a single centre sample can miss the gap
     entirely. Five samples per cell catch it. */
  const OFF = [[0,0],[-0.32,-0.32],[0.32,-0.32],[-0.32,0.32],[0.32,0.32]];

  let z = 0;
  function chunk(){
    const t0 = performance.now();
    while(z < NAV.nz && performance.now()-t0 < 22){
      const wz = NAV.oz + z*step + h, base = z*NAV.nx*NAV.ny;
      for(let y=0;y<NAV.ny;y++){
        const wy = NAV.oy + y*step + h, row = base + y*NAV.nx;
        for(let x=0;x<NAV.nx;x++){
          const wx = NAV.ox + x*step + h;
          let t = T_SOLID;
          for(let k=0;k<5;k++){
            const c = hullContents(bsp, head, wx + OFF[k][0]*step, wy + OFF[k][1]*step, wz);
            if(k === 0 && c === -2) solidC[row+x] = 1;
            if(c === -1){ t = T_EMPTY; break; }
            if(t === T_SOLID){
              if(c === -3) t = T_WATER; else if(c === -4) t = T_SLIME; else if(c === -5) t = T_LAVA;
            }
          }
          type[row+x] = t;
        }
      }
      z++;
    }
    onProgress(z/NAV.nz*0.7);
    if(z < NAV.nz) setTimeout(chunk, 0);
    else { finishNav(onProgress, onDone); }
  }
  chunk();
}

function finishNav(onProgress, onDone){
  const total = NAV.nx*NAV.ny*NAV.nz, type = NAV.type, solidC = NAV.solidC;
  const walk = NAV.walk = new Uint8Array(total);
  const layer = NAV.nx*NAV.ny;
  /* standing means empty here with something solid under the centre of the cell
     below; using the centre sample keeps narrow ledges walkable */
  for(let i=layer;i<total;i++){
    if(type[i] === T_EMPTY && (type[i-layer] === T_SOLID || solidC[i-layer])) walk[i] = 1;
  }
  onProgress(0.8);
  buildGates();
  buildSpecialLinks();
  onProgress(0.92);
  NAV.built = true;
  onDone();
}

/* ---------- gates: doors that need a key or a trigger ---------- */
function doorRequirement(e){
  const cn = (e.classname||"").toLowerCase();
  if(cn !== "func_door" && cn !== "func_door_secret") return null;
  const sf = parseInt(e.spawnflags||"0",10);
  if(cn === "func_door" && (sf & 8))  return { key:"gold",   label:"gold key" };
  if(cn === "func_door" && (sf & 16)) return { key:"silver", label:"silver key" };
  if(e.targetname && (S.byTarget[e.targetname]||[]).length) return { tn:e.targetname, label:"triggered" };
  return null;
}

function entBounds(e){
  if(e.model && e.model.charAt(0) === "*"){
    const m = S.bsp.models[parseInt(e.model.slice(1),10)];
    if(m) return { min:m.min.slice(), max:m.max.slice() };
  }
  const p = e.__pos || entOrigin(e, S.bsp);
  if(!p) return null;
  return { min:[p[0]-24,p[1]-24,p[2]-24], max:[p[0]+24,p[1]+24,p[2]+24] };
}

function forCellsIn(b, grow, cb){
  const g = grow || 0;
  const x0 = Math.max(0, Math.floor((b.min[0]-g-NAV.ox)/NAV.step));
  const y0 = Math.max(0, Math.floor((b.min[1]-g-NAV.oy)/NAV.step));
  const z0 = Math.max(0, Math.floor((b.min[2]-g-NAV.oz)/NAV.step));
  const x1 = Math.min(NAV.nx-1, Math.ceil((b.max[0]+g-NAV.ox)/NAV.step));
  const y1 = Math.min(NAV.ny-1, Math.ceil((b.max[1]+g-NAV.oy)/NAV.step));
  const z1 = Math.min(NAV.nz-1, Math.ceil((b.max[2]+g-NAV.oz)/NAV.step));
  for(let z=z0;z<=z1;z++) for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) cb(navIdx(x,y,z));
}

function buildGates(){
  NAV.gate = new Int16Array(NAV.nx*NAV.ny*NAV.nz);
  NAV.doors = []; NAV.doorOf = new Map();
  S.ents.forEach(function(e){
    const req = doorRequirement(e);
    if(!req) return;
    const b = entBounds(e);
    if(!b) return;
    const id = NAV.doors.length;
    NAV.doorOf.set(e, id);
    NAV.doors.push({ ent:e, req:req, open:false, opener:null });
    forCellsIn(b, NAV.step, function(i){ if(nodeOK(i) && !NAV.gate[i]) NAV.gate[i] = id+1; });
  });
}

/* ---------- lifts and teleporters become explicit edges ---------- */
function buildSpecialLinks(){
  const links = NAV.links = new Map();
  function add(a,b){
    if(a < 0 || b < 0 || a === b) return;
    if(!links.has(a)) links.set(a, []);
    if(links.get(a).indexOf(b) < 0) links.get(a).push(b);
  }
  const byName = S.byTargetname;

  S.ents.forEach(function(e){
    const cn = (e.classname||"").toLowerCase();

    if(cn === "trigger_teleport" && e.target){
      const dsts = byName[e.target] || [];
      let dc = -1;
      for(let n=0;n<dsts.length && dc<0;n++){
        const dp = dsts[n].__pos || entOrigin(dsts[n], S.bsp);
        if(dp) dc = nearestNode(dp[0], dp[1], dp[2], 14);
      }
      const b = entBounds(e);
      if(b && dc >= 0){
        let hits = 0;
        forCellsIn(b, NAV.step, function(i){ if(nodeOK(i)){ add(i, dc); hits++; } });
        if(!hits){
          const c = nearestNode((b.min[0]+b.max[0])/2, (b.min[1]+b.max[1])/2, (b.min[2]+b.max[2])/2, 10);
          if(c >= 0) add(c, dc);
        }
      }
    }

    if(cn === "func_plat" || cn === "func_train" || cn === "func_bossgate"){
      const b = entBounds(e);
      if(!b) return;
      /* A plat's brush sits at its raised position, so its own bounds say
         nothing about where it travels. Take the whole shaft above and below
         the footprint and join every landing in it. */
      const cx = (b.min[0]+b.max[0])/2, cy = (b.min[1]+b.max[1])/2;
      const shaft = { min:[b.min[0], b.min[1], b.min[2]-400],
                      max:[b.max[0], b.max[1], b.max[2]+120] };
      const byZ = new Map();
      forCellsIn(shaft, NAV.step, function(i){
        if(NAV.walk[i] !== 1) return;
        const c = navXYZ(i), z = c[2];
        const cen = navCenter(i);
        const d = Math.hypot(cen[0]-cx, cen[1]-cy);
        const prev = byZ.get(z);
        if(!prev || d < prev.d) byZ.set(z, { i:i, d:d });
      });
      const zs = Array.from(byZ.keys()).sort(function(p,q){ return p-q; });
      for(let n=1;n<zs.length;n++){
        const lo = byZ.get(zs[n-1]).i, hi = byZ.get(zs[n]).i;
        add(lo,hi); add(hi,lo);
      }
    }
  });
}

/* ---------- movement rules ---------- */
/* step-up 18, jump apex 45 (270 velocity against 800 gravity), falls unlimited */
const HDIR = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];

function neighbors(i, out){
  out.length = 0;
  const nx = NAV.nx, ny = NAV.ny, nz = NAV.nz, type = NAV.type, walk = NAV.walk;
  const z = (i/(nx*ny))|0, r = i - z*nx*ny, y = (r/nx)|0, x = r - y*nx;
  const layer = nx*ny;
  const liquid = type[i] === T_WATER || type[i] === T_SLIME;

  if(liquid){
    for(let d=0; d<4; d++){
      const j = i + (d===0?1:d===1?-1:d===2?nx:-nx);
      const x2 = d===0?x+1:d===1?x-1:x, y2 = d===2?y+1:d===3?y-1:y;
      if(x2<0||x2>=nx||y2<0||y2>=ny) continue;
      if(nodeOK(j)) out.push(j);
    }
    if(z+1 < nz && nodeOK(i+layer)) out.push(i+layer);
    if(z-1 >= 0 && nodeOK(i-layer)) out.push(i-layer);
    // haul yourself out of the water onto a bank one cell up
    if(z+1 < nz) for(let d=0; d<8; d++){
      const x2 = x+HDIR[d][0], y2 = y+HDIR[d][1];
      if(x2<0||x2>=nx||y2<0||y2>=ny) continue;
      const j = navIdx(x2,y2,z+1);
      if(walk[j] || type[j] === T_WATER || type[j] === T_SLIME) out.push(j);
    }
  } else {
    const maxUp = Math.max(1, Math.round(45/NAV.step));   // 45-unit jump apex
    const maxDown = Math.min(24, nz);
    for(let d=0; d<8; d++){
      const dx = HDIR[d][0], dy = HDIR[d][1];
      const x2 = x+dx, y2 = y+dy;
      if(x2<0||x2>=nx||y2<0||y2>=ny) continue;
      if(dx && dy){ // no corner cutting
        if(type[navIdx(x+dx,y,z)] === T_SOLID || type[navIdx(x,y+dy,z)] === T_SOLID) continue;
      }
      /* Scan from the highest reachable landing downwards. Above the current
         level a blocked cell only rules out that height, so it continues; at or
         below the current level a solid cell is the ground and ends the scan. */
      for(let dz=maxUp; dz>=-maxDown; dz--){
        const z2 = z+dz;
        if(z2<0||z2>=nz) continue;
        const j = navIdx(x2,y2,z2);
        const t = type[j];
        if(dz > 0){
          if(t === T_SOLID || t === T_LAVA) continue;
          let clear = true;
          for(let q=1;q<=dz;q++){
            if(z+q >= nz || type[navIdx(x,y,z+q)] !== T_EMPTY){ clear = false; break; }
          }
          if(!clear) continue;
          if(t === T_WATER || t === T_SLIME){ out.push(j); break; }
          if(walk[j]){ out.push(j); break; }
          continue;
        }
        if(t === T_SOLID || t === T_LAVA) break;
        if(t === T_WATER || t === T_SLIME){ out.push(j); break; }
        if(walk[j]){ out.push(j); break; }
      }
    }
    // short hop across a gap, level or downward
    for(let d=0; d<4; d++){
      const dx = HDIR[d][0], dy = HDIR[d][1];
      const xm = x+dx, ym = y+dy, x2 = x+dx*2, y2 = y+dy*2;
      if(x2<0||x2>=nx||y2<0||y2>=ny) continue;
      if(type[navIdx(xm,ym,z)] !== T_EMPTY) continue;
      if(walk[navIdx(xm,ym,z)]) continue;        // no gap, ordinary walk covers it
      for(let dz=0; dz>=-3; dz--){
        const z2 = z+dz;
        if(z2<0) break;
        const j = navIdx(x2,y2,z2);
        if(type[j] === T_SOLID) break;
        if(walk[j]){ out.push(j); break; }
      }
    }
  }
  const sp = NAV.links.get(i);
  if(sp) for(let k=0;k<sp.length;k++) out.push(sp[k]);
}

/* ---------- flood ---------- */
function flood(startCell, openMask){
  const total = NAV.nx*NAV.ny*NAV.nz;
  if(!NAV.gate) NAV.gate = new Int16Array(total);
  const dist = new Int32Array(total).fill(-1);
  const prev = new Int32Array(total).fill(-1);
  if(startCell < 0) return { dist:dist, prev:prev, count:0 };
  const q = new Int32Array(total);
  let qh = 0, qt = 0, count = 0;
  q[qt++] = startCell; dist[startCell] = 0;
  const out = [];
  while(qh < qt){
    const i = q[qh++]; count++;
    neighbors(i, out);
    for(let k=0;k<out.length;k++){
      const j = out[k];
      if(dist[j] >= 0) continue;
      const g = NAV.gate[j];
      if(g && !openMask[g-1]) continue;
      dist[j] = dist[i]+1; prev[j] = i;
      q[qt++] = j;
    }
  }
  return { dist:dist, prev:prev, count:count };
}

function pathBetween(f, cell){
  const out = [];
  let c = cell, guard = 0;
  while(c >= 0 && guard++ < 200000){ out.push(c); c = f.prev[c]; }
  return out.reverse();
}

/* ---------- entity anchoring ---------- */
function entCells(e){
  const b = entBounds(e);
  const out = [];
  if(!b) return out;
  forCellsIn(b, NAV.step, function(i){ if(nodeOK(i)) out.push(i); });
  if(!out.length){
    const p = e.__pos || entOrigin(e, S.bsp);
    if(p){ const c = nearestNode(p[0],p[1],p[2],8); if(c>=0) out.push(c); }
  }
  return out;
}
function reachedAt(f, cells){
  let best = -1, bd = Infinity;
  for(let k=0;k<cells.length;k++){
    const d = f.dist[cells[k]];
    if(d >= 0 && d < bd){ bd = d; best = cells[k]; }
  }
  return best;
}

/* ---------- the solve ---------- */
function solveProgression(){
  const ents = S.ents;
  const start = ents.find(function(e){ return e.classname === "info_player_start"; });
  if(!start) return { error:"No info_player_start in this map." };
  const sp = start.__pos || entOrigin(start, S.bsp);
  NAV.start = nearestNode(sp[0], sp[1], sp[2], 10);
  if(NAV.start < 0) return { error:"Could not anchor the player start to open space." };

  const exits = ents.filter(function(e){ return e.classname === "trigger_changelevel"; });
  const exitCellSets = exits.map(entCells);

  // keys and the entities that can open a triggered door
  const keyEnts = { silver:null, gold:null };
  ents.forEach(function(e){
    if(e.classname === "item_key1" && !keyEnts.silver) keyEnts.silver = e;
    if(e.classname === "item_key2" && !keyEnts.gold)   keyEnts.gold   = e;
  });

  const openMask = new Uint8Array(Math.max(1, NAV.doors.length));
  const inv = { silver:false, gold:false };
  const snapshots = [openMask.slice()];
  const stageOf = new Map();       // entity -> stage index at which it became reachable
  let f = null, stage = 0;

  for(; stage < 16; stage++){
    f = flood(NAV.start, openMask);
    let changed = false;

    ["silver","gold"].forEach(function(k){
      const e = keyEnts[k];
      if(!e || inv[k]) return;
      if(reachedAt(f, entCells(e)) >= 0){ inv[k] = true; stageOf.set(e, stage); }
    });

    // which targetnames can now be fired
    const fired = new Set();
    ents.forEach(function(e){
      if(!e.target) return;
      const cn = (e.classname||"").toLowerCase();
      if(cn.indexOf("trigger_") !== 0 && cn !== "func_button" && cn !== "func_door") return;
      const di = NAV.doorOf.has(e) ? NAV.doorOf.get(e) : -1;
      if(di >= 0 && !openMask[di]) return;          // a locked door fires nothing
      if(reachedAt(f, entCells(e)) >= 0){
        fired.add(e.target);
        if(!stageOf.has(e)) stageOf.set(e, stage);
      }
    });
    // relays: anything already fired passes the signal along
    let grew = true, guard = 0;
    while(grew && guard++ < 24){
      grew = false;
      ents.forEach(function(e){
        if(!e.targetname || !e.target) return;
        if(fired.has(e.targetname) && !fired.has(e.target)){ fired.add(e.target); grew = true; }
      });
    }

    NAV.doors.forEach(function(d,i){
      if(openMask[i]) return;
      const r = d.req;
      if(r.key && inv[r.key]){ openMask[i] = 1; d.opener = keyEnts[r.key]; changed = true; return; }
      if(r.tn && fired.has(r.tn)){
        openMask[i] = 1; changed = true;
        const src = (S.byTarget[r.tn] || []).find(function(e){ return reachedAt(f, entCells(e)) >= 0; });
        d.opener = src || null;
      }
    });

    snapshots.push(openMask.slice());
    if(!changed) break;
  }

  let final = flood(NAV.start, openMask);
  let exitCell = -1;
  for(let k=0;k<exitCellSets.length && exitCell < 0;k++) exitCell = reachedAt(final, exitCellSets[k]);
  NAV.forcedOpen = false;
  if(exitCell < 0 && NAV.doors.length){
    openMask.fill(1);
    NAV.forcedOpen = true;
    snapshots.push(openMask.slice());
    final = flood(NAV.start, openMask);
    for(let k=0;k<exitCellSets.length && exitCell < 0;k++) exitCell = reachedAt(final, exitCellSets[k]);
  }

  // required chain: which gated doors does the route to the exit actually cross
  const required = [];
  const seen = new Set();
  function requireRoute(cell, depth){
    if(cell < 0 || depth > 8) return;
    const path = pathBetween(final, cell);
    const gates = new Set();
    for(let k=0;k<path.length;k++){ const g = NAV.gate[path[k]]; if(g && openMask[g-1]) gates.add(g-1); }
    gates.forEach(function(di){
      const op = NAV.doors[di].opener;
      if(!op || seen.has(op)) return;
      seen.add(op);
      requireRoute(reachedAt(final, entCells(op)), depth+1);
      required.push(op);
    });
  }
  requireRoute(exitCell, 0);

  required.sort(function(a,b){ return (stageOf.get(a)||0) - (stageOf.get(b)||0); });

  // legs, each walked under the lock state of its own stage
  const waypoints = [];
  let cursor = NAV.start, poly = [], ok = true;
  required.forEach(function(e){
    const st = Math.min(snapshots.length-1, (stageOf.get(e)||0));
    const lf = flood(cursor, snapshots[st]);
    const target = reachedAt(lf, entCells(e));
    if(target < 0){ ok = false; return; }
    poly = poly.concat(pathBetween(lf, target));
    waypoints.push({ ent:e, cell:target, label:labelFor(e) });
    cursor = target;
  });
  if(exitCell >= 0){
    const lf = flood(cursor, openMask);
    let tgt = -1;
    for(let k=0;k<exitCellSets.length && tgt < 0;k++) tgt = reachedAt(lf, exitCellSets[k]);
    if(tgt >= 0){
      poly = poly.concat(pathBetween(lf, tgt));
      waypoints.push({ ent:exits[0], cell:tgt, label:"exit" });
    } else ok = false;
  }

  let reachedFloor = 0, totalFloor = 0;
  for(let i=0;i<NAV.walk.length;i++){
    if(NAV.walk[i] !== 1) continue;
    totalFloor++;
    if(final.dist[i] >= 0) reachedFloor++;
  }
  NAV.diag = {
    startCell: NAV.start,
    exitEnts: exits.length,
    exitAnchors: exitCellSets.reduce(function(a,c){ return a+c.length; }, 0),
    reachedFloor: reachedFloor,
    totalFloor: totalFloor,
    gates: NAV.doors.length,
    unopened: NAV.doors.filter(function(d,i){ return !openMask[i]; }).length,
    teleports: NAV.links ? NAV.links.size : 0
  };

  NAV.dist = final.dist; NAV.prev = final.prev;
  NAV.waypoints = waypoints;
  NAV.path = poly;
  NAV.stages = stage+1;
  NAV.stats = measurePath(poly, final, exitCell);
  NAV.stats.exitFound = exitCell >= 0;
  NAV.stats.complete = ok && exitCell >= 0;
  return NAV.stats;
}

function labelFor(e){
  if(e.classname === "item_key1") return "silver key";
  if(e.classname === "item_key2") return "gold key";
  return (e.classname||"trigger").replace(/^(func|trigger)_/,"");
}

function measurePath(poly, f, exitCell){
  const step = NAV.step;
  let len = 0, back = 0;
  const visited = new Set();
  let prevC = null;
  for(let k=0;k<poly.length;k++){
    const c = navCenter(poly[k]);
    if(prevC){
      const d = Math.hypot(c[0]-prevC[0], c[1]-prevC[1], c[2]-prevC[2]);
      len += d;
      if(visited.has(poly[k])) back += d;
    }
    visited.add(poly[k]);
    prevC = c;
  }
  // reachable floor and how much of it the route never needs
  let floorCells = 0, offRoute = 0;
  const onPath = new Set(poly);
  const total = NAV.nx*NAV.ny*NAV.nz;
  const near = new Int32Array(total).fill(-1);
  const q = new Int32Array(total);
  let qh = 0, qt = 0;
  poly.forEach(function(c){ if(near[c] < 0){ near[c] = 0; q[qt++] = c; } });
  const out = [];
  const limit = Math.ceil(160/step);
  /* uncapped, so every reachable cell carries a real distance from the route
     and the off-route volume can be graded rather than merely flagged */
  while(qh < qt){
    const i = q[qh++];
    neighbors(i, out);
    for(let k=0;k<out.length;k++){
      const j = out[k];
      if(near[j] >= 0 || f.dist[j] < 0) continue;
      near[j] = near[i]+1; q[qt++] = j;
    }
  }
  let nearMax = limit+1;
  for(let i=0;i<total;i++){
    if(f.dist[i] < 0 || NAV.walk[i] !== 1) continue;
    floorCells++;
    if(near[i] > limit){ offRoute++; if(near[i] > nearMax) nearMax = near[i]; }
  }
  NAV.near = near; NAV.nearLimit = limit; NAV.nearMax = nearMax;
  let maxd = 0;
  for(let i=0;i<total;i++) if(f.dist[i] > maxd) maxd = f.dist[i];
  const s = navCenter(NAV.start), e = exitCell >= 0 ? navCenter(exitCell) : s;
  const crow = Math.hypot(e[0]-s[0], e[1]-s[1], e[2]-s[2]);
  return {
    length: Math.round(len),
    crow: Math.round(crow),
    detour: crow > 1 ? len/crow : 0,
    backtrack: len > 0 ? back/len : 0,
    floorArea: floorCells*step*step,
    optional: floorCells ? offRoute/floorCells : 0,
    floorCells: floorCells,
    maxd: maxd,
    onPath: onPath
  };
}

/* ---------- darkness ----------
   Area-weighted, so a large dim hall counts for more than a small dim ledge.
   DARK_T is a quarter of full brightness. */
const DARK_T = 64;

function lightStats(bsp, lm){
  let litArea = 0, sum = 0, darkArea = 0, unlitArea = 0;
  for(let f=0; f<bsp.nFaces; f++){
    const pi = bsp.fPlane[f]*4;
    let nz = bsp.planes[pi+2];
    if(bsp.fSide[f]) nz = -nz;
    if(nz <= FLOOR_NZ) continue;               // floors only
    const a = lm.area[f];
    if(!a) continue;
    const v = lm.light[f];
    if(v < 0){ unlitArea += a; continue; }
    litArea += a; sum += v*a;
    if(v < DARK_T) darkArea += a;
  }
  return {
    meanFloorLight: litArea ? sum/litArea/255 : 0,
    darkShare: litArea ? darkArea/litArea : 0,
    unlitShare: (litArea+unlitArea) ? unlitArea/(litArea+unlitArea) : 0,
    hasLight: litArea > 0
  };
}

/* brightness under each step of the route, by dropping a ray onto the floor */
function samplePathLight(){
  NAV.lightProfile = null; NAV.darkRoute = 0;
  if(!S.mesh || !S.faceLight || !NAV.path.length) return;
  const ray2 = new THREE.Raycaster();
  const down = new THREE.Vector3(0,0,-1);
  const org = new THREE.Vector3();
  const prof = [];
  let dist = 0, dark = 0, prev = null;
  for(let k=0;k<NAV.path.length;k++){
    const c = navCenter(NAV.path[k]);
    if(prev) dist += Math.hypot(c[0]-prev[0], c[1]-prev[1], c[2]-prev[2]);
    const segLen = prev ? Math.hypot(c[0]-prev[0], c[1]-prev[1], c[2]-prev[2]) : 0;
    prev = c;
    org.set(c[0], c[1], c[2]);
    ray2.set(org, down);
    ray2.far = NAV.step*6 + 64;
    const hit = ray2.intersectObject(S.mesh, false)[0];
    let v = -1;
    if(hit && hit.faceIndex !== undefined){
      const f = S.triFace[hit.faceIndex];
      if(f !== undefined) v = S.faceLight[f];
    }
    prof.push({ d:dist, v:v });
    if(v >= 0 && v < DARK_T) dark += segLen;
  }
  NAV.lightProfile = prof;
  NAV.darkRoute = dist ? dark/dist : 0;
}

/* ---------- overlay geometry ---------- */
function navRamp(t){
  const a = TH.navLo, m = TH.navMid, h = TH.navHi;
  if(t < 0.5){ const u = t*2; return [a[0]+(m[0]-a[0])*u, a[1]+(m[1]-a[1])*u, a[2]+(m[2]-a[2])*u]; }
  const u = (t-0.5)*2; return [m[0]+(h[0]-m[0])*u, m[1]+(h[1]-m[1])*u, m[2]+(h[2]-m[2])*u];
}
/* the off-route field gets its own hue family, keyed to distance from the route
   rather than to time from the start, so the two readings never blur together */
function optRamp(t){
  const a = TH.optLo, h = TH.optHi;
  return [a[0]+(h[0]-a[0])*t, a[1]+(h[1]-a[1])*t, a[2]+(h[2]-a[2])*t];
}
function rgbCss(c){
  return "rgb(" + Math.round(c[0]*255) + "," + Math.round(c[1]*255) + "," + Math.round(c[2]*255) + ")";
}

function buildNavOverlay(){
  clearNavOverlay();
  if(!NAV.built || !NAV.dist) return;
  const step = NAV.step, h = step*0.5, lift = 1.5;
  const pos = [], col = [];
  const maxd = Math.max(1, NAV.stats ? NAV.stats.maxd : 1);
  const total = NAV.nx*NAV.ny*NAV.nz;
  const lim = NAV.nearLimit || 0, span = Math.max(1, (NAV.nearMax||lim+1) - lim);
  for(let i=0;i<total;i++){
    if(NAV.walk[i] !== 1 || NAV.dist[i] < 0) continue;
    const off = NAV.near ? NAV.near[i] : 0;
    const optional = NAV.near && (off < 0 || off > lim);
    if(optional && !NAV.showOptional) continue;
    const c = navCenter(i);
    const z = c[2] - h + lift;
    const x0 = c[0]-h*0.92, x1 = c[0]+h*0.92, y0 = c[1]-h*0.92, y1 = c[1]+h*0.92;
    pos.push(x0,y0,z, x1,y0,z, x1,y1,z,  x0,y0,z, x1,y1,z, x0,y1,z);
    let r,g,b;
    if(optional){
      const t = off < 0 ? 1 : Math.min(1, (off-lim)/span);
      const q = optRamp(t); r=q[0]; g=q[1]; b=q[2];
      if(NAV.dimOptional){ r*=0.62; g*=0.62; b*=0.62; }
    } else if(NAV.showTime){
      const t = navRamp(NAV.dist[i]/maxd); r=t[0]; g=t[1]; b=t[2];
    } else { const q = TH.navMid; r=q[0]*0.55; g=q[1]*0.7; b=q[2]; }
    for(let k=0;k<6;k++) col.push(r,g,b);
  }
  if(pos.length){
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos),3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col),3));
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      vertexColors:true, transparent:true, opacity:0.72, side:THREE.DoubleSide,
      depthWrite:false, clippingPlanes: S.mesh ? S.mesh.material[0].clippingPlanes : []
    }));
    mesh.visible = NAV.showFloor;
    NAV.mesh = mesh; scene.add(mesh);
  }

  if(NAV.path.length > 1){
    const pts = NAV.path.map(function(c){ const p = navCenter(c); return new THREE.Vector3(p[0],p[1],p[2]); });
    const curve = new THREE.CatmullRomCurve3(pts);
    const seg = Math.min(2400, Math.max(24, pts.length*2));
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, seg, Math.max(3, step*0.28), 6, false),
      new THREE.MeshBasicMaterial({ color:TH.path, transparent:true, opacity:0.95,
        depthTest:false, clippingPlanes: S.mesh ? S.mesh.material[0].clippingPlanes : [] }));
    tube.renderOrder = 997;
    tube.visible = NAV.showPath;
    NAV.tube = tube; scene.add(tube);

    const marks = new THREE.Group();
    NAV.waypoints.forEach(function(w,i){
      const p = navCenter(w.cell);
      const isExit = w.label === "exit";
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(isExit?18:15,0),
        new THREE.MeshBasicMaterial({ color: isExit?TH.exitMark:TH.mark, depthTest:false }));
      m.position.set(p[0],p[1],p[2]+14);
      m.renderOrder = 998;
      marks.add(m);
    });
    marks.visible = NAV.showPath;
    NAV.marks = marks; scene.add(marks);
  }
}

function clearNavOverlay(){
  [NAV.mesh, NAV.tube, NAV.marks].forEach(function(o){
    if(!o) return;
    scene.remove(o);
    o.traverse(function(c){ if(c.geometry) c.geometry.dispose(); if(c.material) c.material.dispose(); });
  });
  NAV.mesh = NAV.tube = NAV.marks = null;
}

function resetNav(){
  clearNavOverlay();
  NAV.built = false; NAV.dist = null; NAV.prev = null; NAV.near = null; NAV.diag = null;
  NAV.lightProfile = null; NAV.darkRoute = 0;
  const sp = document.getElementById("lightSpark");
  if(sp) sp.style.display = "none";
  NAV.path = []; NAV.waypoints = []; NAV.stats = null; NAV.type = null; NAV.walk = null; NAV.solidC = null;
  const el = document.getElementById("floodout");
  if(el) el.innerHTML = "Not solved yet.";
  const w = document.getElementById("waylist");
  if(w) w.innerHTML = "";
}

function drawLightSpark(){
  const cv = document.getElementById("lightSpark");
  if(!cv) return;
  const prof = NAV.lightProfile;
  if(!prof || prof.length < 2){ cv.style.display = "none"; return; }
  cv.style.display = "block";
  const W = cv.clientWidth, H = cv.clientHeight;
  if(W < 8) return;
  cv.width = W*devicePixelRatio; cv.height = H*devicePixelRatio;
  const ctx = cv.getContext("2d");
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.clearRect(0,0,W,H);
  const cs = getComputedStyle(document.documentElement);
  const cvar = function(n){ return cs.getPropertyValue("--"+n).trim() || "#888"; };
  const total = prof[prof.length-1].d || 1;
  const px = function(d){ return d/total*W; };
  const py = function(v){ return H-3 - Math.min(1, v/210)*(H-9); };

  // the dark band, so the stretches below threshold read at a glance
  ctx.fillStyle = cvar("rule"); ctx.globalAlpha = 0.55;
  ctx.fillRect(0, py(DARK_T), W, H-py(DARK_T));
  ctx.globalAlpha = 1;

  ctx.strokeStyle = cvar("accent"); ctx.lineWidth = 1.4;
  ctx.beginPath();
  let started = false;
  prof.forEach(function(p){
    if(p.v < 0){ started = false; return; }
    const x = px(p.d), y = py(p.v);
    if(!started){ ctx.moveTo(x,y); started = true; } else ctx.lineTo(x,y);
  });
  ctx.stroke();
  ctx.fillStyle = cvar("dimmer"); ctx.font = "8px 'IBM Plex Mono', monospace";
  ctx.fillText("start", 0, 8);
  ctx.textAlign = "right"; ctx.fillText("exit", W, 8); ctx.textAlign = "left";
}

/* ---------- run ---------- */
function runFlood(){
  if(!S.bsp || NAV.running) return;
  if(!S.bsp.nClip){ document.getElementById("floodout").innerHTML =
    "<b style='color:var(--lava)'>This map has no clipnode lump, so the player hull can't be sampled.</b>"; return; }
  NAV.running = true;
  const btn = document.getElementById("floodBtn");
  btn.disabled = true; btn.textContent = "SOLVING";
  const out = document.getElementById("floodout");

  let step = parseInt(document.querySelector("[data-res].on").dataset.res, 10);
  const m = S.bsp.models[0];
  const span = [m.max[0]-m.min[0], m.max[1]-m.min[1], m.max[2]-m.min[2]];
  while((span[0]/step+4)*(span[1]/step+4)*(span[2]/step+4) > 3.6e6 && step < 64) step *= 2;

  clearNavOverlay();
  out.innerHTML = "Sampling the player hull at " + step + " units…";

  buildNav(step, function(p){
    out.innerHTML = "Sampling the player hull at " + step + " units… " + Math.round(p*100) + "%";
  }, function(){
    out.innerHTML = "Flooding…";
    setTimeout(function(){
      let res;
      try { res = solveProgression(); }
      catch(err){ res = { error: err.message }; }
      NAV.running = false;
      btn.disabled = false; btn.textContent = "SOLVE PATH";
      if(res.error){ out.innerHTML = "<b style='color:var(--lava)'>" + esc(res.error) + "</b>"; return; }
      samplePathLight();
      renderFloodStats(res, step);
      buildNavOverlay();
      if(S.reachedOnly) recolor();
      applyCut();
    }, 20);
  });
}

function renderFloodStats(st, step){
  const out = document.getElementById("floodout");
  const pct = function(v){ return (v*100).toFixed(0) + "%"; };
  let h = "";
  if(!st.exitFound){
    const d = NAV.diag || {};
    h += "<div style='color:var(--lava);margin-bottom:6px'>Exit not reachable. The route below is partial.</div>";
    h += "<div class='fs'><i>exit triggers</i><em>" + (d.exitEnts||0) + "</em></div>";
    h += "<div class='fs'><i>exit anchored to</i><em>" + (d.exitAnchors||0) + " cells</em></div>";
    h += "<div class='fs'><i>floor reached</i><em>" + (d.reachedFloor||0) + " / " + (d.totalFloor||0) + "</em></div>";
    h += "<div class='fs'><i>locks unopened</i><em>" + (d.unopened||0) + " of " + (d.gates||0) + "</em></div>";
    h += "<div class='fs'><i>special links</i><em>" + (d.teleports||0) + "</em></div>";
    h += "<p class='hint' style='margin:8px 0 10px'>" +
      (!d.exitAnchors ? "The exit trigger has no open cells near it, so it sits somewhere the player hull cannot be sampled. Try FINE 16."
       : d.unopened ? "Some locks never opened, so the route stops at a door."
       : "The exit is anchored but the flood never arrived, which usually means a gap in traversal such as a lift or a jump the grid could not resolve. Try FINE 16.") + "</p>";
  }
  else if(NAV.forcedOpen) h += "<div style='color:var(--dim);margin-bottom:6px'>Locks could not all be resolved, so every door was opened. Treat the order as approximate.</div>";
  h += "<div class='fs'><i>grid</i><em>" + step + " u</em></div>";
  h += "<div class='fs'><i>path</i><em>" + st.length.toLocaleString() + " u</em></div>";
  h += "<div class='fs'><i>direct</i><em>" + st.crow.toLocaleString() + " u</em></div>";
  h += "<div class='fs'><i>detour</i><em>" + (st.detour ? st.detour.toFixed(2) + "×" : "—") + "</em></div>";
  h += "<div class='fs'><i>backtrack</i><em>" + pct(st.backtrack) + "</em></div>";
  h += "<div class='fs'><i>floor</i><em>" + Math.round(st.floorArea/1000).toLocaleString() + "k u²</em></div>";
  h += "<div class='fs'><i>optional</i><em>" + pct(st.optional) + "</em></div>";
  h += "<div class='fs'><i>gates</i><em>" + NAV.doors.length + " · " + (NAV.stages) + " stages</em></div>";
  if(S.bsp && S.faceLight){
    const ls = lightStats(S.bsp, { light:S.faceLight, area:S.faceArea });
    if(ls.hasLight){
      h += "<div class='fs'><i>floor light</i><em>" + Math.round(ls.meanFloorLight*100) + "%</em></div>";
      h += "<div class='fs'><i>dark floor</i><em>" + Math.round(ls.darkShare*100) + "%</em></div>";
      h += "<div class='fs'><i>dark route</i><em>" + Math.round((NAV.darkRoute||0)*100) + "%</em></div>";
    }
  }

  const routeGrad = "linear-gradient(90deg," + rgbCss(TH.navLo) + "," + rgbCss(TH.navMid) + "," + rgbCss(TH.navHi) + ")";
  const optGrad   = "linear-gradient(90deg," + rgbCss(TH.optLo) + "," + rgbCss(TH.optHi) + ")";
  h += "<div class='legend'>" +
       "<div><span class='bar' style='background:" + routeGrad + "'></span>route · time from start</div>" +
       "<div><span class='bar' style='background:" + optGrad + "'></span>optional · distance off route</div>" +
       "</div>";
  out.innerHTML = h;

  drawLightSpark();

  const w = document.getElementById("waylist");
  let wh = "";
  wh += "<button class='wp' data-wp='-1'><span>00</span>player start</button>";
  NAV.waypoints.forEach(function(p,i){
    wh += "<button class='wp' data-wp='" + i + "'><span>" + ("0"+(i+1)).slice(-2) + "</span>" + esc(p.label) + "</button>";
  });
  w.innerHTML = wh;
}
