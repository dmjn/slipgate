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

## Build

```bash
node build.mjs --site-url https://slipgate.example.com
```

The URL is baked into the canonical link and the Open Graph tags. Rebuild after
any change under `src/`.

## Deploy

### Cloudflare Pages

1. Push this directory to a repo.
2. Pages → Create project → connect the repo.
3. Build command `node build.mjs --site-url https://your.domain`, output directory `/`.
4. Custom domain → add your subdomain.

`_headers` is picked up automatically and gives the vendored libraries a
one-year immutable cache while keeping `index.html` and `sw.js` revalidating.

### GitHub Pages

A workflow at `.github/workflows/pages.yml` builds and deploys on every push to
`main`.

1. Create a repo and push this directory to `main`.
2. Settings → Pages → **Source: GitHub Actions**.
3. Optional: Settings → Secrets and variables → Actions → Variables → add
   `SITE_URL` with your final URL. Without it the workflow uses the default
   `https://<owner>.github.io/<repo>` and the canonical and Open Graph tags
   follow suit.
4. Optional custom domain: Settings → Pages → Custom domain. GitHub writes a
   `CNAME` file to the repo; at your DNS provider add a `CNAME` record pointing
   the subdomain at `<owner>.github.io`. Leave **Enforce HTTPS** on, since the
   service worker and the clipboard both require it.

The workflow stamps the service worker cache name with the commit hash on every
deploy, so returning visitors always pick up the new build without you having to
remember to bump it.

GitHub Pages ignores `_headers`; caching falls back to its defaults, which is
fine at this size.

Deploying by hand instead? Run the build locally, commit `index.html`,
`vendor/`, `icons/`, `manifest.webmanifest`, `sw.js` and `.nojekyll`, then set
Pages to deploy from the branch root. Bump `VERSION` in `sw.js` yourself each
time.

### Anywhere else

It is a static directory. Any host that serves files over HTTPS will do. HTTPS
is required for the service worker and for clipboard access.

## What is cached where

| Thing | Where | Cleared by |
|---|---|---|
| App shell, vendored libraries | Cache Storage, via `sw.js` | bumping `VERSION` in `sw.js` |
| The user's pak file | IndexedDB, database `slipgate` | the *forget it* control on the opening screen |
| Current view state | the URL hash | editing the URL |

Bump `VERSION` in `sw.js` on every deploy or returning visitors will keep the
old build.

## Permalinks

The hash carries the whole reading, so a link can point at a view rather than
describe it:

```
#m=e1m3&t=vellum&c=plan&s=height&k=z,0.420&f=1,1,0,35,12,1&e=4095,1,1.0&v=...
```

| Key | Meaning |
|---|---|
| `m` | map name inside the pak |
| `t` | palette |
| `c` | camera: `persp`, `iso`, `plan`, `elev` |
| `s` | surface shading mode |
| `k` | cut axis, `!` for flipped, and position 0–1 |
| `f` | floor, wall, ceiling on/off, wall %, ceiling %, light edges |
| `e` | entity category bitmask, skill, marker scale |
| `v` | camera azimuth, elevation, distance, zoom, target xyz |
| `u` | interface scale |
| `p` | visibility probe position |

A visitor without the pak cached sees the file prompt first, then lands on the
linked view once they supply it. **COPY LINK TO THIS VIEW** in the rail writes
the hash and copies it.

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
