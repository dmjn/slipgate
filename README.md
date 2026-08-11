# Slipgate

**A reading instrument for Quake level geometry.**

→ **[Open Slipgate](https://dmjn.github.io/slipgate/)**

Slipgate opens Quake's levels and lets you read them the way you would read a
building: in plan, in section, in axonometric, with the ceilings lifted off and
the walls turned to glass. It is not a level editor and it is not a game. It is
an instrument for looking closely at thirty-year-old architecture that has been
enormously influential and very rarely measured.

Quake is worth this attention because it has almost no story. There is a
military installation, a teleport experiment that went wrong, and then
thirty-two levels and no further explanation. With nothing to follow, the level
carries everything. Take the fiction away and nothing is lost, because the
geometry was always the text.

## It reads your files, not ours

Slipgate ships no game data. Drop your own `pak0.pak` and it is parsed inside
the browser tab. Nothing is uploaded and nothing is sent anywhere. A pak you
choose to keep is cached locally in IndexedDB and can be cleared from the
opening screen.

## What it derives from the game's own data

- **Geometry** from the BSP, split into floors, walls and ceilings at the same
  normal-z threshold the engine uses to decide whether you are standing on
  something, each independently dimmable or removable.
- **Visibility** from the compiled PVS. Place a probe and see every surface the
  engine may draw from that leaf, or let it follow the cursor and sweep a room.
- **Navigation** from hull 1, the collision geometry Quake pre-expanded to the
  player's 32 × 32 × 56 box, walked under the real movement rules: 18 units of
  step, a 45 unit jump apex, free falls, swimmable water, and lifts and
  teleporters as explicit edges.
- **Progression** from the entity lump. Key doors, trigger chains and teleport
  destinations are resolved into the order a player must actually do things in,
  then drawn as a route with waypoints.
- **Lighting** from the lightmap lump, giving a real brightness value per
  surface, so darkness can be measured rather than described.
- **Text** from `progs.dat` in your own pak, which is where the game's own words
  live.

## What you can do with it

Cut a section anywhere on any axis. Colour surfaces by height, material, brush
entity or baked light. Filter monsters by difficulty and watch placement change
on identical geometry. Solve the critical path and read its length, detour
ratio, backtracking, optional volume and the light profile beneath it. Run every
map in a pak through the same solve and compare them in a sortable table with a
scatter plot. Export true-scale SVG plans and sections with real cut lines, or
PNG at up to four times the viewport.

Any view can be linked. **COPY LINK TO THIS VIEW** writes the whole reading into
the URL, so a footnote can point at a view rather than describe one.

## Documentation

- **[GUIDE.md](GUIDE.md)** — introduction and usage, written for a first
  encounter. The same guide is inside the tool under **OPEN CODEX → GUIDE**.
- **[DEPLOY.md](DEPLOY.md)** — building from source and hosting your own copy.

## Honest limits

The navigation grid samples on a lattice, so a ledge within one cell of the jump
limit can read as reachable when it is marginal. The bias is deliberate, since
an over-connection is a smaller error than a stranded exit, and when the solve
cannot resolve every lock it says so rather than failing quietly. Brush entities
such as `func_wall` are absent from the collision hull, so a handful of walls
read as passable. The graph panel shows trigger and target logic rather than
true room segmentation, which would need the `.prt` file the compiler discards.

## Licences

three.js r128 and html2canvas 1.4.1 are vendored under `vendor/`, both MIT, with
their licence files alongside. IBM Plex Mono is served from Google Fonts under
the SIL Open Font License.

Quake, its data formats and its level data are id Software's. Slipgate reads
those formats and contains none of that content.
