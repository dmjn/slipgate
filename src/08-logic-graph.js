/* ============================ LOGIC GRAPH ============================ */
const gcv = document.getElementById("graph");
let graphLayout = null;   // abstract coordinates, independent of panel size
let graphScreen = null;   // the fitted coordinates actually drawn, for hit testing

function graphOpen(){ return document.getElementById("graphpanel").style.display === "flex"; }

/* Fruchterman-Reingold in free space. Nothing is clamped to the panel; the
   result is fitted afterwards, so resizing rescales rather than reshuffles. */
function layoutGraph(keys, edges){
  const N = keys.length;
  const idx = {}; keys.forEach(function(k,i){ idx[k] = i; });
  const E = edges.map(function(e){ return [idx[e[0]], idx[e[1]]]; })
                 .filter(function(e){ return e[0] !== undefined && e[1] !== undefined && e[0] !== e[1]; });

  const px = new Float32Array(N), py = new Float32Array(N);
  const SPAN = 1000;
  const k = Math.sqrt((SPAN*SPAN)/Math.max(1,N)) * 0.62;   // ideal edge length
  let seed = (N*2654435761) % 2147483647 || 7;
  const rnd = function(){ seed = (seed*16807) % 2147483647; return seed/2147483647; };
  for(let i=0;i<N;i++){
    const a = i/N*Math.PI*2, r = SPAN*0.3*(0.3+0.7*rnd());
    px[i] = Math.cos(a)*r; py[i] = Math.sin(a)*r;
  }

  const iters = N > 400 ? 110 : N > 200 ? 180 : N > 80 ? 320 : 460;
  const REP = 1.6, GRAV = 0.02;
  let temp = SPAN*0.10;
  const cool = temp/(iters+1);
  const dx = new Float32Array(N), dy = new Float32Array(N);

  for(let it=0; it<iters; it++){
    dx.fill(0); dy.fill(0);
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
      let ux = px[i]-px[j], uy = py[i]-py[j];
      let d = Math.hypot(ux,uy);
      if(d < 0.01){ ux = ((i*13)%7)-3+0.5; uy = ((j*11)%5)-2+0.5; d = Math.hypot(ux,uy); }
      const f = REP*(k*k)/(d*d);                // repulsion k^2/d
      dx[i]+=ux*f; dy[i]+=uy*f; dx[j]-=ux*f; dy[j]-=uy*f;
    }
    for(let m=0;m<E.length;m++){
      const u = E[m][0], v = E[m][1];
      const ux = px[v]-px[u], uy = py[v]-py[u];
      const d = Math.max(0.01, Math.hypot(ux,uy));
      const f = d/k;                            // attraction d^2/k
      dx[u]+=ux*f; dy[u]+=uy*f; dx[v]-=ux*f; dy[v]-=uy*f;
    }
    for(let i=0;i<N;i++){
      dx[i] -= px[i]*GRAV; dy[i] -= py[i]*GRAV;
      const len = Math.hypot(dx[i],dy[i]);
      if(len > 1e-6){ const sc = Math.min(len,temp)/len; px[i] += dx[i]*sc; py[i] += dy[i]*sc; }
    }
    temp -= cool;
  }

  // hard-sphere pass: nothing ends up closer than a readable fraction of k
  const MIN = k*0.8;
  for(let it=0; it<90; it++){
    let moved = 0;
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++){
      let ux = px[i]-px[j], uy = py[i]-py[j];
      let d = Math.hypot(ux,uy);
      if(d < 0.01){ ux = 1; uy = 0.3; d = 1.04; }
      if(d < MIN){
        const push = (MIN-d)/d*0.5;
        px[i]+=ux*push; py[i]+=uy*push; px[j]-=ux*push; py[j]-=uy*push;
        moved++;
      }
    }
    if(!moved) break;
  }
  return { keys:keys, px:px, py:py, E:E };
}

let graphFit = null;      // base screen mapping for the current panel size
let gview = { z:1, vx:0, vy:0 };

function drawGraph(){
  if(!S.graph || !graphOpen()) return;
  const W = gcv.clientWidth, H = gcv.clientHeight;
  if(W < 8 || H < 8) return;
  gcv.width = W*devicePixelRatio; gcv.height = H*devicePixelRatio;
  const ctx = gcv.getContext("2d");
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  ctx.clearRect(0,0,W,H);

  const cs = getComputedStyle(document.documentElement);
  const cvar = function(n){ return cs.getPropertyValue("--"+n).trim() || "#888"; };

  const keys = Object.keys(S.graph.nodes);
  if(!keys.length){
    ctx.fillStyle = cvar("dimmer");
    ctx.font = "11px 'IBM Plex Mono', monospace";
    ctx.fillText("No target / targetname links in this map.", 14, 26);
    graphLayout = null; graphScreen = null; graphFit = null;
    return;
  }

  const sig = keys.length + ":" + S.graph.edges.length + ":" + (S.mapName||"");
  if(!graphLayout || graphLayout.sig !== sig){
    graphLayout = layoutGraph(keys, S.graph.edges);
    graphLayout.sig = sig;
    graphFit = null;
  }

  const big = Math.min(W,H) > 340;
  const font = big ? 12 : 10;
  const nodeR = big ? 6.2 : 4.4;
  const maxLab = big ? 26 : 15;
  ctx.font = font + "px 'IBM Plex Mono', monospace";

  const labels = keys.map(function(k){
    const l = S.graph.nodes[k].label || "?";
    return l.length > maxLab ? l.slice(0,maxLab-1)+"…" : l;
  });

  const fitKey = sig + "|" + Math.round(W) + "x" + Math.round(H) + "|" + font;
  if(!graphFit || graphFit.key !== fitKey){
    let labW = 0;
    for(let i=0;i<labels.length;i++) labW = Math.max(labW, ctx.measureText(labels[i]).width);
    const ml = nodeR + 8, mr = Math.min(W*0.42, labW + nodeR + 12), mt = font + 6, mb = font + 6;
    const L = graphLayout, N = keys.length;
    let x0=Infinity, x1=-Infinity, y0=Infinity, y1=-Infinity;
    for(let i=0;i<N;i++){
      if(L.px[i]<x0) x0=L.px[i]; if(L.px[i]>x1) x1=L.px[i];
      if(L.py[i]<y0) y0=L.py[i]; if(L.py[i]>y1) y1=L.py[i];
    }
    const availW = Math.max(20, W-ml-mr), availH = Math.max(20, H-mt-mb);
    const sc = Math.min(availW/Math.max(1,x1-x0), availH/Math.max(1,y1-y0));
    const ox = ml + (availW - (x1-x0)*sc)/2, oy = mt + (availH - (y1-y0)*sc)/2;
    const bx = new Float32Array(N), by = new Float32Array(N);
    for(let i=0;i<N;i++){ bx[i] = ox + (L.px[i]-x0)*sc; by[i] = oy + (L.py[i]-y0)*sc; }
    graphFit = { key:fitKey, bx:bx, by:by, N:N };
    resetGraphView(W,H);
  }

  const F = graphFit, N = F.N, z = gview.z, vx = gview.vx, vy = gview.vy;
  const gx = new Float32Array(N), gy = new Float32Array(N);
  for(let i=0;i<N;i++){ gx[i] = F.bx[i]*z + vx; gy[i] = F.by[i]*z + vy; }
  graphScreen = { gx:gx, gy:gy, keys:keys };

  ctx.strokeStyle = cvar("dim"); ctx.globalAlpha = 0.40; ctx.lineWidth = Math.min(2, 1*Math.sqrt(z));
  ctx.beginPath();
  const E = graphLayout.E;
  for(let m=0;m<E.length;m++){
    ctx.moveTo(gx[E[m][0]], gy[E[m][0]]);
    ctx.lineTo(gx[E[m][1]], gy[E[m][1]]);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  const sel = S.selected;
  const R = nodeR * Math.min(1.7, Math.max(0.85, Math.sqrt(z)));
  for(let i=0;i<N;i++){
    if(gx[i] < -140 || gx[i] > W+40 || gy[i] < -30 || gy[i] > H+30) continue;
    const n = S.graph.nodes[keys[i]];
    const cn = (n.cls||"").toLowerCase();
    let col = cvar("dim");
    if(cn.indexOf("trigger_") === 0) col = cvar("slime");
    if(cn === "func_door") col = cvar("key");
    if(cn === "trigger_changelevel") col = cvar("lava");
    if(cn === "trigger_teleport" || cn === "info_teleport_destination") col = cvar("quad");
    const isSel = sel && n.idx === sel.__idx;
    if(isSel){
      ctx.strokeStyle = cvar("bone"); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(gx[i],gy[i],R+5,0,Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(gx[i],gy[i],R,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = cvar("bone"); ctx.globalAlpha = isSel ? 1 : 0.8;
    ctx.fillText(labels[i], gx[i]+R+4, gy[i]+font*0.34);
    ctx.globalAlpha = 1;
  }

  if(z > 1.02){
    ctx.fillStyle = cvar("dimmer"); ctx.font = "9px 'IBM Plex Mono', monospace";
    ctx.fillText(z.toFixed(1) + "\u00d7  double-click to fit", 10, H-8);
  }
}

/* zoom so the tightest neighbours sit far enough apart to read */
function resetGraphView(W,H){
  gview.z = 1; gview.vx = 0; gview.vy = 0;
  if(!graphFit) return;
  const N = graphFit.N;
  if(N < 2) return;
  let sum = 0;
  for(let i=0;i<N;i++){
    let m = Infinity;
    for(let j=0;j<N;j++){
      if(i===j) continue;
      const d = Math.hypot(graphFit.bx[i]-graphFit.bx[j], graphFit.by[i]-graphFit.by[j]);
      if(d < m) m = d;
    }
    sum += m;
  }
  const mean = sum/N;
  const z = Math.max(1, Math.min(5, 46/Math.max(1,mean)));
  gview.z = z;
  gview.vx = W/2 - (W/2)*z;
  gview.vy = H/2 - (H/2)*z;
}

/* pan, zoom, and pick on the graph canvas */
(function(){
  let drag = null, moved = 0;
  gcv.addEventListener("pointerdown", function(ev){
    drag = { x:ev.clientX, y:ev.clientY }; moved = 0;
    gcv.setPointerCapture(ev.pointerId);
    gcv.style.cursor = "grabbing";
  });
  gcv.addEventListener("pointermove", function(ev){
    if(!drag) return;
    const dx = (ev.clientX-drag.x)/UI, dy = (ev.clientY-drag.y)/UI;
    drag.x = ev.clientX; drag.y = ev.clientY;
    moved += Math.abs(dx)+Math.abs(dy);
    gview.vx += dx; gview.vy += dy;
    drawGraph();
  });
  gcv.addEventListener("pointerup", function(ev){
    const wasDrag = moved > 4;
    drag = null; gcv.style.cursor = "grab";
    if(wasDrag || !graphScreen) return;
    const r = gcv.getBoundingClientRect();
    const k = gcv.clientWidth / Math.max(1, r.width);   // undo the interface zoom
    const mx = (ev.clientX-r.left)*k, my = (ev.clientY-r.top)*k;
    let best = -1, bd = 24*24;
    for(let i=0;i<graphScreen.gx.length;i++){
      const dx = graphScreen.gx[i]-mx, dy = graphScreen.gy[i]-my;
      const d = dx*dx+dy*dy;
      if(d < bd){ bd = d; best = i; }
    }
    if(best < 0) return;
    const n = S.graph.nodes[graphScreen.keys[best]];
    if(n && n.idx !== undefined && S.ents[n.idx]){
      selectEntity(S.ents[n.idx]);
      frameBox(entBox(S.ents[n.idx]), 3.2);
      drawGraph();
    }
  });
  gcv.addEventListener("wheel", function(ev){
    ev.preventDefault();
    const r = gcv.getBoundingClientRect();
    const uz = gcv.clientWidth / Math.max(1, r.width);   // undo the interface zoom
    const mx = (ev.clientX-r.left)*uz, my = (ev.clientY-r.top)*uz;
    const f = Math.max(0.8, Math.min(1.25, Math.pow(1.0022, -ev.deltaY)));
    const nz = Math.max(0.25, Math.min(14, gview.z*f));
    const k = nz/gview.z;
    gview.vx = mx - (mx - gview.vx)*k;
    gview.vy = my - (my - gview.vy)*k;
    gview.z = nz;
    drawGraph();
  }, {passive:false});
  gcv.addEventListener("dblclick", function(ev){
    ev.preventDefault();
    resetGraphView(gcv.clientWidth, gcv.clientHeight);
    drawGraph();
  });
})();

/* drag the corner grip to resize */
(function(){
  const panel = document.getElementById("graphpanel");
  const grip = document.getElementById("graphGrip");
  let drag = null;
  grip.addEventListener("pointerdown", function(ev){
    ev.preventDefault(); ev.stopPropagation();
    drag = { x:ev.clientX, y:ev.clientY, w:panel.offsetWidth, h:panel.offsetHeight };
    grip.setPointerCapture(ev.pointerId);
  });
  grip.addEventListener("pointermove", function(ev){
    if(!drag) return;
    panel.style.width  = Math.max(260, Math.min(innerWidth*0.94/UI,  drag.w + (drag.x - ev.clientX)/UI)) + "px";
    panel.style.height = Math.max(180, Math.min(innerHeight*0.88/UI, drag.h + (drag.y - ev.clientY)/UI)) + "px";
    drawGraph();
  });
  grip.addEventListener("pointerup", function(){ drag = null; drawGraph(); });
  grip.addEventListener("pointercancel", function(){ drag = null; drawGraph(); });
})();

function setGraphSize(w,h){
  const panel = document.getElementById("graphpanel");
  panel.style.width = Math.min(w, innerWidth*0.94/UI) + "px";
  panel.style.height = Math.min(h, innerHeight*0.88/UI) + "px";
  requestAnimationFrame(drawGraph);
}
