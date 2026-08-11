/* ============================ RENDER LOOP ============================ */
let last = performance.now();
function loop(){
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  fly(dt);
  camTick(dt);
  refreshEntityMatrices();
  updateReadout();
  if(S.bsp) renderer.render(scene, cam);
}
loop();
addEventListener("resize", resize);
resize();
