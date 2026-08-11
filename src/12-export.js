/* ============================ EXPORT ============================ */
/* SVG is projected from the same camera the screen uses, so a plan drawing is
   the plan you were reading, at true Quake-unit scale and resolution free. */

const EXPORT = {
  fills:true, edges:true, ents:true, route:true, navFloor:false, block:true,
  pngScale:2, pngMode:"annotated", last:null, lastName:""
};

function download(name, blob){
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
    return true;
  } catch(err){ return false; }
}

function facePoly(f){
  const bsp = S.bsp, n = bsp.fNEdge[f], out = [];
  for(let k=0;k<n;k++){
    const se = bsp.surfedges[bsp.fEdge[f]+k];
    const vi = se >= 0 ? bsp.edges[se*2] : bsp.edges[(-se)*2+1];
    out.push([bsp.verts[vi*3], bsp.verts[vi*3+1], bsp.verts[vi*3+2]]);
  }
  return out;
}

/* Sutherland-Hodgman against the active cut, so sections cut cleanly rather
   than dropping whole faces */
function clipPoly(pts, pl){
  if(!pl) return pts;
  const nx = pl.normal.x, ny = pl.normal.y, nz = pl.normal.z, c = pl.constant;
  const d = pts.map(function(p){ return nx*p[0] + ny*p[1] + nz*p[2] + c; });
  if(d.every(function(v){ return v >= 0; })) return pts;
  if(d.every(function(v){ return v < 0; })) return [];
  const out = [];
  for(let i=0;i<pts.length;i++){
    const j = (i+1)%pts.length;
    if(d[i] >= 0) out.push(pts[i]);
    if((d[i] >= 0) !== (d[j] >= 0)){
      const t = d[i]/(d[i]-d[j]);
      out.push([ pts[i][0]+(pts[j][0]-pts[i][0])*t,
                 pts[i][1]+(pts[j][1]-pts[i][1])*t,
                 pts[i][2]+(pts[j][2]-pts[i][2])*t ]);
    }
  }
  return out;
}

function hex3(r,g,b){
  const c = function(v){ return ("0"+Math.max(0,Math.min(255,Math.round(v*255))).toString(16)).slice(-2); };
  return "#" + c(r) + c(g) + c(b);
}
function themeHex(v){ return "#" + v.toString(16).padStart(6,"0"); }

function buildSVG(){
  if(!S.bsp || !S.mesh) return null;
  const W = Math.round(canvas.clientWidth), H = Math.round(canvas.clientHeight);
  const cam2 = cam;
  const v = new THREE.Vector3();
  const proj = function(p){
    v.set(p[0],p[1],p[2]).project(cam2);
    return [ (v.x+1)/2*W, (1-v.y)/2*H, v.z ];
  };
  const pl = (S.cutAxis === "none") ? null : clipPlane;
  const colArr = S.colorAttr.array;
  const classOp = [1, S.surf.wallOp, S.surf.ceilOp];
  const classOn = [S.surf.floor, S.surf.wall, S.surf.ceil];

  const items = [];
  if(EXPORT.fills || EXPORT.edges){
    for(let f=0; f<S.faceCount; f++){
      if(!S.faceVertCount[f]) continue;
      const cls = S.faceCls[f];
      if(!classOn[cls]) continue;
      if(!S.showSky && isSky(S.faceTex[f])) continue;
      if(S.visOnly && S.visFaces && !S.visFaces[f]) continue;
      let poly = clipPoly(facePoly(f), pl);
      if(poly.length < 3) continue;
      const sp = poly.map(proj);
      let zsum = 0, off = 0;
      for(let k=0;k<sp.length;k++){
        zsum += sp[k][2];
        if(sp[k][0] < -W || sp[k][0] > 2*W || sp[k][1] < -H || sp[k][1] > 2*H) off++;
      }
      if(off === sp.length) continue;
      const st = S.faceVertStart[f]*3;
      items.push({
        z: zsum/sp.length,
        pts: sp.map(function(q){ return q[0].toFixed(1)+","+q[1].toFixed(1); }).join(" "),
        fill: hex3(colArr[st], colArr[st+1], colArr[st+2]),
        op: classOp[cls]
      });
    }
    items.sort(function(a,b){ return b.z - a.z; });     // painter, far first
  }

  const edgeCol = themeHex(S.lightEdges ? TH.edgeLight : TH.edge);
  const edgeOp = (S.lightEdges ? TH.edgeLightOp : TH.edgeOp);

  let out = '<?xml version="1.0" encoding="UTF-8"?>\n';
  out += '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" '
       + 'font-family="IBM Plex Mono, monospace">\n';
  out += '<rect width="'+W+'" height="'+H+'" fill="'+themeHex(TH.bg)+'"/>\n';

  if(EXPORT.navFloor && NAV.built && NAV.dist){
    out += '<g id="reachable">\n';
    const step = NAV.step, h = step*0.5;
    const maxd = Math.max(1, NAV.stats ? NAV.stats.maxd : 1);
    const lim = NAV.nearLimit||0, span = Math.max(1,(NAV.nearMax||lim+1)-lim);
    for(let i=0;i<NAV.walk.length;i++){
      if(NAV.walk[i] !== 1 || NAV.dist[i] < 0) continue;
      const off = NAV.near ? NAV.near[i] : 0;
      const optional = NAV.near && (off < 0 || off > lim);
      if(optional && !NAV.showOptional) continue;
      const c = navCenter(i);
      const quad = [[c[0]-h,c[1]-h,c[2]-h+1],[c[0]+h,c[1]-h,c[2]-h+1],[c[0]+h,c[1]+h,c[2]-h+1],[c[0]-h,c[1]+h,c[2]-h+1]];
      const cp = clipPoly(quad, pl);
      if(cp.length < 3) continue;
      const col = optional ? optRamp(off < 0 ? 1 : Math.min(1,(off-lim)/span)) : navRamp(NAV.dist[i]/maxd);
      out += '<polygon points="' + cp.map(proj).map(function(q){ return q[0].toFixed(1)+","+q[1].toFixed(1); }).join(" ")
           + '" fill="' + hex3(col[0],col[1],col[2]) + '" fill-opacity="0.72"/>\n';
    }
    out += '</g>\n';
  }

  out += '<g id="surfaces" stroke-linejoin="round">\n';
  items.forEach(function(it){
    out += '<polygon points="' + it.pts + '"'
        + (EXPORT.fills ? ' fill="'+it.fill+'" fill-opacity="'+it.op.toFixed(3)+'"' : ' fill="none"')
        + (EXPORT.edges ? ' stroke="'+edgeCol+'" stroke-opacity="'+(edgeOp*Math.max(0.22,it.op)).toFixed(3)+'" stroke-width="0.6"' : '')
        + '/>\n';
  });
  out += '</g>\n';

  if(EXPORT.route && NAV.path && NAV.path.length > 1){
    const pts = NAV.path.map(function(c){ return proj(navCenter(c)); })
      .map(function(q){ return q[0].toFixed(1)+","+q[1].toFixed(1); }).join(" ");
    out += '<polyline points="'+pts+'" fill="none" stroke="'+themeHex(TH.path)+'" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>\n';
    NAV.waypoints.forEach(function(w){
      const p = proj(navCenter(w.cell));
      const isExit = w.label === "exit";
      out += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="5" fill="'
           + themeHex(isExit ? TH.exitMark : TH.mark) + '"/>\n';
    });
  }

  if(EXPORT.ents && S.entGroup){
    out += '<g id="entities">\n';
    CATS.forEach(function(c){
      if(!S.catOn[c.id]) return;
      const list = (S.entByCat && S.entByCat[c.id]) || [];
      const col = themeHex(TH.ent[c.id] !== undefined ? TH.ent[c.id] : c.color);
      list.forEach(function(e){
        if(e.__on === false || !e.__pos) return;
        if(pl){
          const d = pl.normal.x*e.__pos[0] + pl.normal.y*e.__pos[1] + pl.normal.z*e.__pos[2] + pl.constant;
          if(d < 0) return;
        }
        const p = proj(e.__pos);
        if(p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) return;
        const r = Math.max(2.5, c.size*0.42*markScale);
        out += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+col+'"/>\n';
      });
    });
    out += '</g>\n';
  }

  if(EXPORT.block) out += svgTitleBlock(W,H);
  out += '</svg>\n';
  return out;
}

function svgTitleBlock(W,H){
  const bone = "#" + (TH.css.bone || "#ddd").replace("#","");
  const dim  = TH.css.dimmer || "#888";
  const acc  = TH.css.accent || bone;
  const unitsPerPx = pxScale();
  let bar = 64;
  while(bar/unitsPerPx < 60) bar *= 2;
  while(bar/unitsPerPx > 240) bar /= 2;
  const barPx = bar/unitsPerPx;
  const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};
  const mode = camMode.toUpperCase() + (S.cutAxis !== "none"
    ? "  ·  CUT " + S.cutAxis.toUpperCase() + " " + Math.round(S.bounds.min[S.cutAxis] + (S.bounds.max[S.cutAxis]-S.bounds.min[S.cutAxis])*S.cutT)
    : "");
  const y = H - 26;
  let g = '<g id="titleblock">\n';
  g += '<text x="24" y="'+(y-30)+'" fill="'+bone+'" font-size="21" font-weight="600" letter-spacing="1">'
     + esc(wm.message || S.mapName || "") + '</text>\n';
  g += '<text x="24" y="'+(y-12)+'" fill="'+dim+'" font-size="9.5" letter-spacing="2.4">'
     + esc((S.pakMaps && S.pakIndex>=0 ? S.pakMaps[S.pakIndex].short.toUpperCase()+"  ·  " : "") + mode) + '</text>\n';
  g += '<rect x="24" y="'+y+'" width="'+barPx.toFixed(1)+'" height="3" fill="'+acc+'"/>\n';
  g += '<text x="'+(24+barPx+8).toFixed(1)+'" y="'+(y+7)+'" fill="'+dim+'" font-size="9" letter-spacing="1.4">'
     + bar + ' units</text>\n';
  g += '</g>\n';
  return g;
}

/* ---------- raster ---------- */
function capturePNG(scale){
  const oldPR = renderer.getPixelRatio();
  const w = innerWidth, h = innerHeight;
  renderer.setPixelRatio(scale);
  renderer.setSize(w, h, false);
  camP.aspect = w/h; camP.updateProjectionMatrix();
  renderer.render(scene, cam);
  const url = renderer.domElement.toDataURL("image/png");
  renderer.setPixelRatio(oldPR);
  resize();
  return url;
}

function annotate(url, scale, done){
  const img = new Image();
  img.onload = function(){
    const cv = document.createElement("canvas");
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0);
    ctx.scale(scale, scale);
    const W = img.width/scale, H = img.height/scale;
    const cs = getComputedStyle(document.documentElement);
    const cvar = function(n){ return cs.getPropertyValue("--"+n).trim() || "#888"; };
    const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};

    const unitsPerPx = pxScale();
    let bar = 64;
    while(bar/unitsPerPx < 60) bar *= 2;
    while(bar/unitsPerPx > 240) bar /= 2;
    const barPx = bar/unitsPerPx;
    const y = H - 26;

    ctx.fillStyle = cvar("bone");
    ctx.font = "600 21px 'IBM Plex Mono', monospace";
    ctx.fillText(wm.message || S.mapName || "", 24, y-30);
    ctx.fillStyle = cvar("dimmer");
    ctx.font = "9.5px 'IBM Plex Mono', monospace";
    const mode = camMode.toUpperCase() + (S.cutAxis !== "none" ? "   CUT " + S.cutAxis.toUpperCase() : "");
    ctx.fillText((S.pakMaps && S.pakIndex>=0 ? S.pakMaps[S.pakIndex].short.toUpperCase()+"   " : "") + mode, 24, y-12);
    ctx.fillStyle = cvar("accent");
    ctx.fillRect(24, y, barPx, 3);
    ctx.fillStyle = cvar("dimmer");
    ctx.font = "9px 'IBM Plex Mono', monospace";
    ctx.fillText(bar + " units", 24+barPx+8, y+7);

    if(NAV.stats && NAV.path.length){
      const s2 = NAV.stats;
      const line = "route " + Math.round(s2.length) + "u   detour " + (s2.detour||0).toFixed(2) +
        "x   backtrack " + Math.round((s2.backtrack||0)*100) + "%   optional " + Math.round((s2.optional||0)*100) + "%";
      ctx.fillStyle = cvar("dim");
      ctx.font = "10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(line, W-24, y+7);
      ctx.textAlign = "left";
    }
    done(cv.toDataURL("image/png"));
  };
  img.onerror = function(){ done(url); };
  img.src = url;
}

let h2cState = 0;   // 0 untried, 1 loaded, 2 failed
function withInterface(scale, done){
  function run(){
    window.html2canvas(document.body, {
      backgroundColor: null,
      scale: scale,
      logging: false,
      ignoreElements: function(el){ return el.id === "exportPanel"; }
    }).then(function(cv){ done(cv.toDataURL("image/png"), null); })
      .catch(function(err){ done(null, "html2canvas failed: " + err.message); });
  }
  if(window.html2canvas){ h2cState = 1; run(); return; }
  if(h2cState === 2){ done(null, "The interface capture library could not be loaded."); return; }
  const sc = document.createElement("script");
  sc.src = "vendor/html2canvas.min.js";
  sc.onload = function(){ h2cState = 1; run(); };
  sc.onerror = function(){ h2cState = 2; done(null, "The interface capture library could not be loaded. Use ANNOTATED instead."); };
  document.head.appendChild(sc);
}

/* ---------- panel ---------- */
function renderExport(){
  const st = document.getElementById("expStatus");
  if(!st) return;
  document.querySelectorAll("[data-esvg]").forEach(function(b){
    b.classList.toggle("on", !!EXPORT[b.dataset.esvg]);
  });
  document.querySelectorAll("[data-escale]").forEach(function(b){
    b.classList.toggle("on", parseInt(b.dataset.escale,10) === EXPORT.pngScale);
  });
  document.querySelectorAll("[data-emode]").forEach(function(b){
    b.classList.toggle("on", b.dataset.emode === EXPORT.pngMode);
  });
  const note = document.getElementById("expNote");
  note.textContent = camMode === "persp"
    ? "Perspective projects fine, but ISO, PLAN and ELEV give parallel drawings that measure."
    : "Parallel projection: distances in the drawing hold their ratio at any zoom.";
}

function doExportSVG(){
  const st = document.getElementById("expStatus");
  if(!S.bsp){ st.textContent = "No map loaded."; return; }
  st.textContent = "Projecting…";
  setTimeout(function(){
    const svg = buildSVG();
    if(!svg){ st.textContent = "Nothing to draw."; return; }
    const name = (S.pakMaps && S.pakIndex>=0 ? S.pakMaps[S.pakIndex].short : "map") + "-" + camMode + ".svg";
    EXPORT.last = svg; EXPORT.lastName = name;
    const ok = download(name, new Blob([svg], {type:"image/svg+xml"}));
    const kb = Math.round(svg.length/1024);
    st.innerHTML = (ok ? "Saved <b>" + esc(name) + "</b>, " + kb + " KB. " : "Generated " + kb + " KB. ") +
      "<button class='elink' id='expShow'>show source</button>";
    document.getElementById("expPreview").innerHTML = "";
  }, 30);
}

function doExportPNG(){
  const st = document.getElementById("expStatus");
  if(!S.bsp){ st.textContent = "No map loaded."; return; }
  const scale = EXPORT.pngScale, mode = EXPORT.pngMode;
  st.textContent = "Rendering at " + scale + "\u00d7…";
  const base = (S.pakMaps && S.pakIndex>=0 ? S.pakMaps[S.pakIndex].short : "map") + "-" + camMode;
  setTimeout(function(){
    function finish(url, err){
      if(err || !url){ st.textContent = err || "Capture failed."; return; }
      const name = base + (mode === "interface" ? "-ui" : "") + "@" + scale + "x.png";
      fetch(url).then(function(r){ return r.blob(); }).then(function(b){
        const ok = download(name, b);
        st.innerHTML = (ok ? "Saved <b>" + esc(name) + "</b>. " : "") + "Right-click the image below to save it too.";
      }).catch(function(){
        st.textContent = "Right-click the image below to save it.";
      });
      document.getElementById("expPreview").innerHTML = "<img src='" + url + "' alt='export preview'>";
    }
    if(mode === "interface"){ withInterface(scale, finish); return; }
    const url = capturePNG(scale);
    if(mode === "annotated") annotate(url, scale, function(u){ finish(u, null); });
    else finish(url, null);
  }, 30);
}
