/* ============================ LOADING ============================ */
function busy(on){ document.getElementById("busy").classList.toggle("show", on); }

function disposeScene(){
  scene.traverse(function(o){
    if(o.geometry) o.geometry.dispose();
    if(o.material){
      if(Array.isArray(o.material)) o.material.forEach(function(m){ m.dispose(); });
      else o.material.dispose();
    }
  });
  while(scene.children.length) scene.remove(scene.children[0]);
}

function loadBSP(buf, label){
  const bsp = parseBSP(buf);
  deselect();
  S.selBox = null;
  resetNav();
  disposeScene();
  S.bsp = bsp;
  S.ents = parseEnts(bsp.entStr);
  S.ents.forEach(function(e,i){ e.__idx = i; });
  S.byTargetname = {}; S.byTarget = {};
  S.ents.forEach(function(e){
    if(e.targetname) (S.byTargetname[e.targetname] = S.byTargetname[e.targetname] || []).push(e);
    if(e.target)     (S.byTarget[e.target]         = S.byTarget[e.target]         || []).push(e);
  });
  S.probeLeaf = -1; S.visFaces = null; S.probePt = null; S.visPct = 0;
  document.getElementById("visval").textContent = "\u2014";
  S.measPts = []; S.measGroup = null; S.measMode = false;
  document.getElementById("measBtn").classList.remove("on");
  document.getElementById("visval").textContent = "—";
  document.getElementById("measout").textContent = "Measure: click two surfaces. Units are Quake units; the player box is 32×32×56.";

  build(bsp);
  scene.add(S.mesh); scene.add(S.lines);
  S.leafBoxes = buildLeafBoxes(bsp); S.leafBoxes.visible = false; scene.add(S.leafBoxes);
  S.grid = buildGrid(); scene.add(S.grid);
  S.entGroup = buildEntities(); scene.add(S.entGroup);
  S.linkGroup = buildLinks(); scene.add(S.linkGroup);
  S.ref = buildRef(); scene.add(S.ref);
  S.probeMark = new THREE.Mesh(new THREE.SphereGeometry(6,10,8), new THREE.MeshBasicMaterial({color:TH.probe}));
  S.probeMark.visible = false; scene.add(S.probeMark);
  S.pivot = new THREE.Mesh(new THREE.SphereGeometry(1,10,8),
    new THREE.MeshBasicMaterial({ color:TH.ref, transparent:true, opacity:0.55, depthTest:false }));
  S.pivot.renderOrder = 998; S.pivot.visible = false; scene.add(S.pivot);

  const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};
  S.mapName = wm.message || label;
  document.getElementById("brandsub").textContent = (label + (wm.message ? " · " + wm.message : "")).slice(0,44);

  const msec = document.getElementById("mapsec");
  if(S.pakMaps && S.pakMaps.length){
    msec.style.display = "";
    document.getElementById("mapidx").textContent = (S.pakIndex+1) + " / " + S.pakMaps.length;
    document.getElementById("mPrev").disabled = S.pakIndex <= 0;
    document.getElementById("mNext").disabled = S.pakIndex >= S.pakMaps.length-1;
  } else msec.style.display = "none";
  document.getElementById("mapname").textContent = label + (wm.message ? " — " + wm.message : "");

  recolor();
  applySurfaces();
  if(codexOpen()) renderCodex();
  updateEntityVisibility();
  applyCut();
  setCam(camMode);
  frameAll();
  snapCam();

  // the scale reference sits at the spawn, but the visibility layer stays off
  const st = S.ents.find(function(e){ return e.classname === "info_player_start"; });
  if(st && st.__pos && S.ref) S.ref.position.set(st.__pos[0], st.__pos[1], st.__pos[2]);
  S.probePt = st && st.__pos ? new THREE.Vector3(st.__pos[0], st.__pos[1], st.__pos[2]) : null;

  document.getElementById("drop").classList.add("gone");
  document.getElementById("picker").classList.remove("show");
  applyToggles();
}

function applyToggles(){
  if(S.lines) S.lines.visible = document.getElementById("tEdges").checked;
  if(S.mesh) S.mesh.visible = document.getElementById("tSolid").checked;
  if(S.leafBoxes) S.leafBoxes.visible = document.getElementById("tLeaf").checked;
  if(S.grid) S.grid.visible = document.getElementById("tGrid").checked;
  if(S.linkGroup) S.linkGroup.visible = document.getElementById("tLinks").checked;
  if(S.ref) S.ref.visible = document.getElementById("tRef").checked && !!S.probePt;
  S.showSky = document.getElementById("tSky").checked;
  S.visOnly = document.getElementById("tVisOnly").checked;
}

let pakBuf = null;
function mapRank(n){
  if(n === "start") return "0";
  const m = n.match(/^e(\d)m(\d+)$/);
  if(m) return "1" + m[1] + ("0"+m[2]).slice(-2);
  if(n === "end") return "2";
  if(/^dm\d/.test(n)) return "3" + n;
  return "4" + n;
}
function handleFile(file){
  busy(true);
  const fr = new FileReader();
  fr.onload = function(){
    try{
      const buf = fr.result;
      const name = file.name.toLowerCase();
      if(name.endsWith(".pak")){
        const files = parsePAK(buf);
        const maps = files.filter(function(f){ return f.name.toLowerCase().endsWith(".bsp"); })
          .map(function(f){
            return { short:f.name.replace(/^maps\//i,"").replace(/\.bsp$/i,"").toLowerCase(),
                     ofs:f.ofs, size:f.size };
          });
        if(!maps.length) throw new Error("No .bsp files inside this PAK.");
        maps.sort(function(a,b){ return mapRank(a.short).localeCompare(mapRank(b.short)); });
        pakBuf = buf; S.pakMaps = maps; S.pakName = file.name; S.pakIndex = -1;
        S.pakAll = files; CODEX.progs = null; CODEX.progsTried = false;
        showPicker();
      } else {
        S.pakMaps = null; S.pakIndex = -1; pakBuf = null; S.pakAll = null;
        CODEX.progs = null; CODEX.progsTried = false;
        loadBSP(buf, file.name.replace(/\.bsp$/i,""));
      }
      document.getElementById("dropErr").style.display = "none";
    } catch(err){
      const e = document.getElementById("dropErr");
      e.textContent = err.message; e.style.display = "block";
      document.getElementById("drop").classList.remove("gone");
      document.getElementById("picker").classList.remove("show");
    }
    busy(false);
  };
  fr.onerror = function(){ busy(false); };
  fr.readAsArrayBuffer(file);
}

function showPicker(){
  if(!S.pakMaps) return;
  const list = document.getElementById("pklist");
  list.innerHTML = "";
  document.getElementById("pkTitle").textContent = S.bsp ? "Switch map" : "Choose a map";
  document.getElementById("pkSub").textContent = S.pakMaps.length + " maps in " + S.pakName;
  document.getElementById("pkClose").style.display = S.bsp ? "block" : "none";
  S.pakMaps.forEach(function(m,i){
    const b = document.createElement("button");
    b.innerHTML = esc(m.short) + "<small>" + Math.round(m.size/1024) + " KB</small>";
    if(i === S.pakIndex) b.className = "cur";
    b.onclick = function(){ loadFromPak(i); };
    list.appendChild(b);
  });
  document.getElementById("picker").classList.add("show");
  document.getElementById("drop").classList.add("gone");
}

function loadFromPak(i){
  if(!S.pakMaps || !pakBuf) return;
  const m = S.pakMaps[i];
  if(!m) return;
  document.getElementById("picker").classList.remove("show");
  busy(true);
  setTimeout(function(){
    try{ S.pakIndex = i; loadBSP(pakBuf.slice(m.ofs, m.ofs+m.size), m.short); }
    catch(err){
      const el = document.getElementById("dropErr");
      el.textContent = err.message; el.style.display = "block";
      document.getElementById("drop").classList.remove("gone");
    }
    busy(false);
  }, 20);
}
