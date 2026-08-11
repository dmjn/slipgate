/* ============================ READOUT ============================ */
const readout = document.getElementById("readout");
function updateReadout(){
  if(!S.bsp){ readout.textContent = ""; return; }
  const p = cam.position;
  const unitsPerPx = pxScale();
  let barUnits = 64;
  while(barUnits/unitsPerPx < 40) barUnits *= 2;
  while(barUnits/unitsPerPx > 220) barUnits /= 2;
  const barPx = Math.round(barUnits/unitsPerPx);
  readout.innerHTML =
    "<div><span class='k'>camera</span><b>" + Math.round(p.x) + "  " + Math.round(p.y) + "  " + Math.round(p.z) + "</b></div>" +
    "<div><span class='k'>extent</span><b>" + Math.round(S.size.x) + " × " + Math.round(S.size.y) + " × " + Math.round(S.size.z) + "</b> units</div>" +
    "<div><span class='k'>faces</span><b>" + S.faceCount + "</b> · leaves <b>" + S.bsp.nLeafs + "</b> · brush ents <b>" + (S.bsp.models.length-1) + "</b></div>" +
    (S.probeLeaf >= 0 ? "<div><span class='k'>probe</span>leaf <b>" + S.probeLeaf + "</b> sees <b>" + S.visPct + "%</b> of surfaces</div>" : "") +
    "<div id='scalebar'><div class='bar' style='width:" + barPx + "px'></div><span>" + barUnits + " u</span></div>";
}
