/* ============================ PERMALINK ============================ */
/* The whole reading lives in the URL hash: which map, which camera, which cut,
   which layers. A footnote can then point at a view rather than describe it. */

let permaLast = "", permaTimer = 0, permaApplying = false;

function catMask(){
  let m = 0;
  CATS.forEach(function(c,i){ if(S.catOn[c.id]) m |= (1<<i); });
  return m;
}
function setCatMask(m){
  CATS.forEach(function(c,i){
    S.catOn[c.id] = !!(m & (1<<i));
    const cb = document.getElementById("cat_"+c.id);
    if(cb) cb.checked = S.catOn[c.id];
  });
}

function serializeState(){
  if(!S.bsp) return "";
  const p = [];
  const short = (S.pakMaps && S.pakIndex >= 0) ? S.pakMaps[S.pakIndex].short : null;
  if(short) p.push("m=" + short);
  p.push("t=" + TH.id);
  p.push("c=" + camMode);
  p.push("s=" + S.shade);
  if(S.cutAxis !== "none") p.push("k=" + S.cutAxis + (S.cutFlip ? "!" : "") + "," + S.cutT.toFixed(3));
  p.push("f=" + [S.surf.floor?1:0, S.surf.wall?1:0, S.surf.ceil?1:0,
                 Math.round(S.surf.wallOp*100), Math.round(S.surf.ceilOp*100),
                 S.lightEdges?1:0].join(","));
  p.push("e=" + catMask() + "," + S.skill + "," + markScale.toFixed(1));
  p.push("v=" + [goal.az.toFixed(3), goal.el.toFixed(3), Math.round(goal.dist),
                 goal.zoom.toFixed(3), Math.round(goal.target.x),
                 Math.round(goal.target.y), Math.round(goal.target.z)].join(","));
  if(UI !== 1) p.push("u=" + UI.toFixed(1));
  if(S.probeLeaf >= 0 && S.probePt) p.push("p=" +
    [Math.round(S.probePt.x), Math.round(S.probePt.y), Math.round(S.probePt.z)].join(","));
  return p.join("&");
}

function pushState(){
  if(permaApplying) return;
  const str = serializeState();
  if(!str || str === permaLast) return;
  permaLast = str;
  try { history.replaceState(null, "", "#" + str); } catch(err){}
}

function schedulePush(){
  clearTimeout(permaTimer);
  permaTimer = setTimeout(pushState, 700);
}

function parseHash(){
  const h = location.hash.replace(/^#/, "");
  if(!h) return null;
  const out = {};
  h.split("&").forEach(function(kv){
    const i = kv.indexOf("=");
    if(i > 0) out[kv.slice(0,i)] = decodeURIComponent(kv.slice(i+1));
  });
  return Object.keys(out).length ? out : null;
}

/* Applied after a map is in place, so geometry-dependent settings stick. */
function applyState(q){
  if(!q) return;
  permaApplying = true;

  if(q.t) applyTheme(q.t);
  if(q.u){ UI = parseFloat(q.u) || 1;
    document.documentElement.style.setProperty("--ui", UI);
    const sl = document.getElementById("uiScale"); if(sl) sl.value = Math.round(UI*100);
    const lb = document.getElementById("uival"); if(lb) lb.textContent = UI.toFixed(1)+"\u00d7";
  }
  if(q.s){
    S.shade = q.s;
    document.querySelectorAll("[data-shade]").forEach(function(b){ b.classList.toggle("on", b.dataset.shade === q.s); });
  }
  if(q.k){
    const bits = q.k.split(",");
    S.cutAxis = bits[0].replace("!","");
    S.cutFlip = bits[0].indexOf("!") >= 0;
    S.cutT = parseFloat(bits[1]);
    const sl = document.getElementById("cutslider"); if(sl) sl.value = Math.round(S.cutT*1000);
    const fl = document.getElementById("cutflip"); if(fl) fl.checked = S.cutFlip;
    document.querySelectorAll("[data-cut]").forEach(function(b){ b.classList.toggle("on", b.dataset.cut === S.cutAxis); });
  }
  if(q.f){
    const b = q.f.split(",").map(Number);
    S.surf.floor = !!b[0]; S.surf.wall = !!b[1]; S.surf.ceil = !!b[2];
    S.surf.wallOp = (b[3]||0)/100; S.surf.ceilOp = (b[4]||0)/100;
    S.lightEdges = !!b[5];
    const w = document.getElementById("wallOp"); if(w) w.value = b[3];
    const c = document.getElementById("ceilOp"); if(c) c.value = b[4];
    const le = document.getElementById("tLightEdge"); if(le) le.checked = S.lightEdges;
  }
  if(q.e){
    const b = q.e.split(",");
    setCatMask(parseInt(b[0],10)||0);
    S.skill = parseInt(b[1],10);
    document.querySelectorAll("[data-skill]").forEach(function(x){ x.classList.toggle("on", parseInt(x.dataset.skill,10) === S.skill); });
    if(b[2]){ markScale = parseFloat(b[2]);
      const ms = document.getElementById("markSize"); if(ms) ms.value = Math.round(markScale*100);
      const mv = document.getElementById("markval"); if(mv) mv.textContent = markScale.toFixed(1)+"\u00d7";
    }
  }
  if(q.c) setCam(q.c);
  if(q.v){
    const n = q.v.split(",").map(Number);
    if(n.length === 7 && n.every(function(x){ return isFinite(x); })){
      goal.az = n[0]; goal.el = n[1]; goal.dist = n[2]; goal.zoom = n[3];
      goal.target.set(n[4], n[5], n[6]);
      snapCam();
    }
  }
  recolor(); applySurfaces(); updateEntityVisibility(); applyCut();
  if(q.p){
    const n = q.p.split(",").map(Number);
    if(n.length === 3){ setProbeMode(true); setProbe(new THREE.Vector3(n[0],n[1],n[2]), null); }
  }
  permaApplying = false;
  permaLast = serializeState();
}

function copyLink(){
  pushState();
  const url = location.origin + location.pathname + location.hash;
  const done = function(ok){
    const el = document.getElementById("linkNote");
    if(el) el.textContent = ok ? "Link copied." : url;
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){ done(true); }, function(){ done(false); });
  } else done(false);
}
