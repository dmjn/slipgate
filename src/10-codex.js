/* ============================ CODEX ============================ */
/* Four readings of the same map: the fiction it sits inside, the strings its
   own entity lump carries, a bestiary keyed to what is actually spawned here,
   and the game's full text table lifted out of the loaded pak. */

const EPISODES = {
  "1": "Dimension of the Doomed",
  "2": "The Realm of Black Magic",
  "3": "The Netherworld",
  "4": "The Elder World"
};


const GUIDE = [
  ["What this is",
   "Slipgate opens Quake's levels and lets you read them the way you would read a building: in plan, in section, in axonometric, with the ceilings lifted off and the walls turned to glass. It is not a level editor and it is not a game. Everything it reports is derived from the game's own data, so the visibility set, the collision hull, the baked lighting and the trigger logic are read out of the files rather than estimated. It ships no game data and uploads nothing; your pak is parsed in this tab."],

  ["Moving around",
   "Drag orbits. Right-drag or shift-drag pans. The wheel zooms toward the cursor. Double-click a surface to orbit around that point, or an entity to frame it. F frames the whole map and G frames the selection. WASD with Q and E flies, in perspective only. Bracket keys step through the maps in the pak, H hides the rail, and Escape drops a selection or disarms a mode. Rotating never forces you out of an orthographic projection, so a plan or an axonometric stays parallel however you swing it."],

  ["Reading a level",
   "The four camera buttons give perspective, axonometric, plan and elevation, and the orthographic three are the ones that measure, since distances hold their ratio anywhere in the frame. Cut adds a section plane on any axis; Z together with PLAN gives a true architectural plan taken at whatever height you choose. Surface controls how faces are coloured, from flat form through height and material to the lighting Quake compiled into the level. Floors, walls and ceilings are separate geometry split at the threshold the engine itself uses to decide whether you are standing on something, so each can be dimmed or removed."],

  ["Visibility",
   "Arm PROBE and click any surface. Slipgate finds the leaf you clicked, decompresses the compiled potentially visible set, and lights every surface the engine may draw from there. START places the probe at the spawn, which is what the player sees on arrival. Turning on Follow the cursor recomputes it live as you sweep, and that is the quickest way to find the exact threshold where a room stops being visible. The set is the compiler's own, so it is conservative: it tells you what may be drawn rather than what you will certainly see."],

  ["The golden path",
   "Quake shipped its own navmesh. Hull 1 of the world model is the collision geometry already expanded by the player's 32 by 32 by 56 box, so one point test answers whether the body fits. Slipgate samples that hull and connects neighbouring cells under the real movement rules, with 18 units of rise as a step and 45 as the jump apex, which is what 270 of jump velocity gives against 800 of gravity. Locks come from the entities, where spawnflag 8 wants the gold key and 16 the silver. It floods, collects what it can reach, opens whatever that unlocks, and repeats until the exit falls inside, then traces back to find the chain of keys and triggers actually required."],

  ["What the numbers mean",
   "Detour is the route length over the straight-line distance from spawn to exit, so it measures how much the level makes you wander. Backtrack is the share of the route spent re-crossing ground already covered. Optional is the share of reachable floor the route never needs, and the ratio of optional to required is a design position rather than an accident. Open is the mean share of the level visible from a sampled point, so a low number means a compartmented map. Floor light, dark floor and dark route measure the baked lighting: the mean brightness of walkable surface, how much of it sits below a quarter brightness, and how much of the route runs through it."],

  ["Five things to try",
   "For a measured drawing, use PLAN with the VELLUM palette, a Z cut about a fifth of the way up, ceilings off and face edges on, then export SVG. To see where a level lets you see, arm the probe with Follow the cursor and sweep a corridor. To read how darkness is paced, solve a route and look at the light profile under the statistics, then compare e1m1 with e1m5. To find what a map is really about, solve it and look at how much optional volume there is. And to compare the whole game, run COMPARE ALL MAPS at the coarse setting, then plot openness against monster density and click any outlier to open the geometry behind it."],

  ["Honest limits",
   "The navigation grid samples on a lattice, so a ledge within one cell of the jump limit can read as reachable when it is marginal. That bias is deliberate, since an over-connection is a smaller error than a stranded exit, and when the solve cannot resolve every lock it says so rather than failing quietly. Brush entities such as func_wall are absent from the collision hull, so a handful of walls read as passable. The graph panel shows trigger and target logic, which is the real progression scaffolding; true portal-based room segmentation would need the .prt file the compiler discards."],

  ["Sharing a view",
   "COPY LINK TO THIS VIEW writes the whole reading into the URL: which map, where the camera is and what it is pointing at, which cut, which layers, which shading. Anyone opening that link supplies their own pak and lands exactly where you were, which lets a footnote point at a view rather than describe one."]
];

const FICTION = [
  ["A world before a story",
   "Quake opens without exposition. A teleport experiment at a military installation went wrong, something came back through the gate, and you were sent in. id never returns to any of it. There is no briefing, no character who explains the situation, no second act. What you are given instead is a hub with four doors and a difficulty pit, on the assumption that moving through a place is a sufficient account of it. The campaign is a tour of a world-image rather than a plot, a coherent set of conditions under which spaces can be generated and entered, and the whole of the fiction is carried by the conditions."],

  ["The slipgate as the governing device",
   "One object holds the construction together. A slipgate joins places that have no business adjoining, and id uses that single operation three ways at once. It is the cause of the invasion, so it does the work of plot. It is the entry to each episode, so it does the work of structure. And it licenses a military base, a gothic cathedral, and a lava dimension to sit forty feet apart, so it does the work of permission. Worldmaking of this kind needs a rule that lets incompatible material coexist without the world coming apart, and Quake's rule is a doorway."],

  ["What the four episodes actually share",
   "The episodes are often described as four unrelated worlds, and the genre signals do change, from installation to castle to necropolis to temple. Underneath that they share one visual language, and it is the strongest thing id made. The same narrow palette of browns and slate greys. The same heavy proportions and the same eight and sixteen unit grid. The same falloff into blackness at the edge of a light. The same materiality, where metal and stone are rendered with an identical grain because they are drawn from the same small set of textures at the same resolution. Coherence in Quake is material and geometric rather than thematic, which is worth sitting with, because it is a demonstration that a world holds together through consistency of means rather than consistency of subject."],

  ["Four runes, one operation",
   "Each episode ends with a rune, and the four together open the floor of the hub. This is the only structural notation in the game, and it is legible entirely through geometry: collect four tokens, a floor opens, descend. The runes do the work that a map legend or a quest log does elsewhere, and they do it without leaving the world, since a rune is an object you carry rather than an entry in an interface. The campaign is a key-and-door puzzle scaled up until it becomes the shape of the whole."],

  ["Lovecraft with the narrator removed",
   "The names are borrowed from Lovecraft, along with the vocabulary of things that are old and hostile and indifferent. Lovecraft's fiction runs on a narrator working out what he has found, and id kept none of that apparatus. What survives the removal is the part that operates spatially: architecture that predates your arrival, was built to proportions that were not calculated for you, and continues without addressing you. The absence of any explaining voice produces the interiority that Lovecraft's prose produces by other means, and it produces it more cheaply, because a room that never explains itself is simply a room built well."],

  ["The level is the text",
   "With no plot to follow, the level carries everything. A room is not dressed to support a story beat, because there are no story beats to support. It is shaped to be moved through, and whatever it conveys it conveys through proportion, threshold, sightline, and the placement of something that intends to kill you. This is why Quake rewards the kind of reading this tool is built for. Strip the fiction away and nothing is lost, because the fiction was never the thing doing the work."]
];

/* Health and attack values are facts of the game code. The notes are readings
   of how each monster shapes the space it is placed in. */
const BESTIARY = [
  { cn:"monster_dog", name:"Rottweiler", hp:25, atk:"Leaping bite",
    note:"The first thing that moves at you, and the first lesson: distance is not safety. It closes the gap with a leap, which means a room containing dogs has no comfortable standing position. Cheap enough to use in numbers, so id uses it to make an open floor feel unstable." },
  { cn:"monster_army", name:"Grunt", hp:30, atk:"Shotgun, hitscan",
    note:"Hitscan, so it cannot be dodged once fired, only pre-empted. The wind-up animation is the entire counterplay, which makes grunt placement a question of sightline length: far enough that you see the raise, close enough that it matters. Almost always placed where you enter a room rather than where you leave it." },
  { cn:"monster_enforcer", name:"Enforcer", hp:80, atk:"Laser bolts, projectile",
    note:"The base world's answer to the grunt, and the difference is the projectile. A dodgeable shot changes what the room needs to provide, since you now require lateral space rather than cover. Enforcers appear in the wide industrial halls for exactly this reason." },
  { cn:"monster_fish", name:"Rotfish", hp:25, atk:"Bite",
    note:"Individually trivial, structurally important. Rotfish are the only reason a body of water carries risk, and without them every pool in the game would be a rest stop. They convert liquid volume from a traversal convenience into a place you would rather not linger." },
  { cn:"monster_zombie", name:"Zombie", hp:60, atk:"Thrown gore",
    note:"Cannot be killed except by explosive damage, so it turns a combat problem into an economic one. You either spend rockets or you route around it, and both answers are spatial. Zombies in a corridor mean the corridor is a toll, and id places them in exactly those positions." },
  { cn:"monster_knight", name:"Knight", hp:75, atk:"Sword, melee",
    note:"Pure pressure. It has no ranged option, so it exists to make you keep moving backwards, which means the geometry behind you is the real content of the encounter. Knights in a room with a drop behind you are a different fight from knights in a dead end." },
  { cn:"monster_hell_knight", name:"Death Knight", hp:250, atk:"Sword and a fan of fire",
    note:"The fan is the point. A spread of projectiles denies an arc of floor rather than a line, so backing straight away stops working and you have to move laterally. Death knights are how id forces you to use the width of a room instead of its depth." },
  { cn:"monster_wizard", name:"Scrag", hp:80, atk:"Acid spit, flying",
    note:"The only common flyer, and therefore the only enemy that makes the upper half of a room load-bearing. A scrag placed high converts vertical volume that was decoration into space you have to read. Note how often they appear in the tall gothic interiors where the ceiling would otherwise go unused." },
  { cn:"monster_ogre", name:"Ogre", hp:200, atk:"Chainsaw and grenades",
    note:"The workhorse of Quake's spatial design. Grenades arc and bounce, so an ogre does not aim at you, it denies the ground you are standing on. That makes it the only enemy whose threat is shaped by the floor's geometry: stairs, ledges, and pits all change what a grenade does. Put an ogre above you and the encounter is about the architecture." },
  { cn:"monster_tarbaby", name:"Spawn", hp:80, atk:"Bounces, detonates on contact",
    note:"Unpredictable movement plus contact damage equals area denial that you cannot plan around. Spawn are placed where id wants panic rather than calculation, usually in rooms tight enough that the bouncing has walls to work with." },
  { cn:"monster_demon1", name:"Fiend", hp:300, atk:"Leaping claws",
    note:"A range-closing device with enough health to survive the approach. The long leap means the fight is about maintaining circulation, so a room with fiends needs a loop in it. Where the geometry gives you nothing to circle, a fiend is close to a death sentence, and id knows it." },
  { cn:"monster_shalrath", name:"Vore", hp:400, atk:"Homing spike ball",
    note:"The only enemy that punishes standing still absolutely, because the projectile tracks. Cover is the sole counter, which makes the vore a test of whether the room contains occluders. Placing one in an open arena is a different design statement from placing one among pillars, and Quake does both deliberately." },
  { cn:"monster_shambler", name:"Shambler", hp:600, atk:"Claws and hitscan lightning",
    note:"The lightning cannot be dodged and cannot be outrun. It can only be blocked by geometry, which means a shambler turns the room's occluders into the actual mechanic. Every shambler encounter is a question about what you can put between yourself and it, and the answer is written into the level rather than into your reflexes." },
  { cn:"monster_boss", name:"Chthon", hp:0, atk:"Lava balls",
    note:"Not killable by weapons at all. The level provides a lightning apparatus and you operate it, which makes the boss a machine you have to read rather than an enemy you have to beat. The purest case in the game of the architecture doing the work." },
  { cn:"monster_oldone", name:"Shub-Niggurath", hp:0, atk:"None directly",
    note:"Killed only by being teleported into, which means the final act of the game is a traversal problem disguised as a boss fight. You solve the room, not the creature. Fitting for a game whose fiction was always carried by its doorways." }
];

const ITEM_LORE = [
  { cn:"item_sigil", name:"Rune", note:"One per episode. Four of them open the floor of the hub. This is the entire campaign structure expressed as an inventory check." },
  { cn:"item_key1", name:"Silver key", note:"Gates a door with spawnflag 16. In the base episodes it reads as a keycard, in the medieval ones as an actual key. Same lump, different fiction." },
  { cn:"item_key2", name:"Gold key", note:"Gates a door with spawnflag 8. Usually the deeper of the two locks in a map, which is why the flood solver almost always resolves it second." },
  { cn:"item_artifact_super_damage", name:"Quad Damage", note:"Thirty seconds of quadruple damage. Placement is a design statement about what id expects you to be holding when you round the next corner." },
  { cn:"item_artifact_invulnerability", name:"Pentagram of Protection", note:"Total immunity for a short window. Almost always placed immediately before something the level otherwise has no answer for." },
  { cn:"item_artifact_envirosuit", name:"Biosuit", note:"Makes slime and lava survivable, which temporarily rewrites the map's traversal graph. Worth watching for in the flood overlay, since it opens routes the solver treats as closed." },
  { cn:"item_artifact_invisibility", name:"Ring of Shadows", note:"Monsters lose track of you. The rarest of the four artifacts and the least used, because Quake's encounters are built around movement rather than avoidance." }
];

const CODEX = { tab:"guide", progs:null, progsTried:false };

function codexOpen(){ return document.getElementById("codex").classList.contains("show"); }

function episodeOf(name){
  const m = (name||"").match(/^e(\d)m\d+$/i);
  return m ? { num:m[1], label:EPISODES[m[1]] || "" } : null;
}

/* ---------- progs.dat string table ---------- */
function progsStrings(buf){
  const dv = new DataView(buf);
  let ofs = 0, len = buf.byteLength;
  if(buf.byteLength > 64 && dv.getInt32(0,true) === 6){
    const o = dv.getInt32(40,true), n = dv.getInt32(44,true);   // ofs_strings, numstrings
    if(o > 0 && n > 0 && o+n <= buf.byteLength){ ofs = o; len = n; }
  }
  const b = new Uint8Array(buf, ofs, len);
  const out = [];
  let cur = "";
  for(let i=0;i<b.length;i++){
    const c = b[i];
    if(c === 10 || (c >= 32 && c <= 126)) cur += String.fromCharCode(c);
    else { if(cur.length >= 8) out.push(cur); cur = ""; }
  }
  if(cur.length >= 8) out.push(cur);
  return out;
}

function classifyString(t){
  if(/^[\w\-\/]+\.(mdl|spr|wav|bsp|lmp|dat|qc|cfg|txt)$/i.test(t)) return null;
  if(/^(progs|sound|maps|gfx|models)\//i.test(t)) return null;
  if(t.indexOf(" ") < 0 && t.indexOf("\n") < 0) return null;
  if(/^[\d\s.\-]+$/.test(t)) return null;
  if(t.length > 110 || (t.match(/\n/g)||[]).length >= 2) return "Narration";
  if(t.indexOf("%s") >= 0) return "Obituaries";
  if(/\b(key|rune|sigil|gate|door)\b/i.test(t)) return "Locks and runes";
  if(/^you\b/i.test(t)) return "Prompts and pickups";
  return "Other strings";
}

function loadProgs(){
  CODEX.progsTried = true;
  if(!pakBuf || !S.pakAll) return null;
  const f = S.pakAll.find(function(x){ return /(^|\/)progs\.dat$/i.test(x.name); });
  if(!f) return null;
  try {
    const raw = progsStrings(pakBuf.slice(f.ofs, f.ofs+f.size));
    const groups = {};
    const seen = {};
    raw.forEach(function(t){
      const s2 = t.replace(/\s+$/,"");
      if(seen[s2]) return; seen[s2] = 1;
      const g = classifyString(s2);
      if(!g) return;
      (groups[g] = groups[g] || []).push(s2);
    });
    CODEX.progs = groups;
    return groups;
  } catch(err){ return null; }
}

/* ---------- census ---------- */
function monsterCensus(){
  const out = {};
  S.ents.forEach(function(e){
    const cn = (e.classname||"").toLowerCase();
    if(cn.indexOf("monster_") !== 0) return;
    if(!out[cn]) out[cn] = { total:0, easy:0, normal:0, hard:0, first:e };
    out[cn].total++;
    const sf = parseInt(e.spawnflags||"0",10);
    if(!(sf & NOT_EASY)) out[cn].easy++;
    if(!(sf & NOT_NORMAL)) out[cn].normal++;
    if(!(sf & NOT_HARD)) out[cn].hard++;
  });
  return out;
}

/* ---------- rendering ---------- */
function renderCodex(){
  const body = document.getElementById("codexBody");
  if(!body) return;
  document.querySelectorAll("[data-ctab]").forEach(function(b){
    b.classList.toggle("on", b.dataset.ctab === CODEX.tab);
  });
  if(CODEX.tab === "guide") body.innerHTML = renderGuide();
  else if(CODEX.tab === "fiction") body.innerHTML = renderFiction();
  else if(CODEX.tab === "map") body.innerHTML = renderMapLore();
  else if(CODEX.tab === "bestiary") body.innerHTML = renderBestiary();
  else body.innerHTML = renderText();
  body.scrollTop = 0;
}

function renderGuide(){
  let h = "<p class='cnote'>Slipgate reads your own Quake files. Nothing is uploaded, and no game data ships with the tool.</p>";
  GUIDE.forEach(function(g){
    h += "<h3 class='ch'>" + esc(g[0]) + "</h3><p class='cp'>" + esc(g[1]) + "</p>";
  });
  return h;
}

function renderFiction(){
  let h = "<p class='cnote'>Written for this tool. The game's own words are under TEXT, read from your pak.</p>";
  FICTION.forEach(function(f){
    h += "<h3 class='ch'>" + esc(f[0]) + "</h3><p class='cp'>" + esc(f[1]) + "</p>";
  });
  return h;
}

function renderMapLore(){
  if(!S.bsp) return "<p class='cnote'>No map loaded.</p>";
  const wm = S.ents.find(function(e){ return e.classname === "worldspawn"; }) || {};
  const ep = episodeOf(S.pakMaps && S.pakIndex >= 0 ? S.pakMaps[S.pakIndex].short : "");
  let h = "";
  h += "<h3 class='ch'>" + esc(wm.message || "Untitled") + "</h3>";
  if(ep && ep.label) h += "<p class='cnote'>Episode " + ep.num + ", " + esc(ep.label) + "</p>";

  const cens = monsterCensus();
  const names = Object.keys(cens);
  let tm = 0, te = 0, th = 0;
  names.forEach(function(k){ tm += cens[k].total; te += cens[k].easy; th += cens[k].hard; });
  const secrets = S.ents.filter(function(e){ return e.classname === "trigger_secret"; }).length;
  const tele = S.ents.filter(function(e){ return e.classname === "trigger_teleport"; }).length;
  const keys = S.ents.filter(function(e){ return e.classname === "item_key1" || e.classname === "item_key2"; })
    .map(function(e){ return e.classname === "item_key1" ? "silver" : "gold"; });
  const exits = S.ents.filter(function(e){ return e.classname === "trigger_changelevel"; });

  h += "<div class='cstats'>";
  h += "<div><i>monsters</i><em>" + tm + "  (easy " + te + " / hard " + th + ")</em></div>";
  h += "<div><i>secrets</i><em>" + secrets + "</em></div>";
  h += "<div><i>teleporters</i><em>" + tele + "</em></div>";
  h += "<div><i>keys</i><em>" + (keys.length ? keys.join(", ") : "none") + "</em></div>";
  if(exits.length && exits[0].map) h += "<div><i>exits to</i><em>" + esc(exits[0].map) + "</em></div>";
  h += "</div>";

  const msgs = S.ents.filter(function(e){ return e.message && e.message.length > 1 && e.classname !== "worldspawn"; });
  h += "<h3 class='ch'>Strings in this map</h3>";
  if(!msgs.length) h += "<p class='cnote'>This map's entity lump carries no messages.</p>";
  else {
    h += "<p class='cnote'>Read from the entity lump of the BSP you loaded. Click one to select the entity that speaks it.</p>";
    msgs.forEach(function(e){
      h += "<button class='cmsg' data-ent='" + e.__idx + "'>" +
           "<span>" + esc(e.classname||"?") + "</span>" + esc(e.message) + "</button>";
    });
  }
  return h;
}

function renderBestiary(){
  const cens = S.bsp ? monsterCensus() : {};
  const here = [], elsewhere = [];
  BESTIARY.forEach(function(m){
    (cens[m.cn] ? here : elsewhere).push(m);
  });
  let h = "";
  if(S.bsp){
    h += "<p class='cnote'>Health and attack are facts of the game code. The notes are readings of how each one shapes the room it stands in.</p>";
    h += "<h3 class='ch'>In this map</h3>";
    if(!here.length) h += "<p class='cnote'>No monsters in this map.</p>";
    here.forEach(function(m){ h += bestiaryEntry(m, cens[m.cn]); });
    h += "<h3 class='ch'>Not in this map</h3>";
    elsewhere.forEach(function(m){ h += bestiaryEntry(m, null); });
  } else {
    BESTIARY.forEach(function(m){ h += bestiaryEntry(m, null); });
  }
  h += "<h3 class='ch'>Items that change the map</h3>";
  ITEM_LORE.forEach(function(it){
    const n = S.bsp ? S.ents.filter(function(e){ return e.classname === it.cn; }).length : 0;
    h += "<div class='cent'><div class='chead'><b>" + esc(it.name) + "</b>" +
         (n ? "<span class='ccount'>" + n + " here</span>" : "") + "</div>" +
         "<p class='cp'>" + esc(it.note) + "</p></div>";
  });
  return h;
}

function bestiaryEntry(m, c){
  let h = "<div class='cent'><div class='chead'><b>" + esc(m.name) + "</b>";
  if(c) h += "<span class='ccount'>" + c.total + " placed</span>";
  h += "</div>";
  h += "<div class='cmeta'>" + (m.hp ? m.hp + " health · " : "") + esc(m.atk) + "</div>";
  if(c) h += "<div class='cmeta'>easy " + c.easy + " · normal " + c.normal + " · hard " + c.hard + "</div>";
  h += "<p class='cp'>" + esc(m.note) + "</p>";
  if(c) h += "<button class='cgo' data-ent='" + c.first.__idx + "'>find the first one</button>";
  return h + "</div>";
}

function renderText(){
  if(!CODEX.progsTried) loadProgs();
  if(!pakBuf) return "<p class='cnote'>Load a pak rather than a single BSP and this reads the game's whole text table out of progs.dat.</p>";
  if(!CODEX.progs) return "<p class='cnote'>No progs.dat found in this pak, or its string table could not be read.</p>";
  const order = ["Narration","Locks and runes","Prompts and pickups","Obituaries","Other strings"];
  let h = "<p class='cnote'>Extracted from the progs.dat in your own pak. This is the game's text as the engine holds it.</p>";
  order.forEach(function(g){
    const list = CODEX.progs[g];
    if(!list || !list.length) return;
    h += "<h3 class='ch'>" + g + " <span class='ccount'>" + list.length + "</span></h3>";
    list.forEach(function(t){
      h += "<div class='cstr'>" + esc(t).replace(/\n/g,"<br>") + "</div>";
    });
  });
  return h;
}
