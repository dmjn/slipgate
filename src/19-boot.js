/* ============================ BOOT ============================ */

/* pak drops are cached, and the picker knows where it came from */
const _handleFileBase = handleFile;
handleFile = function(file){
  const isPak = /\.pak$/i.test(file.name);
  const fr = new FileReader();
  if(!isPak){ _handleFileBase(file); return; }
  busy(true);
  fr.onload = function(){
    try {
      adoptPak(fr.result, file.name);
      savePakToCache(fr.result, file.name);
      showPicker();
      document.getElementById("dropErr").style.display = "none";
    } catch(err){
      const e = document.getElementById("dropErr");
      e.textContent = err.message; e.style.display = "block";
      document.getElementById("drop").classList.remove("gone");
    }
    busy(false);
  };
  fr.onerror = function(){ busy(false); };
  fr.readAsArrayBuffer(file);
};

/* every load re-reads the hash, so a pasted link lands where it should */
const _loadFromPakBase = loadFromPak;
loadFromPak = function(i){
  _loadFromPakBase(i);
  setTimeout(function(){ if(!permaApplying) pushState(); }, 400);
};

document.addEventListener("click", function(ev){
  if(ev.target && ev.target.id === "forgetPak"){ forgetPak(); return; }
  if(ev.target && ev.target.id === "copyLink"){ copyLink(); return; }
});

/* the camera settles asynchronously, so the hash is written on a timer */
setInterval(function(){ if(S.bsp && !permaApplying) schedulePush(); }, 1200);

addEventListener("hashchange", function(){
  const q = parseHash();
  if(!q || !S.pakMaps) return;
  const str = location.hash.replace(/^#/,"");
  if(str === permaLast) return;
  if(q.m){
    const idx = S.pakMaps.findIndex(function(m){ return m.short === q.m; });
    if(idx >= 0 && idx !== S.pakIndex){
      permaApplying = true;
      loadFromPak(idx);
      setTimeout(function(){ permaApplying = false; applyState(q); }, 700);
      return;
    }
  }
  applyState(q);
});

(function boot(){
  const q = parseHash();
  restorePak().then(function(found){
    if(!found) return;
    const drop = document.getElementById("drop");
    if(q && q.m){
      const idx = S.pakMaps.findIndex(function(m){ return m.short === q.m; });
      if(idx >= 0){
        drop.classList.add("gone");
        loadFromPak(idx);
        setTimeout(function(){ applyState(q); }, 800);
        return;
      }
    }
    showPicker();
  });
})();
