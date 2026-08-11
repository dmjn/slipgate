# Slipgate

A reading instrument for Quake level geometry. Orthographic plans and sections,
compiled visibility, clip-hull pathfinding, baked lighting, and vector export,
all in the browser.

Slipgate reads **your own** Quake files. It ships no game data and uploads
nothing: paks are parsed in the tab and cached in your browser's IndexedDB.

---

## Layout

```
index.html                 built artefact, do not edit by hand
slipgate-standalone.html   optional single-file build (node build.mjs --standalone)
GUIDE.md                   the introduction and usage guide
build.mjs                  concatenates src/ into index.html
manifest.webmanifest       PWA manifest
sw.js                      service worker, precaches the app shell
_headers                   caching and security headers (Cloudflare Pages / Netlify)
.github/workflows/pages.yml  builds and deploys on push (GitHub Pages)
.gitignore                 blocks game data from ever being committed
.nojekyll                  stops GitHub Pages mangling paths
og.png                     social card
icons/                     192 and 512 app icons
vendor/
  three.min.js             three.js r128, MIT
  html2canvas.min.js       used only by the interface PNG export, MIT
src/
  index.template.html      page shell with __STYLES__ and __APP__ placeholders
  styles.css               the whole stylesheet
  _order.json              module concatenation order
  01-bsp-pak-parsing.js    BSP29 and PAK readers, PVS, lightmaps
  02-entity-taxonomy.js    entity classes, skill spawnflags
  03-scene.js              renderer, cameras, state
  04-palettes.js           themes, geometry construction, surface classes
  05-clipping.js           section cut planes
  06-camera.js             damped orbit, framing, projections
  07-picking.js            entity selection, inspector, probe
  08-logic-graph.js        trigger/target graph
  09-clip-hull-*.js        hull 1 voxelisation, flood, progression solver
  10-codex.js              fiction, map lore, bestiary, progs.dat strings
  11-atlas-*.js            batch comparison across a pak
  12-export.js             SVG and PNG export
  13-readout.js            on-screen readout
  14-render-loop.js        frame loop
  15-loading.js            map loading, picker
  16-ui-wiring.js          all control handlers
  17-pak-cache.js          IndexedDB pak cache
  18-permalink.js          URL hash state
  19-boot.js               startup, hash routing
```

Everything in `src/*.js` is concatenated in `_order.json` order inside a single
IIFE, so the modules share one scope. Order matters only for the top-level
statements at the end; functions hoist.

## Do not ship game data

No pak files, no extracted BSPs, not the shareware pak either. It is
redistributable, but hosting it drags licensing questions onto your domain for
no benefit, and the tool works fine asking each visitor for their own copy. Say
so on the page so the file prompt reads as a design decision rather than an
obstacle.

## Licences

- three.js r128, MIT, `vendor/three-LICENSE.txt`
- html2canvas 1.4.1, MIT, `vendor/html2canvas-LICENSE.txt`
- IBM Plex Mono via Google Fonts, SIL Open Font License

Quake, its data formats and its level data are id Software's. Slipgate reads
those formats; it contains none of that content.
