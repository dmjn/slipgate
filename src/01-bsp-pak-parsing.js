/* ============================ BSP + PAK PARSING ============================ */

function parsePAK(buf){
  const dv = new DataView(buf);
  const id = String.fromCharCode(dv.getUint8(0),dv.getUint8(1),dv.getUint8(2),dv.getUint8(3));
  if(id !== "PACK") throw new Error("Not a PAK archive.");
  const ofs = dv.getInt32(4,true), len = dv.getInt32(8,true);
  const out = [];
  for(let i=0;i<len/64;i++){
    const o = ofs + i*64;
    let name = "";
    for(let c=0;c<56;c++){ const ch = dv.getUint8(o+c); if(ch===0) break; name += String.fromCharCode(ch); }
    out.push({ name:name, ofs:dv.getInt32(o+56,true), size:dv.getInt32(o+60,true) });
  }
  return out;
}

function parseBSP(buf){
  const dv = new DataView(buf);
  const version = dv.getInt32(0,true);
  if(version !== 29){
    throw new Error("BSP version " + version + ". This reads Quake 1 (version 29) only — Quake 2, Quake 3, and GoldSrc use different formats.");
  }
  const L = [];
  for(let i=0;i<15;i++) L.push({ ofs:dv.getInt32(4+i*8,true), len:dv.getInt32(8+i*8,true) });

  // 0 entities
  let entStr = "";
  { const b = new Uint8Array(buf, L[0].ofs, L[0].len);
    let s = ""; for(let i=0;i<b.length;i++){ if(b[i]===0) break; s += String.fromCharCode(b[i]); }
    entStr = s; }

  // 1 planes: normal[3] f, dist f, type i  = 20
  const nPlanes = L[1].len/20|0;
  const planes = new Float32Array(nPlanes*4);
  for(let i=0;i<nPlanes;i++){
    const o = L[1].ofs + i*20;
    planes[i*4]   = dv.getFloat32(o,true);
    planes[i*4+1] = dv.getFloat32(o+4,true);
    planes[i*4+2] = dv.getFloat32(o+8,true);
    planes[i*4+3] = dv.getFloat32(o+12,true);
  }

  // 2 miptex
  const texNames = [];
  if(L[2].len > 4){
    const n = dv.getInt32(L[2].ofs,true);
    for(let i=0;i<n;i++){
      const rel = dv.getInt32(L[2].ofs+4+i*4,true);
      if(rel < 0){ texNames.push("(none)"); continue; }
      const o = L[2].ofs + rel;
      let s = "";
      for(let c=0;c<16;c++){ const ch = dv.getUint8(o+c); if(ch===0) break; s += String.fromCharCode(ch); }
      texNames.push(s.toLowerCase());
    }
  }

  // 3 vertices
  const nVerts = L[3].len/12|0;
  const verts = new Float32Array(nVerts*3);
  for(let i=0;i<nVerts*3;i++) verts[i] = dv.getFloat32(L[3].ofs + i*4, true);

  // 4 visibility
  const visdata = new Uint8Array(buf, L[4].ofs, L[4].len);

  // 5 nodes: plane i, children short[2], box short[6], face us, nface us = 24
  const nNodes = L[5].len/24|0;
  const nodePlane = new Int32Array(nNodes);
  const nodeChild = new Int16Array(nNodes*2);
  for(let i=0;i<nNodes;i++){
    const o = L[5].ofs + i*24;
    nodePlane[i]     = dv.getInt32(o,true);
    nodeChild[i*2]   = dv.getInt16(o+4,true);
    nodeChild[i*2+1] = dv.getInt16(o+6,true);
  }

  // 6 texinfo: s[4] f, t[4] f, miptex i, flags i = 40
  const nTexinfo = L[6].len/40|0;
  const texMip = new Int32Array(nTexinfo);
  const texVecs = new Float32Array(nTexinfo*8);
  for(let i=0;i<nTexinfo;i++){
    const o = L[6].ofs + i*40;
    for(let k=0;k<8;k++) texVecs[i*8+k] = dv.getFloat32(o + k*4, true);
    texMip[i] = dv.getInt32(o + 32, true);
  }

  // 7 faces = 20
  const nFaces = L[7].len/20|0;
  const fPlane = new Uint16Array(nFaces), fSide = new Uint16Array(nFaces);
  const fEdge = new Int32Array(nFaces), fNEdge = new Uint16Array(nFaces), fTexinfo = new Uint16Array(nFaces);
  const fLight = new Int32Array(nFaces), fStyle = new Uint8Array(nFaces*4);
  for(let i=0;i<nFaces;i++){
    const o = L[7].ofs + i*20;
    fPlane[i]   = dv.getUint16(o,true);
    fSide[i]    = dv.getUint16(o+2,true);
    fEdge[i]    = dv.getInt32(o+4,true);
    fNEdge[i]   = dv.getUint16(o+8,true);
    fTexinfo[i] = dv.getUint16(o+10,true);
    for(let k=0;k<4;k++) fStyle[i*4+k] = dv.getUint8(o+12+k);
    fLight[i]   = dv.getInt32(o+16,true);
  }

  // 8 lightmaps: one byte per luxel, greyscale, style 0 first
  const lightdata = new Uint8Array(buf, L[8].ofs, L[8].len);

  // 9 clipnodes: plane i, children short[2] = 8
  const nClip = L[9].len/8|0;
  const clipPlane = new Int32Array(nClip);
  const clipChild = new Int16Array(nClip*2);
  for(let i=0;i<nClip;i++){
    const o = L[9].ofs + i*8;
    clipPlane[i]     = dv.getInt32(o,true);
    clipChild[i*2]   = dv.getInt16(o+4,true);
    clipChild[i*2+1] = dv.getInt16(o+6,true);
  }

  // 10 leaves = 28
  const nLeafs = L[10].len/28|0;
  const lContents = new Int32Array(nLeafs), lVis = new Int32Array(nLeafs);
  const lMins = new Int16Array(nLeafs*3), lMaxs = new Int16Array(nLeafs*3);
  const lFirst = new Uint16Array(nLeafs), lCount = new Uint16Array(nLeafs);
  for(let i=0;i<nLeafs;i++){
    const o = L[10].ofs + i*28;
    lContents[i] = dv.getInt32(o,true);
    lVis[i]      = dv.getInt32(o+4,true);
    for(let k=0;k<3;k++){
      lMins[i*3+k] = dv.getInt16(o+8+k*2,true);
      lMaxs[i*3+k] = dv.getInt16(o+14+k*2,true);
    }
    lFirst[i] = dv.getUint16(o+20,true);
    lCount[i] = dv.getUint16(o+22,true);
  }

  // 11 marksurfaces
  const nMark = L[11].len/2|0;
  const marks = new Uint16Array(nMark);
  for(let i=0;i<nMark;i++) marks[i] = dv.getUint16(L[11].ofs + i*2, true);

  // 12 edges
  const nEdges = L[12].len/4|0;
  const edges = new Uint16Array(nEdges*2);
  for(let i=0;i<nEdges;i++){
    edges[i*2]   = dv.getUint16(L[12].ofs + i*4, true);
    edges[i*2+1] = dv.getUint16(L[12].ofs + i*4 + 2, true);
  }

  // 13 surfedges
  const nSurf = L[13].len/4|0;
  const surfedges = new Int32Array(nSurf);
  for(let i=0;i<nSurf;i++) surfedges[i] = dv.getInt32(L[13].ofs + i*4, true);

  // 14 models = 64
  const nModels = L[14].len/64|0;
  const models = [];
  for(let i=0;i<nModels;i++){
    const o = L[14].ofs + i*64;
    models.push({
      min:[dv.getFloat32(o,true),dv.getFloat32(o+4,true),dv.getFloat32(o+8,true)],
      max:[dv.getFloat32(o+12,true),dv.getFloat32(o+16,true),dv.getFloat32(o+20,true)],
      head: [dv.getInt32(o+36,true), dv.getInt32(o+40,true),
             dv.getInt32(o+44,true), dv.getInt32(o+48,true)],
      firstFace: dv.getInt32(o+56,true),
      numFaces:  dv.getInt32(o+60,true)
    });
  }

  return { version, entStr, planes, texNames, verts, visdata,
    nodePlane, nodeChild, texMip, clipPlane, clipChild, nClip,
    fPlane, fSide, fEdge, fNEdge, fTexinfo, nFaces, fLight, fStyle, texVecs, lightdata,
    lContents, lVis, lMins, lMaxs, lFirst, lCount, nLeafs,
    marks, edges, surfedges, models };
}

/* --- baked lighting ---
   Each face indexes a grid of luxels one per 16 texture units, sized from the
   face's own texture extents. Reading it gives a real brightness value per
   surface, which is the only way to measure darkness rather than describe it. */
function computeFaceLight(bsp){
  const nF = bsp.nFaces;
  const light = new Float32Array(nF).fill(-1);
  const area = new Float32Array(nF);
  const V = bsp.verts, E = bsp.edges, SE = bsp.surfedges, TV = bsp.texVecs;
  const LD = bsp.lightdata;
  const pts = [];

  for(let f=0; f<nF; f++){
    const n = bsp.fNEdge[f];
    if(n < 3) continue;
    pts.length = 0;
    for(let k=0;k<n;k++){
      const se = SE[bsp.fEdge[f]+k];
      const vi = se >= 0 ? E[se*2] : E[(-se)*2+1];
      pts.push(V[vi*3], V[vi*3+1], V[vi*3+2]);
    }
    // polygon area, for weighting the averages later
    let ax=0, ay=0, az=0;
    for(let k=1;k<n-1;k++){
      const x1=pts[k*3]-pts[0], y1=pts[k*3+1]-pts[1], z1=pts[k*3+2]-pts[2];
      const x2=pts[(k+1)*3]-pts[0], y2=pts[(k+1)*3+1]-pts[1], z2=pts[(k+1)*3+2]-pts[2];
      ax += y1*z2 - z1*y2; ay += z1*x2 - x1*z2; az += x1*y2 - y1*x2;
    }
    area[f] = 0.5*Math.hypot(ax,ay,az);

    const ofs = bsp.fLight[f];
    if(ofs < 0 || !LD.length || bsp.fStyle[f*4] === 255) continue;

    const ti = bsp.fTexinfo[f]*8;
    let minS=1e30, maxS=-1e30, minT=1e30, maxT=-1e30;
    for(let k=0;k<n;k++){
      const x=pts[k*3], y=pts[k*3+1], z=pts[k*3+2];
      const su = x*TV[ti]   + y*TV[ti+1] + z*TV[ti+2] + TV[ti+3];
      const tu = x*TV[ti+4] + y*TV[ti+5] + z*TV[ti+6] + TV[ti+7];
      if(su<minS) minS=su; if(su>maxS) maxS=su;
      if(tu<minT) minT=tu; if(tu>maxT) maxT=tu;
    }
    const w = Math.floor(maxS/16) - Math.floor(minS/16) + 1;
    const hh = Math.floor(maxT/16) - Math.floor(minT/16) + 1;
    if(w < 1 || hh < 1 || w > 18 || hh > 18) continue;
    const count = w*hh;
    if(ofs + count > LD.length) continue;
    let sum = 0;
    for(let i=0;i<count;i++) sum += LD[ofs+i];
    light[f] = sum/count;
  }
  return { light:light, area:area };
}

/* --- entity lump --- */
function parseEnts(str){
  const out = []; let i = 0;
  while(i < str.length){
    if(str[i] === "{"){
      const e = {}; i++;
      while(i < str.length && str[i] !== "}"){
        if(str[i] === '"'){
          i++; let k = ""; while(i<str.length && str[i]!=='"') k += str[i++]; i++;
          while(i<str.length && str[i]!=='"') i++; i++;
          let v = ""; while(i<str.length && str[i]!=='"') v += str[i++]; i++;
          e[k] = v;
        } else i++;
      }
      out.push(e);
    }
    i++;
  }
  return out;
}

/* --- PVS decompression --- */
function decompressVis(bsp, leaf){
  const out = new Uint8Array(bsp.nLeafs);
  const ofs = bsp.lVis[leaf];
  if(ofs < 0 || bsp.visdata.length === 0){ out.fill(1); return out; }
  const v = bsp.visdata;
  let p = ofs, i = 1;
  while(i < bsp.nLeafs && p < v.length){
    if(v[p] === 0){ p++; i += 8 * v[p]; p++; }
    else {
      for(let bit=1; bit < 256; bit <<= 1){
        if(i >= bsp.nLeafs) break;
        if(v[p] & bit) out[i] = 1;
        i++;
      }
      p++;
    }
  }
  return out;
}

function findLeaf(bsp, x, y, z){
  let n = 0;
  let guard = 0;
  while(n >= 0 && guard++ < 4096){
    const pi = bsp.nodePlane[n] * 4;
    const d = bsp.planes[pi]*x + bsp.planes[pi+1]*y + bsp.planes[pi+2]*z - bsp.planes[pi+3];
    n = bsp.nodeChild[n*2 + (d >= 0 ? 0 : 1)];
  }
  return -1 - n;
}
