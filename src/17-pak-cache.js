/* ============================ PAK CACHE ============================ */
/* A pak runs 18 to 35 MB, far past localStorage but nothing for IndexedDB.
   Caching it means a returning visitor lands in a map rather than hunting for
   the file again. The bytes never leave the browser. */

const DB_NAME = "slipgate", DB_STORE = "paks", DB_KEY = "current";

function idbOpen(){
  return new Promise(function(res, rej){
    if(!window.indexedDB){ rej(new Error("no indexeddb")); return; }
    const rq = indexedDB.open(DB_NAME, 1);
    rq.onupgradeneeded = function(){
      const db = rq.result;
      if(!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
    };
    rq.onsuccess = function(){ res(rq.result); };
    rq.onerror = function(){ rej(rq.error || new Error("indexeddb blocked")); };
  });
}

function idbGet(){
  return idbOpen().then(function(db){
    return new Promise(function(res, rej){
      const tx = db.transaction(DB_STORE, "readonly");
      const rq = tx.objectStore(DB_STORE).get(DB_KEY);
      rq.onsuccess = function(){ res(rq.result || null); };
      rq.onerror = function(){ rej(rq.error); };
    });
  });
}

function idbPut(rec){
  return idbOpen().then(function(db){
    return new Promise(function(res, rej){
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).put(rec, DB_KEY);
      tx.oncomplete = function(){ res(true); };
      tx.onerror = function(){ rej(tx.error); };
    });
  });
}

function idbClear(){
  return idbOpen().then(function(db){
    return new Promise(function(res){
      const tx = db.transaction(DB_STORE, "readwrite");
      tx.objectStore(DB_STORE).delete(DB_KEY);
      tx.oncomplete = function(){ res(true); };
      tx.onerror = function(){ res(false); };
    });
  });
}

function cacheStatus(txt){
  const el = document.getElementById("cacheNote");
  if(el) el.innerHTML = txt;
}

/* adopt a pak buffer that is already in memory */
function adoptPak(buf, label){
  const files = parsePAK(buf);
  const maps = files.filter(function(f){ return f.name.toLowerCase().endsWith(".bsp"); })
    .map(function(f){
      return { short:f.name.replace(/^maps\//i,"").replace(/\.bsp$/i,"").toLowerCase(),
               ofs:f.ofs, size:f.size };
    });
  if(!maps.length) throw new Error("No .bsp files inside this PAK.");
  maps.sort(function(a,b){ return mapRank(a.short).localeCompare(mapRank(b.short)); });
  pakBuf = buf; S.pakMaps = maps; S.pakName = label; S.pakIndex = -1;
  S.pakAll = files; CODEX.progs = null; CODEX.progsTried = false;
  return maps;
}

function savePakToCache(buf, name){
  idbPut({ name:name, size:buf.byteLength, savedAt:Date.now(), buffer:buf })
    .then(function(){ cacheStatus("Cached <b>" + esc(name) + "</b> in this browser."); })
    .catch(function(){ cacheStatus("Could not cache this pak; it will need dropping again next visit."); });
}

/* Restore on startup. Resolves with true when a pak came back. */
function restorePak(){
  return idbGet().then(function(rec){
    if(!rec || !rec.buffer) return false;
    try {
      adoptPak(rec.buffer, rec.name || "cached pak");
      cacheStatus("Cached <b>" + esc(rec.name || "pak") + "</b>, " +
        Math.round(rec.size/1048576) + " MB. <button class='elink' id='forgetPak'>forget it</button>");
      return true;
    } catch(err){ return false; }
  }).catch(function(){ return false; });
}

function forgetPak(){
  idbClear().then(function(){
    cacheStatus("Cache cleared. Drop a pak to start again.");
  });
}
