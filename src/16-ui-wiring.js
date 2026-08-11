/* ============================ UI WIRING ============================ */
const drop = document.getElementById("drop");
["dragenter","dragover"].forEach(function(t){
  addEventListener(t, function(e){ e.preventDefault(); drop.classList.remove("gone"); drop.classList.add("drag"); });
});
addEventListener("dragleave", function(e){
  if(e.clientX===0 && e.clientY===0){ drop.classList.remove("drag"); if(S.bsp) drop.classList.add("gone"); }
});
addEventListener("drop", function(e){
  e.preventDefault(); drop.classList.remove("drag");
  if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  else if(S.bsp) drop.classList.add("gone");
});
document.getElementById("fileInput").addEventListener("change", function(e){
  if(e.target.files.length) handleFile(e.target.files[0]);
});
document.getElementById("newBtn").onclick = function(){
  document.getElementById("dropErr").style.display = "none";
  document.getElementById("drop").classList.remove("gone");
};

document.querySelectorAll("[data-cam]").forEach(function(b){ b.onclick = function(){ setCam(b.dataset.cam); }; });
document.getElementById("frameAllBtn").onclick = frameAll;
document.getElementById("frameSelBtn").onclick = frameSelection;
document.getElementById("mIndex").onclick = function(){ showPicker(); };
document.getElementById("mPrev").onclick = function(){ if(S.pakMaps && S.pakIndex > 0) loadFromPak(S.pakIndex-1); };
document.getElementById("mNext").onclick = function(){ if(S.pakMaps && S.pakIndex < S.pakMaps.length-1) loadFromPak(S.pakIndex+1); };
document.getElementById("pkClose").onclick = function(){ if(S.bsp) document.getElementById("picker").classList.remove("show"); };

document.querySelectorAll("[data-shade]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("[data-shade]").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on"); S.shade = b.dataset.shade; recolor();
  };
});

document.querySelectorAll("[data-cut]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("[data-cut]").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on"); S.cutAxis = b.dataset.cut; applyCut();
  };
});
document.getElementById("cutslider").oninput = function(e){ S.cutT = e.target.value/1000; applyCut(); };
document.getElementById("cutflip").onchange = function(e){ S.cutFlip = e.target.checked; applyCut(); };

["tEdges","tSolid","tSky","tLeaf","tGrid","tLinks","tRef","tVisOnly"].forEach(function(id){
  document.getElementById(id).onchange = function(){ applyToggles(); recolor(); };
});

document.getElementById("tGraph").onchange = function(e){
  document.getElementById("graphpanel").style.display = e.target.checked ? "flex" : "none";
  if(e.target.checked) requestAnimationFrame(function(){ requestAnimationFrame(drawGraph); });
};
document.getElementById("graphClose").onclick = function(){
  document.getElementById("tGraph").checked = false;
  document.getElementById("graphpanel").style.display = "none";
};
document.getElementById("graphFitBtn").onclick = function(){
  resetGraphView(gcv.clientWidth, gcv.clientHeight);
  drawGraph();
};
document.getElementById("graphExpand").onclick = function(){
  const panel = document.getElementById("graphpanel");
  const wide = panel.offsetWidth*UI > innerWidth*0.6;
  if(wide){ setGraphSize(360, 280); this.textContent = "expand"; }
  else { setGraphSize((innerWidth-40)/UI, (innerHeight-40)/UI); this.textContent = "shrink"; }
};
addEventListener("resize", function(){
  const panel = document.getElementById("graphpanel");
  if(panel.style.display !== "flex") return;
  panel.style.width  = Math.min(panel.offsetWidth,  innerWidth*0.94/UI) + "px";
  panel.style.height = Math.min(panel.offsetHeight, innerHeight*0.88/UI) + "px";
  requestAnimationFrame(drawGraph);
});

function setProbeMode(on){
  S.probeMode = on;
  document.getElementById("probeBtn").classList.toggle("on", on);
  canvas.style.cursor = on ? "crosshair" : "default";
  if(!on){
    S.probeFollow = false;
    document.getElementById("tFollow").checked = false;
  }
}
document.getElementById("probeBtn").onclick = function(){ setProbeMode(!S.probeMode); };
document.getElementById("tFollow").onchange = function(e){
  S.probeFollow = e.target.checked;
  if(e.target.checked && !S.probeMode) setProbeMode(true);
};
document.getElementById("probeStart").onclick = function(){
  if(!S.bsp) return;
  const st = S.ents.find(function(e){ return e.classname === "info_player_start"; });
  if(!st) return;
  const o = st.__pos || entOrigin(st, S.bsp);
  if(!o) return;
  setProbeMode(true);
  setProbe(new THREE.Vector3(o[0],o[1],o[2]+16), null);
};
document.getElementById("probeClr").onclick = function(){
  S.probeLeaf = -1; S.visFaces = null;
  if(S.probeMark) S.probeMark.visible = false;
  setProbeMode(false);
  document.getElementById("visval").textContent = "—";
  recolor();
};
document.getElementById("measBtn").onclick = function(){
  S.measMode = !S.measMode; S.measPts = [];
  this.classList.toggle("on", S.measMode);
  drawMeasure();
};

document.getElementById("exportBtn").onclick = function(){
  document.getElementById("exportPanel").classList.add("show");
  renderExport();
};
document.getElementById("expClose").onclick = function(){
  document.getElementById("exportPanel").classList.remove("show");
};
document.querySelectorAll("[data-esvg]").forEach(function(b){
  b.onclick = function(){ EXPORT[b.dataset.esvg] = !EXPORT[b.dataset.esvg]; renderExport(); };
});
document.querySelectorAll("[data-escale]").forEach(function(b){
  b.onclick = function(){ EXPORT.pngScale = parseInt(b.dataset.escale,10); renderExport(); };
});
document.querySelectorAll("[data-emode]").forEach(function(b){
  b.onclick = function(){ EXPORT.pngMode = b.dataset.emode; renderExport(); };
});
document.getElementById("expSvg").onclick = doExportSVG;
document.getElementById("expPng").onclick = doExportPNG;
document.getElementById("expStatus").addEventListener("click", function(ev){
  if(ev.target.id !== "expShow" || !EXPORT.last) return;
  document.getElementById("expPreview").innerHTML = "<pre></pre>";
  document.querySelector("#expPreview pre").textContent = EXPORT.last;
});

document.getElementById("atlasBtn").onclick = function(){
  const a = document.getElementById("atlas");
  a.classList.add("show");
  document.getElementById("atlasSub").textContent =
    S.pakMaps ? (S.pakMaps.length + " maps in " + S.pakName) : "no pak loaded";
  renderAtlas();
};
document.getElementById("atlasClose").onclick = function(){
  ATLAS.stop = true;
  document.getElementById("atlas").classList.remove("show");
};
document.querySelectorAll("[data-ares]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("[data-ares]").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on");
  };
});
document.getElementById("atlasRun").onclick = function(){
  if(!S.pakMaps){ document.getElementById("atlasProg").innerHTML = "<div class='anote'>Load a pak first.</div>"; return; }
  const st = parseInt(document.querySelector("[data-ares].on").dataset.ares, 10);
  atlasRun(st);
};
document.getElementById("atlasStop").onclick = function(){ ATLAS.stop = true; };
document.getElementById("atlasCsv").onclick = function(){
  ATLAS.csv = !ATLAS.csv;
  this.classList.toggle("on", ATLAS.csv);
  renderAtlas();
};
document.getElementById("atlasBody").addEventListener("click", function(ev){
  const th = ev.target.closest("[data-sort]");
  if(th){
    const k = th.dataset.sort;
    if(ATLAS.sortKey === k) ATLAS.sortDir *= -1; else { ATLAS.sortKey = k; ATLAS.sortDir = 1; }
    renderAtlas(); return;
  }
  const tr = ev.target.closest("[data-map]");
  if(tr){
    document.getElementById("atlas").classList.remove("show");
    loadFromPak(parseInt(tr.dataset.map,10));
  }
});
document.getElementById("atlasBody").addEventListener("change", function(ev){
  if(ev.target.id === "plotX") ATLAS.plotX = ev.target.value;
  if(ev.target.id === "plotY") ATLAS.plotY = ev.target.value;
  drawPlot();
});
document.getElementById("atlasBody").addEventListener("click", function(ev){
  if(ev.target.id !== "aplot" || !ATLAS.plotPts) return;
  const r = ev.target.getBoundingClientRect();
  const mx = ev.clientX-r.left, my = ev.clientY-r.top;
  let best = -1, bd = 18*18;
  ATLAS.plotPts.forEach(function(p){
    const d = (p.x-mx)*(p.x-mx) + (p.y-my)*(p.y-my);
    if(d < bd){ bd = d; best = p.order; }
  });
  if(best >= 0){
    document.getElementById("atlas").classList.remove("show");
    loadFromPak(best);
  }
});

document.getElementById("codexBtn").onclick = function(){
  const c = document.getElementById("codex");
  const open = c.classList.toggle("show");
  document.body.classList.toggle("codex-open", open);
  this.classList.toggle("on", open);
  if(open) renderCodex();
  if(graphOpen()) requestAnimationFrame(drawGraph);
};
document.getElementById("codexClose").onclick = function(){
  document.getElementById("codex").classList.remove("show");
  document.body.classList.remove("codex-open");
  document.getElementById("codexBtn").classList.remove("on");
  if(graphOpen()) requestAnimationFrame(drawGraph);
};
document.querySelectorAll("[data-ctab]").forEach(function(b){
  b.onclick = function(){ CODEX.tab = b.dataset.ctab; renderCodex(); };
});
document.getElementById("codexBody").addEventListener("click", function(ev){
  const t = ev.target.closest("[data-ent]");
  if(!t) return;
  const e = S.ents[parseInt(t.dataset.ent,10)];
  if(!e) return;
  selectEntity(e);
  frameBox(entBox(e), 3.4);
});

document.querySelectorAll("[data-surf]").forEach(function(b){
  b.onclick = function(){ S.surf[b.dataset.surf] = !S.surf[b.dataset.surf]; applySurfaces(); };
});
document.getElementById("wallOp").oninput = function(e){ S.surf.wallOp = e.target.value/100; applySurfaces(); };
document.getElementById("ceilOp").oninput = function(e){ S.surf.ceilOp = e.target.value/100; applySurfaces(); };
document.getElementById("surfSolid").onclick = function(){
  const flat = S.surf.wallOp > 0.95 && S.surf.ceilOp > 0.95;
  S.surf.wallOp = flat ? 0.35 : 1; S.surf.ceilOp = flat ? 0.12 : 1;
  document.getElementById("wallOp").value = S.surf.wallOp*100;
  document.getElementById("ceilOp").value = S.surf.ceilOp*100;
  this.classList.toggle("on", !flat);
  applySurfaces();
};
document.getElementById("tReached").onchange = function(e){ S.reachedOnly = e.target.checked; recolor(); };
document.getElementById("tLightEdge").onchange = function(e){ S.lightEdges = e.target.checked; applySurfaces(); };

document.querySelectorAll("[data-theme]").forEach(function(b){
  b.onclick = function(){ applyTheme(b.dataset.theme); };
});

document.getElementById("uiScale").oninput = function(e){
  UI = e.target.value/100;
  document.documentElement.style.setProperty("--ui", UI);
  document.getElementById("uival").textContent = UI.toFixed(1) + "\u00d7";
  const panel = document.getElementById("graphpanel");
  panel.style.width  = Math.min(panel.offsetWidth,  innerWidth*0.94/UI) + "px";
  panel.style.height = Math.min(panel.offsetHeight, innerHeight*0.88/UI) + "px";
  requestAnimationFrame(drawGraph);
};

document.getElementById("markSize").oninput = function(e){
  markScale = e.target.value/100;
  document.getElementById("markval").textContent = markScale.toFixed(1) + "\u00d7";
  refreshEntityMatrices();
};

document.querySelectorAll("[data-res]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("[data-res]").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on");
  };
});
document.getElementById("floodBtn").onclick = runFlood;

["tFloor","tTime","tOpt","tDim","tPath"].forEach(function(id){
  document.getElementById(id).onchange = function(){
    NAV.showFloor    = document.getElementById("tFloor").checked;
    NAV.showTime     = document.getElementById("tTime").checked;
    NAV.showOptional = document.getElementById("tOpt").checked;
    NAV.dimOptional  = document.getElementById("tDim").checked;
    NAV.showPath     = document.getElementById("tPath").checked;
    if(id === "tFloor" && NAV.mesh) NAV.mesh.visible = NAV.showFloor;
    else if(id === "tPath"){ if(NAV.tube) NAV.tube.visible = NAV.showPath; if(NAV.marks) NAV.marks.visible = NAV.showPath; }
    else if(NAV.built){ buildNavOverlay(); applyCut(); }
  };
});

document.getElementById("waylist").addEventListener("click", function(ev){
  const b = ev.target.closest("[data-wp]");
  if(!b) return;
  const i = parseInt(b.dataset.wp,10);
  const cell = i < 0 ? NAV.start : (NAV.waypoints[i] && NAV.waypoints[i].cell);
  if(cell === undefined || cell < 0) return;
  const c = navCenter(cell);
  const p = new THREE.Vector3(c[0],c[1],c[2]);
  frameBox(new THREE.Box3().setFromCenterAndSize(p, new THREE.Vector3(560,560,560)), 1.1);
  if(i >= 0 && NAV.waypoints[i].ent) selectEntity(NAV.waypoints[i].ent);
});

document.querySelectorAll("[data-skill]").forEach(function(b){
  b.onclick = function(){
    document.querySelectorAll("[data-skill]").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on"); S.skill = parseInt(b.dataset.skill,10); updateEntityVisibility();
  };
});

/* entity category checkboxes */
(function(){
  const host = document.getElementById("entcats");
  CATS.forEach(function(c){
    const row = document.createElement("div"); row.className = "row";
    const hex = "#" + c.color.toString(16).padStart(6,"0");
    row.innerHTML = "<label for='cat_"+c.id+"'><span class='dot' style='background:"+hex+"'></span>"+c.label+
      "<input type='checkbox' id='cat_"+c.id+"'"+(S.catOn[c.id]?" checked":"")+"><span class='sw'></span></label>";
    host.appendChild(row);
    row.querySelector("input").onchange = function(e){ S.catOn[c.id] = e.target.checked; updateEntityVisibility(); };
  });
})();

applyTheme("slipgate");

document.getElementById("toggle").onclick = function(){ document.getElementById("rail").classList.remove("hidden"); };
addEventListener("keydown", function(e){
  if(e.key === "Tab"){ /* leave focus alone */ }
  if(e.key.toLowerCase() === "h" && e.target.tagName !== "INPUT"){
    document.getElementById("rail").classList.toggle("hidden");
  }
});
