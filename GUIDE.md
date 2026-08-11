# Slipgate

**A reading instrument for Quake level geometry.**

---

## What this is

Slipgate opens Quake's levels and lets you read them the way you would read a
building: in plan, in section, in axonometric, with the ceilings lifted off and
the walls turned to glass. It is not a level editor and it is not a game. It is
an instrument for looking closely at thirty-year-old architecture that has been
enormously influential and very rarely measured.

Quake is worth this attention because it has almost no story. There is a
military installation, a teleport experiment that went wrong, and then thirty-two
levels and no further explanation. With nothing to follow, the level carries
everything. A room is not dressed to support a story beat, because there are no
story beats. It is shaped to be moved through, and whatever it communicates it
communicates through proportion, threshold, sightline, and the placement of
something that intends to kill you. Take the fiction away and nothing is lost.
The geometry was always the text.

Everything here is derived from the game's own data. The compiled visibility
set, the collision hull, the baked lighting, the entity placements and the
trigger logic are all read out of the files, not estimated. Where a number is a
fact of the game code it is presented as one. Where it is a reading, it says so.

## What it does not do

It ships no game data. Slipgate reads **your own** copy of Quake, parses it
inside your browser tab, and uploads nothing. If you cache a pak it is stored
locally in your browser and can be cleared from the opening screen.

---

## Getting started

**1. Find your pak files.** Quake keeps its data in two archives inside its
`id1` folder.

- Steam on Windows: `steamapps\common\Quake\id1\`
- Steam on macOS: `~/Library/Application Support/Steam/steamapps/common/Quake/id1/`
- GOG: the `id1` folder inside the install directory

`pak0.pak` holds the start map, episode one, and the deathmatch maps. `pak1.pak`
holds episodes two through four and the boss level. If you own the 2021
re-release, use the original `id1` folder rather than the `rerelease` one, since
the newer expansion maps were compiled to a different BSP version.

No copy of Quake? The shareware `pak0.pak` is free to distribute and covers the
whole first episode.

**2. Drop it on the window.** Slipgate reads the archive directly, so there is
nothing to extract. You will get an index of every map inside; pick one.

**3. Look at it.** The default view is an orthographic axonometric with the
ceilings removed and the walls at thirty-five percent, which is the reading that
shows the most at once.

---

## Moving around

| | |
|---|---|
| Drag | orbit |
| Right-drag or shift-drag | pan |
| Wheel | zoom toward the cursor |
| Double-click a surface | orbit around that point |
| Double-click an entity | frame it |
| **F** | frame the whole map |
| **G** | frame the current selection |
| **W A S D**, **Q E** | fly, in perspective only |
| **[** and **]** | previous and next map |
| **H** | hide the rail |
| **Esc** | drop the selection or disarm a mode |

Rotating never forces you out of an orthographic projection, so you can swing a
plan or an axonometric freely and it stays parallel.

---

## The panels

**Camera.** PSP, ISO, PLAN, ELEV. The orthographic three are the ones that
measure, since distances hold their ratio anywhere in the frame.

**Cut.** A section plane on any axis with a slider and a flip. Z plus PLAN gives
a true architectural plan taken at whatever height you choose.

**Surface.** How faces are coloured. FLAT for form alone, HEIGHT for verticality,
MATERIAL for the texture families including water, slime and lava, BRUSH ENT to
separate doors, lifts and platforms from the world hull, and BAKED LIGHT for the
lighting Quake actually compiled into the level.

**Surfaces.** Floors, walls and ceilings are separate geometry, split at the same
threshold the engine uses to decide whether you are standing on something. Each
can be dimmed or switched off. Light face edges inverts the wireframe, which
suits a drawing.

**Visibility.** Arm PROBE and click any surface. Slipgate finds the leaf you
clicked, decompresses the compiled potentially visible set, and lights every
surface the engine may draw from there. START puts the probe at the spawn.
**Follow the cursor** recomputes it live as you sweep, which is the best way to
find the exact threshold where a room stops being visible.

**Entities.** Twelve categories, each toggleable, plus a difficulty filter that
reads the skill spawnflags, so you can watch monster placement change between
easy and hard on identical geometry. Click a marker to pin it and read every
key-value pair, decoded door locks included, with buttons that follow the trigger
chain forwards and backwards.

**Golden path.** Press SOLVE. See below.

**Codex.** An essay on how Quake carries a world without narrating one, the
current map's own strings, a bestiary of what each monster demands of the room it
stands in, and the game's full text table read out of your `progs.dat`.

**Atlas.** Runs every map in the pak through the same solve and tabulates the
result, with a scatter plot on any two columns and a CSV export.

**Export.** SVG from the orthographic views with true section cuts, or PNG at up
to four times the viewport.

---

## The golden path

This is the part that does the most work. Slipgate does not guess at
navigability. Quake shipped its own navmesh: hull 1 of the world model is the
collision geometry already expanded by the player's 32 × 32 × 56 box, so a single
point test answers whether the body fits. Slipgate samples that hull on a
sixteen-unit lattice and connects neighbouring cells under the game's real
movement rules. Eighteen units of rise is a step. Forty-five is the jump apex,
which is what 270 units per second of jump velocity gives against 800 of gravity.
Falls are free. Water is swimmable, lava is not. Lifts and teleporters become
explicit edges, since their brushes are not in the world hull at all.

Locks come from the entities. Spawnflag 8 wants the gold key, 16 wants the
silver, and a targetname means the door waits on a trigger. Slipgate floods,
collects what it can reach, opens whatever that unlocks, and floods again until
the exit falls inside. Then it traces the route back, notes which gated doors it
crossed, and takes their openers as required, recursing until it has the
necessary chain rather than a shopping list.

What you get:

- the route drawn as a tube through its waypoints, each clickable
- the reachable floor coloured by time from the start
- everything more than 160 units off that route coloured by how far off it is
- a profile of the baked light beneath every step of the route

**Reading the numbers.**

| | |
|---|---|
| **path** | length of the route in Quake units |
| **direct** | straight-line distance from spawn to exit |
| **detour** | the ratio of the two, so how much the level makes you wander |
| **backtrack** | share of the route spent re-crossing ground already covered |
| **optional** | share of reachable floor the route never needs |
| **floor** | total walkable area |
| **open** | mean share of the level visible from a sampled point, so how compartmented it is |
| **floor light** | area-weighted mean brightness of walkable surface |
| **dark floor** | share of that surface below a quarter brightness |
| **dark route** | share of the route spent in the dark |

---

## Five things to try

**A measured plan.** PLAN, palette VELLUM, cut on Z at about a fifth, ceilings
off, face edges on. Export as SVG. That is a publishable drawing at true scale,
with layers already separated.

**Where the level lets you see.** Arm PROBE, turn on **Follow the cursor**, and
sweep a corridor. Watch the visible set open and close. The boundary is a
decision someone made in 1996 and compiled into the file.

**How darkness is paced.** Solve a route, then read the light profile beneath the
statistics. Compare e1m1 with e1m5. Romero and McGee use blackness very
differently and now you can put a number on it.

**What the map is really about.** Solve, then look at the optional volume. The
ratio of optional to required is a design position, and it separates designers
more sharply than anything else in the table.

**The whole game at once.** COMPARE ALL MAPS, run it at COARSE 32 first. Then
plot openness against monster density, or floor area against detour. Click any
outlier to open the geometry that produced it.

---

## Honest limits

The navigation grid samples on a lattice, so a ledge within one cell of the jump
limit may read as reachable when it is marginal. The bias is deliberate: an
over-connection is a smaller error than a stranded exit, and when the solve
cannot resolve every lock it says so rather than failing quietly.

The visibility set is the compiler's, which means it is conservative by design.
It tells you what the engine may draw, not what you will necessarily see.

`func_wall` and similar brush entities are absent from the collision hull, so a
handful of walls read as passable.

Room segmentation is not real segmentation. The graph shown is the trigger and
target logic, which is the actual progression scaffolding. True portal-based
rooms would need the `.prt` file that the compiler discards.

---

## Sharing a view

**COPY LINK TO THIS VIEW** writes the entire reading into the URL: which map,
which camera and where it is pointing, which cut, which layers, which shading.
Someone opening that link supplies their own pak and lands exactly where you
were. A footnote can point at a view rather than describe one.
