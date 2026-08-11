/* ============================ CLIPPING ============================ */
const clipPlane = new THREE.Plane(new THREE.Vector3(0,0,-1), 0);
function applyCut(){
  const el = document.getElementById("cutval");
  if(S.cutAxis === "none"){
    setClip([]); el.textContent = "off"; return;
  }
  const axis = S.cutAxis;
  const min = S.bounds.min[axis], max = S.bounds.max[axis];
  const v = min + (max-min)*S.cutT;
  const n = new THREE.Vector3(0,0,0);
  n[axis] = S.cutFlip ? 1 : -1;
  clipPlane.normal.copy(n);
  clipPlane.constant = S.cutFlip ? -v : v;
  setClip([clipPlane]);
  el.textContent = axis.toUpperCase() + " " + Math.round(v);
}
function setClip(arr){
  [S.mesh, S.lines, S.leafBoxes, S.entGroup, S.linkGroup, NAV.mesh, NAV.tube].forEach(function(o){
    if(!o) return;
    o.traverse(function(c){
      if(!c.material) return;
      const list = Array.isArray(c.material) ? c.material : [c.material];
      list.forEach(function(m){ m.clippingPlanes = arr; m.needsUpdate = true; });
    });
  });
}
