/* ── CONDITIONS D&D 5E ── */

const CONDITIONS = [
  { id:'blinded', name:'Blinded', nameEs:'Cegado', icon:'👁',  color:'#6b7280',
    mechanical: { attacksDisadvantage:true, attacksAgainstAdvantage:true },
    desc:'No puede ver. Sus ataques: desventaja. Ataques contra él: ventaja. Falla checks que requieran vista.' },

  { id:'charmed', name:'Charmed', nameEs:'Encantado', icon:'💜', color:'#a855f7',
    mechanical: {},
    desc:'No puede atacar ni afectar negativamente al encantador. El encantador tiene ventaja en checks sociales contra él.' },

  { id:'deafened', name:'Deafened', nameEs:'Ensordecido', icon:'👂', color:'#6b7280',
    mechanical: {},
    desc:'No puede oír. Falla automáticamente checks que requieran oído.' },

  { id:'exhaustion', name:'Exhaustion', nameEs:'Agotamiento', icon:'😓', color:'#f97316',
    mechanical: {},
    desc:'6 niveles. Nv1: desventaja en ability checks. Nv2: velocidad mitad. Nv3: desventaja en ataques y saves. Nv4: HP max mitad. Nv5: velocidad 0. Nv6: muerte.' },

  { id:'frightened', name:'Frightened', nameEs:'Asustado', icon:'😨', color:'#f59e0b',
    mechanical: { attacksDisadvantage:true },
    desc:'Sus ataques y ability checks: desventaja mientras el origen del miedo esté en línea de visión. No puede acercarse voluntariamente al origen.' },

  { id:'grappled', name:'Grappled', nameEs:'Aferrado', icon:'🤼', color:'#84cc16',
    mechanical: { speedZero:true },
    desc:'Velocidad 0. Termina si el agresor queda incapacitado o si el objetivo es alejado por fuerza.' },

  { id:'incapacitated', name:'Incapacitated', nameEs:'Incapacitado', icon:'💤', color:'#ef4444',
    mechanical: { cantTakeActions:true, cantTakeReactions:true },
    desc:'No puede tomar acciones ni reacciones.' },

  { id:'invisible', name:'Invisible', nameEs:'Invisible', icon:'👻', color:'#94a3b8',
    mechanical: { attacksAdvantage:true, attacksAgainstDisadvantage:true },
    desc:'No puede ser visto. Sus ataques: ventaja. Ataques contra él: desventaja.' },

  { id:'paralyzed', name:'Paralyzed', nameEs:'Paralizado', icon:'⚡', color:'#facc15',
    mechanical: { cantTakeActions:true, cantTakeReactions:true, speedZero:true, attacksAgainstAdvantage:true, autoFailStrDex:true },
    desc:'Incapacitado. Velocidad 0. Falla STR y DEX saves. Ataques contra él: ventaja. Hits a melee ≤5ft: crítico automático.' },

  { id:'petrified', name:'Petrified', nameEs:'Petrificado', icon:'🪨', color:'#78716c',
    mechanical: { cantTakeActions:true, speedZero:true, attacksAgainstAdvantage:true, autoFailStrDex:true, resistanceAll:true },
    desc:'Transformado en piedra. Incapacitado. Velocidad 0. Resistencia a todo daño. Falla STR y DEX saves. Ataques contra él: ventaja.' },

  { id:'poisoned', name:'Poisoned', nameEs:'Envenenado', icon:'🤢', color:'#4ade80',
    mechanical: { attacksDisadvantage:true },
    desc:'Sus ataques y ability checks: desventaja.' },

  { id:'prone', name:'Prone', nameEs:'Derribado', icon:'⬇', color:'#f97316',
    mechanical: { attacksDisadvantage:true, attacksAgainstMeleeAdvantage:true, attacksAgainstRangedDisadvantage:true },
    desc:'Sus ataques: desventaja. Ataques melee contra él: ventaja. Ataques ranged contra él: desventaja. Levantarse cuesta mitad del movimiento.' },

  { id:'restrained', name:'Restrained', nameEs:'Restringido', icon:'🕸', color:'#fb923c',
    mechanical: {
      speedZero: true,
      attacksAgainstAdvantage: true,
      attacksDisadvantage: true,
      dexSaveDisadvantage: true
    },
    desc:'Velocidad 0. Ataques contra él: ventaja. Sus ataques: desventaja. Sus DEX saves: desventaja.' },

  { id:'stunned', name:'Stunned', nameEs:'Aturdido', icon:'💫', color:'#60a5fa',
    mechanical: { cantTakeActions:true, cantTakeReactions:true, attacksAgainstAdvantage:true, autoFailStrDex:true },
    desc:'Incapacitado. No puede moverse. Solo puede hablar con dificultad. Falla STR y DEX saves. Ataques contra él: ventaja.' },

  { id:'unconscious', name:'Unconscious', nameEs:'Inconsciente', icon:'💀', color:'#ef4444',
    mechanical: { cantTakeActions:true, speedZero:true, attacksAgainstAdvantage:true, autoFailStrDex:true, meleeCritical:true },
    desc:'Incapacitado. Velocidad 0. Cae prone. Falla STR y DEX saves. Ataques contra él: ventaja. Hits a melee ≤5ft: crítico automático.' }
];

const CONCENTRATION_META = {
  id:'concentration', name:'Concentration', nameEs:'Concentración',
  icon:'◎', color:'#fbbf24',
  desc:'Mantiene concentración en un spell. Recibir daño → CON save DC max(10, daño/2) o pierde la concentración.'
};
