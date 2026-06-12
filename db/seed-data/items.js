/* ── ITEMS: catálogo de armas y objetos ── */

module.exports = [

  // ── ARMAS CUERPO A CUERPO ─────────────────────────────────────────────────
  // known:true = la party ya lo vio/tiene (visible para jugadores sin login DM)

  { id:'greataxe', name:'Greataxe', nameEs:'Hacha de dos manos',
    category:'weapon', damage:'1d12', damageType:'slashing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['heavy','two-handed'], range:'melee', known:true,
    desc:'Hacha de guerra de dos manos. Arma emblemática de los bárbaros.' },

  { id:'handaxe', name:'Handaxe', nameEs:'Hacha de mano',
    category:'weapon', damage:'1d6', damageType:'slashing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['light','thrown'], range:'melee / lanzada 20/60 ft', known:true,
    desc:'Hacha liviana, se puede lanzar.' },

  { id:'longsword', name:'Longsword', nameEs:'Espada larga',
    category:'weapon', damage:'1d8', damageType:'slashing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['versatile'], range:'melee',
    desc:'Espada larga. Versátil: 1d10 a dos manos.' },

  { id:'shortsword', name:'Shortsword', nameEs:'Espada corta',
    category:'weapon', damage:'1d6', damageType:'piercing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['light','finesse'], range:'melee', known:true,
    desc:'Espada corta con propiedad finesse (puede usar DEX).' },

  { id:'quarterstaff', name:'Quarterstaff', nameEs:'Bastón',
    category:'weapon', damage:'1d6', damageType:'bludgeoning',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['versatile'], range:'melee', known:true,
    desc:'Bastón de madera. Versátil: 1d8 a dos manos.' },

  { id:'dagger', name:'Dagger', nameEs:'Daga',
    category:'weapon', damage:'1d4', damageType:'piercing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['light','finesse','thrown'], range:'melee / lanzada 20/60 ft', known:true,
    desc:'Daga. Finesse: puede usar DEX. Se puede lanzar.' },

  { id:'spear', name:'Spear', nameEs:'Lanza',
    category:'weapon', damage:'1d6', damageType:'piercing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['thrown','versatile'], range:'melee / lanzada 20/60 ft',
    desc:'Lanza arrojadiza. Versátil: 1d8 a dos manos.' },

  { id:'mace', name:'Mace', nameEs:'Maza',
    category:'weapon', damage:'1d6', damageType:'bludgeoning',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:[], range:'melee',
    desc:'Maza de una mano.' },

  { id:'warhammer', name:'Warhammer', nameEs:'Martillo de guerra',
    category:'weapon', damage:'1d8', damageType:'bludgeoning',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['versatile'], range:'melee',
    desc:'Martillo de guerra. Versátil: 1d10 a dos manos.' },

  { id:'rapier', name:'Rapier', nameEs:'Estoque',
    category:'weapon', damage:'1d8', damageType:'piercing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['finesse'], range:'melee',
    desc:'Estoque con finesse. Ideal para combatientes con alta DEX.' },

  { id:'unarmed', name:'Unarmed Strike', nameEs:'Golpe sin arma',
    category:'weapon', damage:'1', damageType:'bludgeoning',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:[], range:'melee', known:true,
    desc:'Golpe a puño limpio. Monjes usan el Martial Arts die en su lugar.' },

  { id:'unarmed-monk', name:'Martial Arts Strike', nameEs:'Golpe Artes Marciales',
    category:'weapon', damage:'1d4', damageType:'bludgeoning',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['monk'], range:'melee', known:true,
    desc:'Ataque de Monje. El dado escala con nivel: 1d4 (Nv 1-4) → 1d6 (Nv 5) → 1d8 (Nv 11) → 1d10 (Nv 17). Puede usar STR o DEX.' },

  // ── ARMAS A DISTANCIA ─────────────────────────────────────────────────────
  { id:'shortbow', name:'Shortbow', nameEs:'Arco corto',
    category:'weapon', damage:'1d6', damageType:'piercing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['ammunition','two-handed'], range:'80/320 ft',
    desc:'Arco corto. Requiere flechas.' },

  { id:'longbow', name:'Longbow', nameEs:'Arco largo',
    category:'weapon', damage:'1d8', damageType:'piercing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['ammunition','heavy','two-handed'], range:'150/600 ft',
    desc:'Arco largo. Alcance superior, requiere flechas.' },

  { id:'crossbow-light', name:'Light Crossbow', nameEs:'Ballesta ligera',
    category:'weapon', damage:'1d8', damageType:'piercing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['ammunition','loading','two-handed'], range:'80/320 ft',
    desc:'Ballesta ligera. Requiere acción para recargar.' },

  // ── ARMAS DE DRUIDA ───────────────────────────────────────────────────────
  { id:'scimitar', name:'Scimitar', nameEs:'Cimitarra',
    category:'weapon', damage:'1d6', damageType:'slashing',
    atkStat:'dex', dmgStat:'dex', proficient:true,
    properties:['light','finesse'], range:'melee', known:true,
    desc:'Arma simple de druida. Ligera y con finesse.' },

  { id:'sickle', name:'Sickle', nameEs:'Hoz',
    category:'weapon', damage:'1d4', damageType:'slashing',
    atkStat:'str', dmgStat:'str', proficient:true,
    properties:['light'], range:'melee', known:true,
    desc:'Hoz simple. Arma de druida.' },

  // ── ITEMS DE CAMPAÑA (loot/quest/misc) ────────────────────────────────────
  { id:'colmillo-corrupto', name:'Colmillo Corrupto', nameEs:'Colmillo Corrupto',
    category:'quest', known:true,
    desc:'Ingrediente clave para la Daga del Colmillo Corrompido de Esdas. Garantizado del Lobo Fell. Ver evento S1.' },

  { id:'corazon-arana', name:'Corazón de Araña', nameEs:'Corazón de Araña',
    category:'loot', known:true,
    desc:'Recogido por Nira tras el Encuentro 2. Puede extraer veneno, crear poción o recurso alquímico.' },

  { id:'seda-corrupta', name:'Seda Corrupta', nameEs:'Seda Corrupta',
    category:'loot', known:true,
    desc:'Material de crafting. Resistente y liviana. Drop de Araña Madre.' },

  { id:'potion-healing', name:'Potion of Healing', nameEs:'Poción de Curación',
    category:'magic', rarity:'common', known:true,
    desc:'Cura 2d4+2 HP. Tomar como acción bonus.' },

  // TODO magic-items: agregar ítems mágicos a medida que aparezcan en campaña.
  // Estructura futura: rarity, attunement, charges, modifiers (ej: +1 sword).
];
