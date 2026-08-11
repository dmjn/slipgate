/* ============================ ENTITY TAXONOMY ============================ */

const CATS = [
  { id:"start",   label:"Player start",  color:0xffffff, size:12 },
  { id:"monster", label:"Monsters",      color:0xa33b32, size:9  },
  { id:"key",     label:"Keys & doors",  color:0xb06fd0, size:11 },
  { id:"weapon",  label:"Weapons",       color:0xd4a03a, size:8  },
  { id:"ammo",    label:"Ammo",          color:0x8a7a45, size:6  },
  { id:"health",  label:"Health & armor",color:0x7d9b3f, size:7  },
  { id:"power",   label:"Powerups",      color:0x4a7de0, size:10 },
  { id:"tele",    label:"Teleports",     color:0x38b0a8, size:9  },
  { id:"secret",  label:"Secrets",       color:0xe0d24a, size:10 },
  { id:"exit",    label:"Exit",          color:0xd4622b, size:12 },
  { id:"trigger", label:"Other triggers",color:0x6b6459, size:6  },
  { id:"light",   label:"Lights",        color:0x3d3a33, size:4  }
];

function classify(cn, e){
  if(cn === "info_player_start" || cn === "info_player_start2" || cn.indexOf("info_player_deathmatch")===0) return "start";
  if(cn.indexOf("monster_") === 0) return "monster";
  if(cn === "item_key1" || cn === "item_key2") return "key";
  if(cn === "func_door"){
    const sf = parseInt(e.spawnflags||"0",10);
    if(sf & 24) return "key";
    return "trigger";
  }
  if(cn === "trigger_changelevel") return "exit";
  if(cn === "trigger_secret") return "secret";
  if(cn === "trigger_teleport" || cn === "info_teleport_destination") return "tele";
  if(cn.indexOf("weapon_") === 0) return "weapon";
  if(cn.indexOf("ammo_") === 0 || cn === "item_shells" || cn === "item_spikes" ||
     cn === "item_rockets" || cn === "item_cells") return "ammo";
  if(cn === "item_health" || cn.indexOf("item_armor") === 0) return "health";
  if(cn.indexOf("item_artifact") === 0 || cn === "item_sigil" || cn === "item_weapon") return "power";
  if(cn.indexOf("light") === 0) return "light";
  if(cn.indexOf("trigger_") === 0 || cn.indexOf("func_") === 0 || cn.indexOf("path_") === 0) return "trigger";
  return null;
}

const NOT_EASY = 256, NOT_NORMAL = 512, NOT_HARD = 1024;
function inSkill(e, skill){
  if(skill < 0) return true;
  const sf = parseInt(e.spawnflags || "0", 10);
  if(skill === 0 && (sf & NOT_EASY)) return false;
  if(skill === 1 && (sf & NOT_NORMAL)) return false;
  if(skill === 2 && (sf & NOT_HARD)) return false;
  return true;
}
