/* ============================ SCENE ============================ */

const canvas = document.getElementById("view");
const renderer = new THREE.WebGLRenderer({ canvas:canvas, antialias:true, preserveDrawingBuffer:true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.localClippingEnabled = true;
renderer.setClearColor(0x0b0b0a, 1);

const scene = new THREE.Scene();
scene.fog = null;

const camP = new THREE.PerspectiveCamera(72, 1, 1, 60000); camP.up.set(0,0,1);
const camO = new THREE.OrthographicCamera(-1,1,1,-1, -60000, 60000); camO.up.set(0,0,1);
let cam = camO, camMode = "iso";

const ISO_AZ = Math.PI*0.25, ISO_EL = 0.6155;   // 45 degrees round, 35.26 up
const orbit = { target:new THREE.Vector3(), dist:900, az:ISO_AZ, el:ISO_EL, zoom:1 };
const goal  = { target:new THREE.Vector3(), dist:900, az:ISO_AZ, el:ISO_EL, zoom:1 };

/* state */
const S = {
  bsp:null, ents:[], name:"", mapName:"",
  mesh:null, lines:null, leafBoxes:null, grid:null, ref:null,
  entGroup:null, linkGroup:null, probeMark:null, measGroup:null,
  faceCount:0, faceVertStart:null, faceVertCount:null, faceModel:null, faceTex:null, faceZ:null,
  triFace:null, colorAttr:null, basePos:null,
  bounds:new THREE.Box3(), center:new THREE.Vector3(), size:new THREE.Vector3(),
  shade:"flat", cutAxis:"none", cutT:0.5, cutFlip:false,
  faceCls:null, faceC:null, lineParts:null, reachedOnly:false, lightEdges:false,
  faceLight:null, faceArea:null,
  surf:{ floor:true, wall:true, ceil:false, wallOp:0.35, ceilOp:0.12 },
  probeLeaf:-1, probePt:null, visFaces:null, visPct:0,
  skill:1, catOn:{}, showSky:false, visOnly:false,
  measMode:false, measPts:[], probeMode:false, probeFollow:false, lastFollow:0,
  graph:null,
  selected:null, selBox:null, pivot:null,
  byTargetname:{}, byTarget:{},
  pakMaps:null, pakName:"", pakIndex:-1, pakAll:null
};
CATS.forEach(function(c){ S.catOn[c.id] = (c.id !== "light" && c.id !== "trigger" && c.id !== "ammo"); });
