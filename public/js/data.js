/* ── DATA: constantes pequeñas y funciones helper ──────────────────────────
   Los arrays de referencia (ITEMS, CONDITIONS, NPCS, PRESET_MONSTERS,
   DEFAULT_CAMPAIGN_EVENTS/THREADS/LOCATIONS, CLASS_PRESETS) se fetchean
   desde la API en init.js y se asignan como globals antes de renderizar.
   ────────────────────────────────────────────────────────────────────────── */

/* Globals de referencia — poblados por init.js desde la API */
let ITEMS = [];
let CONDITIONS = [];
let CONCENTRATION_META = {};
let NPCS = [];
let NPC_IDS = [];
let PRESET_MONSTERS = [];
let DEFAULT_CAMPAIGN_EVENTS = [];
let DEFAULT_CAMPAIGN_THREADS = [];
let DEFAULT_CAMPAIGN_LOCATIONS = [];
let CLASS_PRESETS = {};

const CHARS = ['rac','relyo','tyrell','boyd','esdas'];

const HP_MAX = {rac:15,relyo:10,tyrell:13,boyd:9,esdas:7};

const DEFAULT_INVENTORY = {
  rac:['Greataxe / Hacha de dos manos','Chainmail / remera de cadenas','Bolsa básica de aventurero'],
  relyo:['Quarterstaff / Palo de madera','Remera pesada de lino','Vendas para las manos'],
  tyrell:['Armadura pesada (hombros y pecho)','Escudo','Shortsword / Espada corta'],
  boyd:['Malla liviana','Cuchillo simple','Herramientas simples (loot)'],
  esdas:['Malla liviana','Cuchillo simple']
};

/* ── Helpers de items (ITEMS viene de data/items.js) ── */
function getItem(id){ return ITEMS.find(i=>i.id===id); }
function getWeapons(){ return ITEMS.filter(i=>i.category==='weapon'); }
function getEquippedWeapons(charId){
  const preset = CLASS_PRESETS[charId];
  if(!preset || !preset.equipment) return [];
  return preset.equipment
    .filter(e=>e.equipped)
    .map(e=>getItem(e.itemId))
    .filter(Boolean)
    .filter(i=>i.category==='weapon');
}

/* ── Helper de condiciones ── */
function getCondition(id){ return CONDITIONS.find(c=>c.id===id); }

/* ── D&D 5E: stats ─────────────────────────────────────────────────────── */

const ABILITY_SCORES = {
  rac:{str:17,dex:13,con:16,int:8,wis:10,cha:11},
  relyo:{str:10,dex:17,con:13,int:10,wis:15,cha:9},
  tyrell:{str:17,dex:10,con:14,int:8,wis:16,cha:10},
  boyd:{str:8,dex:13,con:12,int:14,wis:16,cha:12},
  esdas:{str:8,dex:14,con:13,int:17,wis:11,cha:12}
};

const CHAR_LEVEL = 2;   // default; cada char tiene su nivel via getCharLevel(c)
const PROF_BONUS = 2;   // default lv 1-4; cada char tiene el suyo via getCharProfBonus(c)

function abilityMod(score){ return Math.floor((score-10)/2); }

/* ── Hit Die por clase ── */
const HIT_DIE_BY_CHAR = {
  rac: 12,    // Bárbaro
  relyo: 8,   // Monje
  tyrell: 10, // Paladín
  boyd: 8,    // Druida
  esdas: 6    // Wizard
};

function hitDieAvg(die){ return die/2 + 1; }

function hpGainOnLevelUp(c){
  const die = HIT_DIE_BY_CHAR[c];
  const conMod = abilityMod(ABILITY_SCORES[c].con);
  return hitDieAvg(die) + conMod;
}

/* ── Getters dinámicos (leen de localStorage con fallback) ── */
function getCharLevel(c){ return load('char_level_'+c, CHAR_LEVEL); }
function getHPMax(c){ return load('hp_max_'+c, HP_MAX[c]); }
function getCharProfBonus(c){
  const lvl = getCharLevel(c);
  return 2 + Math.floor((lvl-1)/4); // Nv 1-4→+2, 5-8→+3, 9-12→+4, 13-16→+5, 17-20→+6
}

const SPELLCASTING_STAT = { rac:'str', relyo:'wis', tyrell:'cha', boyd:'wis', esdas:'int' };

function calcSpellAttackMod(charId){
  const stat = SPELLCASTING_STAT[charId];
  if(!stat) return '';
  const scores = ABILITY_SCORES[charId];
  if(!scores) return '';
  return abilityMod(scores[stat]) + getCharProfBonus(charId);
}

function calcSpellSaveDC(charId){
  const stat = SPELLCASTING_STAT[charId];
  if(!stat) return 8;
  const scores = ABILITY_SCORES[charId];
  if(!scores) return 8;
  return 8 + getCharProfBonus(charId) + abilityMod(scores[stat]);
}

/* ── Spell slot tables ── */
const FULL_CASTER_SLOTS = {
  1:  {1:2}, 2: {1:3},
  3:  {1:4,2:2}, 4: {1:4,2:3},
  5:  {1:4,2:3,3:2}, 6: {1:4,2:3,3:3},
  7:  {1:4,2:3,3:3,4:1}, 8: {1:4,2:3,3:3,4:2},
  9:  {1:4,2:3,3:3,4:3,5:1}, 10:{1:4,2:3,3:3,4:3,5:2},
  11: {1:4,2:3,3:3,4:3,5:2,6:1}, 12:{1:4,2:3,3:3,4:3,5:2,6:1},
  13: {1:4,2:3,3:3,4:3,5:2,6:1,7:1}, 14:{1:4,2:3,3:3,4:3,5:2,6:1,7:1},
  15: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1}, 16:{1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1},
  17: {1:4,2:3,3:3,4:3,5:2,6:1,7:1,8:1,9:1}, 18:{1:4,2:3,3:3,4:3,5:3,6:1,7:1,8:1,9:1},
  19: {1:4,2:3,3:3,4:3,5:3,6:2,7:1,8:1,9:1}, 20:{1:4,2:3,3:3,4:3,5:3,6:2,7:2,8:1,9:1}
};

const HALF_CASTER_SLOTS = {
  1: {}, 2:  {1:2},
  3:  {1:3}, 4:  {1:3},
  5:  {1:4,2:2}, 6:  {1:4,2:2},
  7:  {1:4,2:3}, 8:  {1:4,2:3},
  9:  {1:4,2:3,3:2}, 10: {1:4,2:3,3:2},
  11: {1:4,2:3,3:3}, 12: {1:4,2:3,3:3},
  13: {1:4,2:3,3:3,4:1}, 14: {1:4,2:3,3:3,4:1},
  15: {1:4,2:3,3:3,4:2}, 16: {1:4,2:3,3:3,4:2},
  17: {1:4,2:3,3:3,4:3,5:1}, 18: {1:4,2:3,3:3,4:3,5:1},
  19: {1:4,2:3,3:3,4:3,5:2}, 20: {1:4,2:3,3:3,4:3,5:2}
};

function getSpellSlotsForLevel(c, level){
  level = level || getCharLevel(c);
  const lvl = Math.min(20, Math.max(1, level));
  if(c === 'tyrell') return HALF_CASTER_SLOTS[lvl] || {};
  if(c === 'boyd' || c === 'esdas') return FULL_CASTER_SLOTS[lvl] || {};
  return {};
}

/* ── Recurso max dinámico por nivel ── */
function getResourceMax(c, key, level){
  level = level || getCharLevel(c);
  if(c === 'rac' && key === 'rage'){
    if(level >= 20) return 99;
    if(level >= 17) return 6;
    if(level >= 12) return 5;
    if(level >= 6) return 4;
    if(level >= 3) return 3;
    return 2;
  }
  if(c === 'relyo' && key === 'ki') return level;
  if(c === 'tyrell' && key === 'lay-on-hands') return 5 * level;
  if(c === 'tyrell' && key === 'divine-sense') return 1 + Math.max(0, abilityMod(ABILITY_SCORES.tyrell.cha));
  if(c === 'tyrell' && key === 'channel-divinity') return level >= 3 ? 1 : 0;
  if(c === 'boyd' && key === 'wild-shape') return level >= 20 ? 99 : 2;
  if(key === 'natural-recovery' || key === 'arcane-recovery') return 1;
  const r = (CLASS_PRESETS[c]?.resources||[]).find(x=>x.key===key);
  return r && r.max != null ? r.max : 0;
}

/* ── Escalado de Bárbaro y Monje ── */
function getRageDamageBonus(level){
  level = level || getCharLevel('rac');
  if(level >= 16) return 4;
  if(level >= 9) return 3;
  return 2;
}

function getMartialArtsDie(level){
  level = level || getCharLevel('relyo');
  if(level >= 17) return 10;
  if(level >= 11) return 8;
  if(level >= 5) return 6;
  return 4;
}

function getUnarmoredMovementBonus(level){
  level = level || getCharLevel('relyo');
  if(level >= 18) return 30;
  if(level >= 14) return 25;
  if(level >= 10) return 20;
  if(level >= 6) return 15;
  if(level >= 2) return 10;
  return 0;
}

/* ── Escalado de cantrips de daño ── */
function getCantripDamageDice(cn, charLevel, c){
  if(!cn.damageBase) return null;
  if(c === 'esdas' && !load('committed_school_esdas', false) && (cn.damageBase||'').match(/^\dd/)){
    return cn.damageBase + ' 🔒';
  }
  let dmg = cn.damageBase;
  if(!cn.damageScaling) return dmg;
  Object.keys(cn.damageScaling).map(Number).sort((a,b)=>a-b).forEach(scaleLv => {
    if(charLevel >= scaleLv) dmg = cn.damageScaling[scaleLv];
  });
  return dmg;
}

/* ── Comprometerse con una escuela (Esdas) ── */
function commitToSchool(c, school){
  if(!confirm(`¿${c.charAt(0).toUpperCase()+c.slice(1)} se compromete con la escuela ${school}? Esto desbloquea el escalado de cantrips y los features de subclase. La decisión es permanente narrativamente (pero podés revertirla manualmente borrando la clave del localStorage).`)) return;
  save('committed_school_'+c, school);
  alert(`${c.charAt(0).toUpperCase()+c.slice(1)} ahora es ${school}. Sus cantrips de daño escalan normalmente con el nivel.`);
  renderCharAbilities(c);
}
