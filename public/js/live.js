/* ── SESIÓN LIVE: estado, combat tracker, stream de notas, asistencia D&D ── */

let LIVE_SESSION = {
  meta: { number: 2, date: '', present: '', presentChars: null, locationId: '', locationDetail: '', active: true },
  notes: [],
  combat: { active: false, round: 1, turn: 0, participants: [] }
};

/* ── CHAR SHEET MODAL: mueve el nodo real al modal y lo devuelve al cerrar ── */
let CHAR_MODAL_STATE = null;  // { c, originalParent, originalNextSibling, originalDisplay }

/* ── COMBAT START PENDING ── */
let combatStartPending = false;
let combatStartNotes = '';

let currentForm = null;            // {type, data} cuando hay un form abierto
let currentMonsterPickerOpen = false;

/* ── HABILIDADES DE CLASE ───────────────────────────────────────────────────
   Mapa de habilidades disponibles por personaje (en nivel actual).
   Se expande automáticamente al agregar features en class-presets.js.       */
const CHAR_CLASS_ABILITIES = {
  rac:   ['rage'],
  relyo: ['flurry-of-blows', 'patient-defense', 'step-of-the-wind'],
  tyrell:['divine-smite', 'lay-on-hands', 'divine-sense'],
  boyd:  ['wild-shape'],
  esdas: []
};

const ABILITY_META = {
  'rage': {
    name:'Furia', nameEn:'Rage', action:'Bonus Action', isAction:false,
    resource:'rage', cost:1,
    desc:'Entrás en Furia por 10 rounds (1 min). Resistencia a daño físico, +daño en ataques STR melee, ventaja en STR checks/saves. No podés lanzar ni concentrarte en hechizos.'
  },
  'flurry-of-blows': {
    name:'Lluvia de Golpes', nameEn:'Flurry of Blows', action:'Bonus Action', isAction:false,
    resource:'ki', cost:1,
    desc:'Después de hacer Attack con Action: 2 golpes sin arma adicionales como Bonus Action. Cada uno requiere tirada de ataque.'
  },
  'patient-defense': {
    name:'Defensa Paciente', nameEn:'Patient Defense', action:'Bonus Action', isAction:false,
    resource:'ki', cost:1,
    desc:'Tomás Dodge hasta tu próximo turno: ataques contra vos con desventaja, tus DEX saves con ventaja.'
  },
  'step-of-the-wind': {
    name:'Paso del Viento', nameEn:'Step of the Wind', action:'Bonus Action', isAction:false,
    resource:'ki', cost:1,
    desc:'Disengage o Dash como Bonus Action. Tu distancia de salto se dobla este turno.'
  },
  'divine-smite': {
    name:'Castigo Divino', nameEn:'Divine Smite', action:'No es una acción — se activa al momento de pegar', isAction:false,
    resource:'slot',
    desc:'Al pegar con arma melee: gastá un slot. Slot Nv 1 → +2d8 radiante. +1d8 por nivel adicional del slot. +1d8 extra si el objetivo es no-muerto o infernal.'
  },
  'lay-on-hands': {
    name:'Imposición de Manos', nameEn:'Lay on Hands', action:'Action', isAction:true,
    resource:'lay-on-hands',
    desc:'Tocás una criatura y gastás HP del pool (5×nivel paladín). Podés curar HP, o gastar 5 HP del pool para purgar 1 enfermedad o veneno.'
  },
  'divine-sense': {
    name:'Sentido Divino', nameEn:'Divine Sense', action:'Action', isAction:true,
    resource:'divine-sense', cost:1,
    desc:'Hasta tu próximo turno: conocés ubicación de celestiales, infernales y no-muertos no escondidos a 60 ft. También detectás lugares u objetos consagrados/profanados.'
  },
  'wild-shape': {
    name:'Forma Salvaje', nameEn:'Wild Shape', action:'Action', isAction:true,
    resource:'wild-shape', cost:1,
    desc:'Te transformás en una bestia. Sus HP son un escudo — al llegar a 0 volvés a tu forma con los HP originales intactos. No podés lanzar hechizos nuevos (pero mantenés concentración activa).'
  }
};

/* ── STATE ── */
function loadLiveSession(){
  const stored = load('live_session', null);
  if(stored && stored.meta){
    LIVE_SESSION = stored;
    // ensure combat object
    if(!LIVE_SESSION.combat) LIVE_SESSION.combat = { active:false, round:1, turn:0, participants:[] };
    migrateNarrativeLinks();
  } else {
    // default
    LIVE_SESSION.meta.date = new Date().toISOString().slice(0,10);
  }
}

/* Migración: asignar narrativeId a notas pre-existentes que no lo tienen.
   Las notas están guardadas newest-first; recorremos en orden cronológico
   (de vieja a nueva) trackeando la narrativa abierta y asignándola a las
   siguientes no-narrativas. Solo escribe si encuentra alguna nota sin link. */
function migrateNarrativeLinks(){
  const notes = LIVE_SESSION.notes || [];
  if(notes.length === 0) return;
  const needsMigration = notes.some(n => n.type !== 'narrative' && n.narrativeId === undefined);
  if(!needsMigration) return;
  let currentNarrativeId = null;
  for(let i = notes.length - 1; i >= 0; i--){
    const n = notes[i];
    if(n.type === 'narrative'){
      currentNarrativeId = n.id;
    } else if(n.narrativeId === undefined){
      n.narrativeId = currentNarrativeId;
    }
  }
  saveLiveSession();
}

/* Devuelve el id de la narrativa más reciente en el stream (newest-first → primera con type='narrative'). */
function getCurrentNarrativeId(){
  const n = (LIVE_SESSION.notes || []).find(x => x.type === 'narrative');
  return n ? n.id : null;
}
function saveLiveSession(){
  save('live_session', LIVE_SESSION);
  if (window.DM_MODE && window._socket) window._socket.emit('live:sync', LIVE_SESSION);
}

function liveEscape(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

/* ── ID HELPERS ── */
function newId(prefix){ return prefix+'-'+Date.now()+'-'+Math.floor(Math.random()*1000); }
function nowTime(){ const d=new Date(); return d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }
function nowIso(){ return new Date().toISOString(); }

/* ── HEADER ── */
function updateLiveMeta(field, value){
  LIVE_SESSION.meta[field] = value;
  saveLiveSession();
}

/* ── COMBAT TRACKER ── */
function getCombatant(id){ return LIVE_SESSION.combat.participants.find(p=>p.id===id); }
function getAlivePlayers(){
  return LIVE_SESSION.combat.participants.filter(p=>p.kind==='player' && getCombatantHP(p)>0);
}
function getAliveMonsters(){
  return LIVE_SESSION.combat.participants.filter(p=>p.kind==='monster' && p.hp>0);
}
function getAliveTargets(){
  return LIVE_SESSION.combat.participants.filter(p=>getCombatantHP(p)>0);
}

function getCombatantHP(p){
  if(p.kind==='player'){
    // Wild Shape: devuelve HP de la bestia mientras dure la transformación
    if(p.wildShape && p.wildShape.active) return p.wildShape.beastHP;
    return load('hp_'+p.refId, getHPMax(p.refId));
  }
  return p.hp;
}
function getCombatantHPMax(p){
  if(p.kind==='player'){
    if(p.wildShape && p.wildShape.active) return p.wildShape.beastHPMax;
    return getHPMax(p.refId);
  }
  return p.hpMax;
}
function getCombatantAC(p){
  if(p.kind==='player'){
    // AC fijo en HTML (no lo tenemos en data.js). Asumimos los conocidos:
    const ACs = { rac:14, relyo:15, tyrell:18, boyd:14, esdas:15 };
    return ACs[p.refId] || 10;
  }
  return p.ac;
}
function getCombatantName(p){
  if(p.kind==='player') return p.refId.charAt(0).toUpperCase()+p.refId.slice(1);
  return p.name;
}

function toggleCombatActive(){
  if(LIVE_SESSION.combat.active){
    if(!confirm('¿Terminar combate? El round se resetea pero los combatientes y su HP se mantienen.')) return;
    LIVE_SESSION.combat.active = false;
    LIVE_SESSION.combat.round = 1;
    LIVE_SESSION.combat.turn = 0;
    LIVE_SESSION.combat.participants.forEach(p => { p.actedThisRound = false; });
    pushNote({ type:'combat', subtype:'end', notes:'Combate terminado.' });
    saveLiveSession();
    renderLive();
  } else {
    // Mostrar form de inicio → confirmStartCombat() arranca el combate
    combatStartPending = true;
    combatStartNotes = '';
    renderCombatTracker();
  }
}

function confirmStartCombat(){
  combatStartPending = false;
  LIVE_SESSION.combat.participants.sort((a,b)=>(b.initiative||0)-(a.initiative||0));
  LIVE_SESSION.combat.active = true;
  LIVE_SESSION.combat.round = 1;
  LIVE_SESSION.combat.turn = 0;
  LIVE_SESSION.combat.participants.forEach(p => { p.actedThisRound = false; });
  pushNote({ type:'combat', subtype:'start', notes: combatStartNotes.trim() || 'Combate iniciado. Round 1.' });
  saveLiveSession();
  renderLive();
}

function cancelStartCombat(){
  combatStartPending = false;
  renderCombatTracker();
}

/* ── ACT / SKIP / ROUND ── */
function actCombatant(id){
  const p = getCombatant(id); if(!p) return;
  if(p.actedThisRound){ return; }
  if(p.kind === 'player'){
    openNoteForm('action');
    currentForm.data.character = p.refId;
    currentForm.data.triggeringCombatantId = id;
    renderNoteForm();
  } else {
    // Monstruo/NPC → form de acción NPC
    currentForm = {
      type: 'npc-action',
      data: {
        combatantId: id,
        monsterPresetId: p.refId || '',
        monsterName: getCombatantName(p),
        monsterAC: getCombatantAC(p),
        actionType: 'attack-melee',
        selectedAttackIdx: null,
        weapon: '',
        damageDice: '',
        targetIds: [],
        targetCA: '',
        damageBonus: '',
        customDC: '',
        roll: '',
        modifier: '',
        damage: '',
        damageType: 'slashing',
        applyDamage: true,
        notes: ''
      }
    };
    // Si el monstruo tiene un solo ataque, pre-seleccionarlo
    if(p.refId){
      const monster = PRESET_MONSTERS.find(m=>m.id===p.refId);
      if(monster && monster.attacks && monster.attacks.length === 1){
        selectMonsterAttack(0);
      }
    }
    renderNoteForm();
  }
  // scroll al form
  setTimeout(()=>{ const el = document.getElementById('note-form-container'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }, 50);
}

function skipCombatant(id){
  const p = getCombatant(id); if(!p) return;
  currentForm = {
    type: 'skip-turn',
    data: { combatantId: id, combatantName: getCombatantName(p), notes: '' }
  };
  renderNoteForm();
  setTimeout(()=>{ const el = document.getElementById('note-form-container'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }, 50);
}

function markActed(combatantId){
  const p = getCombatant(combatantId); if(!p) return;
  p.actedThisRound = true;
  saveLiveSession();
  checkRoundComplete();
  renderCombatTracker();
}

function checkRoundComplete(){
  if(!LIVE_SESSION.combat.active) return;
  const alive = LIVE_SESSION.combat.participants.filter(p => getCombatantHP(p) > 0);
  if(alive.length === 0) return;
  if(alive.every(p => p.actedThisRound)) advanceRound();
}

function advanceRound(){
  LIVE_SESSION.combat.round++;
  const expiredMsgs = [];
  LIVE_SESSION.combat.participants.forEach(p => {
    p.actedThisRound = false;
    // Limpiar Reckless Attack (dura hasta el próximo turno)
    if(p.recklessThisTurn) p.recklessThisTurn = false;
    // Countdown de Furia de Rac
    if(p.inRage && p.kind === 'player'){
      p.rageTurnsLeft = (p.rageTurnsLeft || 1) - 1;
      if(p.rageTurnsLeft <= 0){
        p.inRage = false; p.rageTurnsLeft = 0;
        expiredMsgs.push(`😠 La Furia de Rac terminó (10 rounds cumplidos).`);
      }
    }
    // Countdown de condiciones
    if(p.conditions && p.conditions.length){
      const expired = [];
      p.conditions = p.conditions.map(c => {
        if(typeof c !== 'object' || c.turnsLeft == null) return c;
        const newLeft = c.turnsLeft - 1;
        if(newLeft <= 0){ expired.push(c); return null; }
        return { ...c, turnsLeft: newLeft };
      }).filter(Boolean);
      expired.forEach(c => expiredMsgs.push(`${getCombatantName(p)}: condición ${c.name} / ${c.nameEs} expiró.`));
    }
    // Countdown de concentración
    if(p.concentration){
      p.concentration.turnsLeft--;
      if(p.concentration.turnsLeft <= 0){
        expiredMsgs.push(`◎ Concentración de ${getCombatantName(p)} en ${p.concentration.spellName} expiró.`);
        breakConcentration(p.id);
      }
    }
  });
  const notes = 'Round '+LIVE_SESSION.combat.round+' comienza.' + (expiredMsgs.length ? '\n'+expiredMsgs.join('\n') : '');
  pushNote({ type:'combat', subtype:'next-round', notes });
  saveLiveSession();
  renderLive();
}

function forceNextRound(){
  if(!confirm('¿Forzar inicio de siguiente round? Los combatientes que no actuaron se saltan.')) return;
  advanceRound();
}

function addPlayerToCombat(c){
  if(LIVE_SESSION.combat.participants.find(p=>p.kind==='player' && p.refId===c)) return;
  LIVE_SESSION.combat.participants.push({
    id: newId('cmb-pj-'+c),
    kind:'player', refId:c, initiative:0, conditions:[], actedThisRound:false
  });
  saveLiveSession();
  renderCombatTracker();
}

function addAllPlayersToCombat(){
  const inCombat = LIVE_SESSION.combat.participants.filter(p=>p.kind==='player').map(p=>p.refId);
  const toAdd = (LIVE_SESSION.meta.presentChars || CHARS).filter(c => !inCombat.includes(c));
  if(toAdd.length === 0){ alert('Todos los personajes presentes ya están en combate.'); return; }
  toAdd.forEach(c => {
    LIVE_SESSION.combat.participants.push({
      id: newId('cmb-pj-'+c),
      kind:'player', refId:c, initiative:0, conditions:[], actedThisRound:false
    });
  });
  saveLiveSession();
  renderCombatTracker();
}

function openPlayerPicker(){
  const inCombat = LIVE_SESSION.combat.participants.filter(p=>p.kind==='player').map(p=>p.refId);
  const available = CHARS.filter(c=>!inCombat.includes(c));
  if(available.length === 0){ alert('Todos los personajes ya están en combate.'); return; }
  const choice = prompt('¿Qué personaje agregar?\n'+available.map((c,i)=>(i+1)+'. '+c.charAt(0).toUpperCase()+c.slice(1)).join('\n')+'\n\nEscribí el número:');
  const idx = parseInt(choice)-1;
  if(idx>=0 && idx<available.length) addPlayerToCombat(available[idx]);
}

function openMonsterPicker(){
  if(!Array.isArray(MONSTERS) || MONSTERS.length===0){ alert('No hay monstruos en el Bestiario.'); return; }
  currentMonsterPickerOpen = true;
  renderLive();
}

function closeMonsterPicker(){
  currentMonsterPickerOpen = false;
  renderLive();
}

function addMonsterFromBestiary(monsterId, count){
  const m = MONSTERS.find(x=>x.id===monsterId);
  if(!m) return;
  count = parseInt(count) || 1;
  for(let i=0; i<count; i++){
    LIVE_SESSION.combat.participants.push({
      id: newId('cmb-'+m.id), kind:'monster', refId:m.id,
      name: count>1 ? `${m.name} #${i+1}` : m.name,
      hp: m.hpMax, hpMax: m.hpMax, ac: m.ac,
      initiative: 0, conditions: [], actedThisRound: false
    });
  }
  closeMonsterPicker();
  saveLiveSession();
  renderCombatTracker();
}

function addAdhocMonster(){
  const name = prompt('Nombre del enemigo:');
  if(!name) return;
  const hp = parseInt(prompt('HP máximo:', '10'))||10;
  const ac = parseInt(prompt('CA:', '12'))||12;
  const count = parseInt(prompt('¿Cuántos? (1 por defecto)', '1'))||1;
  for(let i=0; i<count; i++){
    LIVE_SESSION.combat.participants.push({
      id: newId('cmb-adhoc'),
      kind:'monster',
      refId:'adhoc',
      name: count>1 ? `${name} #${i+1}` : name,
      hp, hpMax:hp, ac, initiative:0, conditions:[], actedThisRound:false
    });
  }
  saveLiveSession();
  renderCombatTracker();
}

/* ── WILD SHAPE ── */
function endWildShape(combatantId, fromDamage, overflowDmg){
  const p = getCombatant(combatantId); if(!p || !p.wildShape) return;
  const ws = p.wildShape;
  const beastName = ws.beastName;
  const restoredHP = ws.originalHP;
  // Restaurar HP original de Boyd
  save('hp_boyd', restoredHP);
  const inp = document.getElementById('boyd-hp');
  if(inp){ inp.value = restoredHP; if(typeof updateHP === 'function') updateHP('boyd'); }
  // Aplicar overflow damage si lo hubo
  if(fromDamage && overflowDmg > 0){
    const newHP = Math.max(0, restoredHP - overflowDmg);
    save('hp_boyd', newHP);
    if(inp){ inp.value = newHP; if(typeof updateHP === 'function') updateHP('boyd'); }
  }
  p.wildShape = null;
  renderPresentsGrid();
  pushNote({
    type:'class-ability', character:'boyd', abilityKey:'wild-shape-end',
    abilityName:'Forma Salvaje termina', beastName,
    notes: fromDamage
      ? `🐺 La Forma Salvaje de Boyd (${beastName}) llega a 0 HP. Boyd vuelve a su forma original (HP ${restoredHP}).${overflowDmg>0?` Recibe ${overflowDmg} de daño overflow.`:''}`
      : `🐺 Boyd sale voluntariamente de la Forma Salvaje (${beastName}). Vuelve con ${restoredHP} HP.`
  });
  saveLiveSession();
  renderLive();
}
function endWildShapeBtn(combatantId){
  if(!confirm('¿Boyd sale de Forma Salvaje? Vuelve a su forma original con sus HP intactos.')) return;
  endWildShape(combatantId, false, 0);
}
function changeWildShapeHP(id, delta){
  const p = getCombatant(id); if(!p || !p.wildShape || !p.wildShape.active) return;
  const newHP = Math.max(0, Math.min(p.wildShape.beastHPMax, p.wildShape.beastHP + delta));
  const overflow = (p.wildShape.beastHP + delta < 0) ? Math.abs(p.wildShape.beastHP + delta) : 0;
  p.wildShape.beastHP = newHP;
  if(newHP <= 0) endWildShape(id, true, overflow);
  else { saveLiveSession(); renderCombatTracker(); }
}
function setWildShapeHP(id, val){
  const p = getCombatant(id); if(!p || !p.wildShape || !p.wildShape.active) return;
  const n = Math.max(0, Math.min(p.wildShape.beastHPMax, parseInt(val)||0));
  p.wildShape.beastHP = n;
  if(n <= 0) endWildShape(id, true, 0);
  else { saveLiveSession(); renderCombatTracker(); }
}

/* ── RAGE ── */
function endRageBtn(combatantId){
  if(!confirm('¿Terminar la Furia de Rac?')) return;
  const p = getCombatant(combatantId); if(!p) return;
  p.inRage = false;
  p.rageTurnsLeft = 0;
  p.recklessThisTurn = false;
  pushNote({ type:'combat', subtype:'other', notes:'😠 Furia de Rac termina.' });
  saveLiveSession();
  renderLive();
}

function combatantCardClick(e, charId){
  // Solo activo en modo jugador y en pantalla angosta (mobile/responsive)
  if(document.body.classList.contains('dm-mode')) return;
  if(window.innerWidth > 900) return;
  if(e.target.closest('button,input,select')) return;
  openCharSheetModal(charId);
}

function removeCombatant(id){
  if(!confirm('¿Sacar del combate?')) return;
  LIVE_SESSION.combat.participants = LIVE_SESSION.combat.participants.filter(p=>p.id!==id);
  if(LIVE_SESSION.combat.turn >= LIVE_SESSION.combat.participants.length){
    LIVE_SESSION.combat.turn = 0;
  }
  saveLiveSession();
  renderCombatTracker();
}

function changeCombatantHP(id, delta){
  const p = getCombatant(id); if(!p) return;
  if(p.kind==='player'){
    // Wild Shape: el daño va a los HP de la bestia primero
    if(p.wildShape && p.wildShape.active && delta < 0){
      const newBeastHP = Math.max(0, p.wildShape.beastHP + delta);
      const overflow = (p.wildShape.beastHP + delta < 0) ? Math.abs(p.wildShape.beastHP + delta) : 0;
      p.wildShape.beastHP = newBeastHP;
      if(newBeastHP <= 0){
        endWildShape(id, true, overflow);
        return;
      }
      // CON save de concentración si está concentrado
      if(delta < 0 && p.concentration){
        const dmg = Math.abs(delta);
        const dc = Math.max(10, Math.floor(dmg / 2));
        const scores = ABILITY_SCORES[p.refId];
        const conMod = scores ? abilityMod(scores.con) : 0;
        const modLabel = conMod >= 0 ? `+${conMod}` : String(conMod);
        const charName = p.refId.charAt(0).toUpperCase() + p.refId.slice(1);
        setTimeout(() => {
          const rollStr = prompt(
            `⚠ ${charName} (en Forma Salvaje) recibió ${dmg} de daño mientras concentrado en ${p.concentration.spellName}.\n\nCON save DC ${dc}\nMod CON de ${charName}: ${modLabel}\n\nTirada d20:`
          );
          if(rollStr === null) return;
          const roll = parseInt(rollStr) || 0;
          const total = roll + conMod;
          if(total >= dc){
            alert(`✓ Mantiene la concentración en ${p.concentration.spellName}. (${roll}${modLabel} = ${total} ≥ DC ${dc})`);
          } else {
            alert(`✗ Pierde la concentración en ${p.concentration.spellName}. (${roll}${modLabel} = ${total} < DC ${dc})`);
            breakConcentration(p.id);
          }
        }, 100);
      }
      saveLiveSession();
      renderCombatTracker();
      return;
    }
    const cur = load('hp_'+p.refId, getHPMax(p.refId));
    const next = Math.max(0, Math.min(getHPMax(p.refId), cur + delta));
    save('hp_'+p.refId, next);
    const inp = document.getElementById(p.refId+'-hp');
    if(inp){ inp.value = next; updateHP(p.refId); }
    renderPresentsGrid();
    // CON save de concentración si recibió daño y está concentrado
    if(delta < 0 && p.concentration){
      const dmg = Math.abs(delta);
      const dc = Math.max(10, Math.floor(dmg / 2));
      const scores = ABILITY_SCORES[p.refId];
      const conMod = scores ? abilityMod(scores.con) : 0;
      const modLabel = conMod >= 0 ? `+${conMod}` : String(conMod);
      const charName = p.refId.charAt(0).toUpperCase() + p.refId.slice(1);
      const spellName = p.concentration.spellName;
      setTimeout(() => {
        const rollStr = prompt(
          `⚠ ${charName} recibió ${dmg} de daño mientras concentrado en ${spellName}.\n\nCON save DC ${dc} (max 10, ${dmg}÷2)\nMod CON de ${charName}: ${modLabel}\n\nIngresá la tirada d20 (solo el dado, el mod se suma automáticamente):`
        );
        if(rollStr === null) return; // canceló
        const roll = parseInt(rollStr) || 0;
        const total = roll + conMod;
        if(total >= dc){
          alert(`✓ ${charName} mantiene la concentración en ${spellName}. (${roll}${modLabel} = ${total} ≥ DC ${dc})`);
        } else {
          alert(`✗ ${charName} pierde la concentración en ${spellName}. (${roll}${modLabel} = ${total} < DC ${dc})`);
          breakConcentration(p.id);
        }
      }, 100);
    }
  } else {
    p.hp = Math.max(0, Math.min(p.hpMax, p.hp + delta));
  }
  saveLiveSession();
  renderCombatTracker();
}

function setCombatantHP(id, val){
  const p = getCombatant(id); if(!p) return;
  const n = Math.max(0, parseInt(val)||0);
  if(p.kind==='player'){
    const capped = Math.min(getHPMax(p.refId), n);
    save('hp_'+p.refId, capped);
    const inp = document.getElementById(p.refId+'-hp');
    if(inp){ inp.value = capped; updateHP(p.refId); }
    renderPresentsGrid();
  } else {
    p.hp = Math.min(p.hpMax, n);
  }
  saveLiveSession();
  renderCombatTracker();
}

function setCombatantInit(id, val){
  const p = getCombatant(id); if(!p) return;
  p.initiative = parseInt(val)||0;
  saveLiveSession();
}

/* Condiciones como objetos estructurados:
   { id, name, turnsLeft, sourceSpell, sourceId }
   turnsLeft: null = permanente (manual), número = expira al llegar a 0 */

function setCombatantCondition(combatantId, conditionsStr){
  const p = getCombatant(combatantId); if(!p) return;
  // Preservar condiciones estructuradas existentes que no están en el string manual
  const structured = (p.conditions||[]).filter(c => typeof c === 'object' && c.turnsLeft != null);
  // Parsear el string manual → objetos simples (permanentes)
  const manual = conditionsStr.split(',').map(s=>s.trim()).filter(Boolean)
    .map(s => {
      const cond = CONDITIONS.find(c=>c.name.toLowerCase()===s.toLowerCase() || c.nameEs.toLowerCase()===s.toLowerCase() || c.id===s.toLowerCase());
      return cond ? { id:cond.id, name:cond.name, nameEs:cond.nameEs, turnsLeft:null } : { id:'custom', name:s, nameEs:s, turnsLeft:null };
    });
  p.conditions = [...structured, ...manual];
  saveLiveSession();
  renderCombatTracker();
}

/* Aplica una condición estructurada a un combatiente */
function applyCondition(combatantId, conditionId, turnsLeft, sourceSpell, sourceId){
  const p = getCombatant(combatantId); if(!p) return;
  const cond = getCondition(conditionId);
  if(!cond) return;
  // No duplicar — si ya tiene la condición, actualizar turnsLeft
  const existing = (p.conditions||[]).findIndex(c => c.id === conditionId);
  const obj = { id:cond.id, name:cond.name, nameEs:cond.nameEs, turnsLeft, sourceSpell:sourceSpell||null, sourceId:sourceId||null };
  if(existing >= 0) p.conditions[existing] = obj;
  else p.conditions = [...(p.conditions||[]), obj];
  saveLiveSession();
  renderCombatTracker();
}

/* Quita una condición de un combatiente */
function removeCondition(combatantId, conditionId){
  const p = getCombatant(combatantId); if(!p) return;
  p.conditions = (p.conditions||[]).filter(c => c.id !== conditionId);
  saveLiveSession();
  renderCombatTracker();
}

/* Helpers para consultar condiciones activas */
function hasCondition(p, conditionId){
  return (p.conditions||[]).some(c => (typeof c === 'object' ? c.id : c) === conditionId);
}
function getConditionIds(p){
  return (p.conditions||[]).map(c => typeof c === 'object' ? c.id : c.toLowerCase());
}

/* Concentración: aplica al caster */
function applyConcentration(combatantId, spellName, turnsLeft){
  const p = getCombatant(combatantId); if(!p) return;
  p.concentration = { spellName, turnsLeft };
  saveLiveSession();
  renderCombatTracker();
}

/* Rompe la concentración del caster y quita condiciones vinculadas */
function breakConcentration(combatantId){
  const p = getCombatant(combatantId); if(!p) return;
  const spell = p.concentration ? p.concentration.spellName : null;
  p.concentration = null;
  // Quitar condiciones en otros combatientes con sourceSpell = ese spell
  if(spell){
    LIVE_SESSION.combat.participants.forEach(target => {
      target.conditions = (target.conditions||[]).filter(c => !(typeof c==='object' && c.sourceSpell===spell));
    });
    pushNote({ type:'combat', subtype:'other', notes:`◎ Concentración de ${getCombatantName(p)} en ${spell} se rompe. Las condiciones aplicadas se quitan.` });
  }
  saveLiveSession();
  renderCombatTracker();
}

/* ── NOTES STREAM ── */
function pushNote(noteData){
  const note = {
    id: newId('note'),
    timestamp: nowIso(),
    timeLabel: nowTime(),
    ...noteData
  };
  // Asociar automáticamente a la narrativa activa (excepto si la nota misma ES una narrativa
  // o una nota de combate puramente técnica como start/end/next-round que viven fuera del hilo).
  if(note.type !== 'narrative'){
    if(note.narrativeId === undefined){
      note.narrativeId = getCurrentNarrativeId();
    }
  }
  LIVE_SESSION.notes.unshift(note); // newest first
  saveLiveSession();
}

function deleteNote(id){
  if(!confirm('¿Borrar esta nota?')) return;

  const noteToDelete = (LIVE_SESSION.notes || []).find(n => n.id === id);
  LIVE_SESSION.notes = LIVE_SESSION.notes.filter(n => n.id !== id);
  saveLiveSession();

  // Si la nota borrada era narrativa vinculada a un evento, revertir el evento
  // a "planned" SOLO si no queda ninguna otra nota narrativa vinculada a ese evento.
  if(noteToDelete && noteToDelete.type === 'narrative' && noteToDelete.eventId && typeof CAMPAIGN !== 'undefined'){
    const stillLinked = (LIVE_SESSION.notes || []).some(n =>
      n.type === 'narrative' && n.eventId === noteToDelete.eventId
    );
    if(!stillLinked){
      const e = CAMPAIGN.events.find(x => x.id === noteToDelete.eventId);
      if(e && e.status === 'in-progress'){
        e.status = 'planned';
        fetch(`/api/events/${noteToDelete.eventId}`, {
          method:'PUT', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({status:'planned'})
        }).catch(err => console.error(err));
        if(typeof renderEvents === 'function') renderEvents();
      }
    }
  }

  renderNotesStream();
}

/* ── ASISTENCIA D&D ── */
function isNat20(roll){ return parseInt(roll)===20; }
function isNat1(roll){ return parseInt(roll)===1; }
function computeOutcome(total, threshold, isAttack){
  if(threshold == null || threshold === '') return null;
  const t = parseInt(threshold);
  if(isAttack){
    return total >= t ? 'hit' : 'miss';
  }
  return total >= t ? 'pass' : 'fail';
}

/* ── NOTE FORM (apertura, cierre, render) ── */
function openNoteForm(type){
  currentForm = {
    type,
    data: getDefaultFormData(type)
  };
  renderNoteForm();
}

function closeNoteForm(){
  currentForm = null;
  renderNoteForm();
}

function getDefaultFormData(type){
  if(type==='action'){
    return {
      character: CHARS[0],
      actionType: 'attack-melee',
      weapon: '',
      weaponId: '',
      damageDice: '',
      skill: '',
      save: 'str',
      spellName: '',
      spellLevel: 1,
      cantripName: '',
      roll: '',
      modifier: '',
      targetIds: [],
      customDC: '',
      isSaveSpell: false,
      saveType: '',
      saveDC: '',
      halfOnSave: false,
      targetCA: '',
      damageBonus: '',
      targetSaveRolls: {},
      targetSaveOverrides: {},
      damage: '',
      damageType: 'slashing',
      applyDamage: true,
      recklessAttack: false,
      notes: ''
    };
  }
  if(type==='conversation'){
    return {
      npcId: NPC_IDS[0],
      otherName: '',
      context: '',
      exchanges: [
        { speaker: NPC_IDS[0], speakerKind:'npc', text:'' }
      ]
    };
  }
  // legacy alias — formularios antiguos quedan compatibles
  if(type==='npc'){
    return { npcId: NPC_IDS[0], otherName:'', dialogue:'', reaction:'' };
  }
  if(type==='combat'){
    return { subtype:'other', notes:'' };
  }
  if(type==='class-ability'){
    return { character: CHARS[0], abilityKey:'', beastId:'', beastName:'', beastHP:'', healAmount:'', targetId:'', slotLevel:1, notes:'' };
  }
  return { eventId:'', title:'', text:'' };
}

function updateFormField(field, value){
  if(!currentForm) return;
  const prev = currentForm.data[field];
  currentForm.data[field] = value;
  // Al cambiar personaje o tipo de acción, limpiar dados/modificador para que el auto-fill funcione limpio
  if(field === 'character' || field === 'actionType'){
    currentForm.data.damageDice = '';
    currentForm.data.modifier = '';
    currentForm.data.damageType = 'slashing';
    currentForm.data.weaponId = '';
    currentForm.data.spellName = '';
    currentForm.data.cantripName = '';
    currentForm.data.targetCA = '';
    currentForm.data.damageBonus = '';
    currentForm.data.targetIds = [];
  }
  if(currentForm.type === 'class-ability' && field === 'character'){
    currentForm.data.abilityKey = '';
    currentForm.data.beastId = ''; currentForm.data.beastName = ''; currentForm.data.beastHP = '';
    currentForm.data.healAmount = ''; currentForm.data.targetId = '';
  }
  if(['character','actionType','spellName','cantripName','skill','save'].includes(field)){
    renderNoteForm();
  } else if(currentForm.type === 'class-ability'){
    // Solo re-renderizar si el campo cambia la estructura del form
    const ABILITY_STRUCTURAL_FIELDS = ['character','abilityKey','slotLevel','windOption'];
    if(ABILITY_STRUCTURAL_FIELDS.includes(field)) renderNoteForm();
    // Si no, solo actualizar el dato (los inputs de texto/número no re-renderizan)
  } else if(currentForm.type === 'npc-action' && field === 'actionType'){
    renderNoteForm();
  } else {
    updateFormAssistance();
    updateNpcActionAssistance();
  }
}

function updateFormAssistance(){
  if(!currentForm || currentForm.type !== 'action') return;
  const d = currentForm.data;
  const roll = parseInt(d.roll)||0;
  const mod = parseInt(d.modifier)||0;
  const total = roll + mod;

  const totalEl = document.getElementById('form-total');
  if(totalEl) totalEl.textContent = (d.roll==='' || d.roll==null) ? '—' : total;

  // Main outcome badge (single-target attack layout)
  const mainOutcomeEl = document.getElementById('result-outcome-main');
  if(mainOutcomeEl){
    const ca = parseInt(d.targetCA)||0;
    let txt='—', cls='';
    if(d.roll!==''&&d.roll!=null){
      if(isNat20(d.roll)){txt=`★ CRÍTICO — NAT 20! (total: ${total})`;cls='nat20';}
      else if(isNat1(d.roll)){txt=`✗ PIFIA — NAT 1 (total: ${total})`;cls='nat1';}
      else if(ca){const h=total>=ca;txt=h?`HIT! — ${total} ≥ CA ${ca}`:`MISS — ${total} < CA ${ca}`;cls=h?'hit':'miss';}
      else{txt=`Total: ${total}`;}
    }
    mainOutcomeEl.textContent=txt;
    mainOutcomeEl.className='result-outcome-main'+( cls?' '+cls:'');
  }

  // Damage total display
  const dmgTotalEl = document.getElementById('damage-total');
  if(dmgTotalEl){
    const die = parseInt(d.damage);
    const bon = parseInt(d.damageBonus)||0;
    dmgTotalEl.textContent = (!isNaN(die) && d.damage!=='') ? String(die+bon) : '—';
  }

  // HP preview (single-target attack / heal)
  const hpEl = document.getElementById('result-hp-preview');
  if(hpEl){
    const tid = (d.targetIds||[])[0];
    const p = tid ? getCombatant(tid) : null;
    const isHeal = d.damageType === 'healing';
    const dieV = parseInt(d.damage);
    const dmg = isHeal ? (parseInt(d.damage)||0) : ((isNaN(dieV)||d.damage==='') ? 0 : dieV + (parseInt(d.damageBonus)||0));
    if(p && dmg > 0 && d.applyDamage){
      const curHP=getCombatantHP(p), maxHP=getCombatantHPMax(p);
      if(isHeal){
        const newHP=Math.min(maxHP,curHP+dmg);
        hpEl.innerHTML=`${liveEscape(getCombatantName(p))}: HP ${curHP} → <strong class="hp-healed">${newHP}</strong> / ${maxHP}`;
      } else {
        const ca=parseInt(d.targetCA)||0;
        const willApply=isNat20(d.roll)||(d.roll!==''&&d.roll!=null&&!isNat1(d.roll)&&ca&&total>=ca);
        if(willApply){
          const newHP=Math.max(0,curHP-dmg);
          hpEl.innerHTML=`${liveEscape(getCombatantName(p))}: HP ${curHP} → <strong class="${newHP===0?'hp-zero':''}">${newHP}</strong> / ${maxHP}`;
        } else {
          hpEl.innerHTML=d.roll!==''&&d.roll!=null?`<span class="muted">MISS — sin daño.</span>`:'';
        }
      }
    } else if(!p || dmg===0){
      hpEl.innerHTML='';
    }
  }
}

function spellRequiresAttack(spellName, c){
  if(!spellName) return false;
  const s = (CLASS_PRESETS[c]?.spellList||[]).find(x=>x.name===spellName);
  if(!s) return false;
  // Heurística: si shape menciona "spell attack" o "dardos" o "Toque"/"melee", es ataque
  const sh = (s.shape||'').toLowerCase();
  return sh.includes('attack') || sh.includes('toque') || sh.includes('dardos') || sh.includes('melee');
}
function cantripRequiresAttack(cantripName, c){
  if(!cantripName) return false;
  const cn = (CLASS_PRESETS[c]?.cantripsData||[]).find(x=>x.name===cantripName);
  if(!cn) return false;
  const sh = (cn.shape||'').toLowerCase();
  return sh.includes('attack');
}

/* ── CLASS ABILITY HELPERS ── */
function getAbilityResourceStatus(charId, abilityKey){
  const meta = ABILITY_META[abilityKey];
  if(!meta) return { available: true, label: '', warn: false };
  const c = charId;
  const lvl = getCharLevel(c);

  if(abilityKey === 'rage'){
    const used = load('resource_'+c+'_rage', 0);
    const max  = getResourceMax(c, 'rage', lvl);
    const avail = Math.max(0, max - used);
    return { available: avail > 0, label: `Furias: ${avail}/${max}`, warn: avail === 0 };
  }
  if(abilityKey === 'flurry-of-blows' || abilityKey === 'patient-defense' || abilityKey === 'step-of-the-wind'){
    const used = load('resource_'+c+'_ki', 0);
    const max  = getResourceMax(c, 'ki', lvl);
    const avail = Math.max(0, max - used);
    return { available: avail >= meta.cost, label: `Ki: ${avail}/${max}`, warn: avail < meta.cost };
  }
  if(abilityKey === 'divine-sense'){
    const used = load('resource_'+c+'_divine-sense', 0);
    const max  = getResourceMax(c, 'divine-sense', lvl);
    const avail = Math.max(0, max - used);
    return { available: avail > 0, label: `Usos: ${avail}/${max}`, warn: avail === 0 };
  }
  if(abilityKey === 'lay-on-hands'){
    const poolMax = getResourceMax(c, 'lay-on-hands', lvl);
    const poolUsed = load('resource_'+c+'_lay-on-hands', 0);
    const poolLeft = Math.max(0, poolMax - poolUsed);
    return { available: poolLeft > 0, label: `Pool: ${poolLeft}/${poolMax} HP`, warn: poolLeft === 0 };
  }
  if(abilityKey === 'divine-smite'){
    // Verifica si hay algún slot disponible
    const slots = getSpellSlotsForLevel(c, lvl);
    let anySlot = false;
    Object.keys(slots).forEach(lv => {
      const state = loadSlotState(c, parseInt(lv));
      if(state.max - state.used > 0) anySlot = true;
    });
    return { available: anySlot, label: anySlot ? 'Slots disponibles' : 'Sin slots', warn: !anySlot };
  }
  if(abilityKey === 'wild-shape'){
    const p = LIVE_SESSION.combat.participants.find(x=>x.kind==='player'&&x.refId===c);
    if(p && p.wildShape && p.wildShape.active) return { available: false, label: '🐺 En Forma Salvaje', warn: false };
    const used = load('resource_'+c+'_wild-shape', 0);
    const max  = getResourceMax(c, 'wild-shape', lvl);
    const avail = Math.max(0, max - used);
    return { available: avail > 0, label: `Usos: ${avail}/${max}`, warn: avail === 0 };
  }
  return { available: true, label: '', warn: false };
}

function renderClassAbilityForm(){
  const d = currentForm.data;
  const c = d.character;
  const abilities = CHAR_CLASS_ABILITIES[c] || [];
  const lvl = getCharLevel(c);

  // Combatiente player actual (para rage state etc)
  const combatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===c);

  const charOpts = CHARS.map(ch=>`<option value="${ch}" ${ch===c?'selected':''}>${ch.charAt(0).toUpperCase()+ch.slice(1)}</option>`).join('');

  let abilityOpts = '<option value="">— elegir habilidad —</option>';
  abilities.forEach(key => {
    const meta = ABILITY_META[key]; if(!meta) return;
    const rs = getAbilityResourceStatus(c, key);
    const tag = rs.label ? ` · ${rs.label}` : '';
    abilityOpts += `<option value="${key}" ${d.abilityKey===key?'selected':''}>${meta.name} / ${meta.nameEn}${tag}</option>`;
  });

  const meta = d.abilityKey ? ABILITY_META[d.abilityKey] : null;
  const rs   = d.abilityKey ? getAbilityResourceStatus(c, d.abilityKey) : null;

  const warnHTML = (rs && rs.warn) ? `<div class="form-warn">⚠ Sin recursos disponibles para esta habilidad. Podés guardar la nota igual.</div>` : '';

  const specificHTML = (d.abilityKey && meta) ? renderAbilitySpecificFields(c, d.abilityKey, d, lvl, combatant) : '';

  return `
    <div class="note-form class-ability-form">
      <div class="form-title">⚡ Habilidad de clase</div>

      <div class="form-grid-halves">
        <div class="form-row">
          <label>Personaje</label>
          <select class="form-input" onchange="updateFormField('character', this.value)">${charOpts}</select>
        </div>
        <div class="form-row">
          <label>Habilidad</label>
          <select class="form-input" onchange="updateFormField('abilityKey', this.value)">${abilityOpts}</select>
        </div>
      </div>

      ${meta ? `<div class="ability-info-box">
        <span class="ability-action-tag ${meta.isAction ? 'is-action' : meta.action.startsWith('Bonus') ? 'is-bonus' : 'is-free'}">${meta.isAction ? '🔵 Action' : meta.action.startsWith('Bonus') ? '🟡 Bonus Action' : '🟣 '+meta.action}</span>
        ${meta.isAction
          ? `<span class="ability-turn-warning">Gasta el turno — no puede hacer otra Action después</span>`
          : meta.action.startsWith('Bonus')
            ? `<span class="ability-turn-ok">Puede hacer una Action normal en el mismo turno</span>`
            : `<span class="ability-turn-ok">No consume acción — se usa en el momento en que el ataque pega</span>`}
        <div class="ability-desc" style="margin-top:0.4rem">${meta.desc}</div>
      </div>` : ''}

      ${warnHTML}
      ${specificHTML}

      <div class="form-row">
        <label>Notas / descripción (opcional)</label>
        <textarea class="form-input form-textarea" placeholder="Cómo lo usa, qué pasa narrativamente..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes||'')}</textarea>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveClassAbilityNote()">Usar habilidad</button>
      </div>
    </div>
  `;
}

function renderAbilitySpecificFields(c, abilityKey, d, lvl, combatant){
  const DISCLAIMER_VENTAJA = `<div class="disclaimer-box">🎲 Tirá 2d20 físicos y elegí el mayor (ventaja).</div>`;
  const DISCLAIMER_DESVENTAJA = `<div class="disclaimer-box">🎲 Tirá 2d20 físicos y elegí el menor (desventaja).</div>`;

  if(abilityKey === 'rage'){
    const isInRage = !!(combatant && combatant.inRage);
    const rageBonus = getRageDamageBonus(lvl);
    if(isInRage){
      return `<div class="ability-rage-active">
        😠 <strong>Rac ya está en Furia</strong> — bonus de daño +${rageBonus} activo.
        <br><button class="btn-small btn-danger" style="margin-top:0.5rem" onclick="endRageBtn('${combatant?combatant.id:''}')">Terminar Furia</button>
      </div>`;
    }
    const used = load('resource_rac_rage', 0);
    const max  = getResourceMax('rac', 'rage', lvl);
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Duración: 1 minuto (10 rounds) · Bonus daño STR/melee: <strong>+${rageBonus}</strong></div>
      <div class="ability-stat-line">Resistencia a daño físico (slashing/piercing/bludgeoning) mientras esté en Furia.</div>
      ${DISCLAIMER_VENTAJA}
      <div class="ability-stat-line muted">Furias restantes: ${Math.max(0,max-used)}/${max}</div>
    </div>`;
  }

  if(abilityKey === 'flurry-of-blows'){
    const die = getMartialArtsDie(lvl);
    const dex  = abilityMod(ABILITY_SCORES.relyo.dex);
    const prof  = getCharProfBonus('relyo');
    const atk  = dex + prof;
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Bonus Action post-ataque: 2 ataques adicionales con artes marciales.</div>
      <div class="ability-grid-2">
        <div><label>Golpe 1 — Tirada d20</label><input type="number" class="form-input" min="1" max="20" placeholder="1-20" value="${liveEscape(d.flurryRoll1||'')}" oninput="updateFormField('flurryRoll1',this.value)"></div>
        <div><label>Golpe 2 — Tirada d20</label><input type="number" class="form-input" min="1" max="20" placeholder="1-20" value="${liveEscape(d.flurryRoll2||'')}" oninput="updateFormField('flurryRoll2',this.value)"></div>
      </div>
      <div class="ability-stat-line muted">Modificador de ataque: +${atk} (DEX ${dex>=0?'+':''}${dex} + Prof ${prof}) · Daño: 1d${die}+${dex>=0?dex:dex} (unarmed)</div>
      ${renderCombatantsTargetPicker(d, 'Objetivo', 'targetId')}
    </div>`;
  }

  if(abilityKey === 'patient-defense'){
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Bonus Action: Relyo entra en Dodge hasta el inicio de su próximo turno.</div>
      <div class="ability-stat-line">Los atacantes tienen <strong>desventaja</strong> contra Relyo. Relyo tiene <strong>ventaja</strong> en saves DEX.</div>
      ${DISCLAIMER_DESVENTAJA}
    </div>`;
  }

  if(abilityKey === 'step-of-the-wind'){
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Bonus Action: Relyo usa Disengage o Dash (elegir uno).</div>
      <div class="form-row" style="margin-top:0.5rem">
        <label>Opción</label>
        <select class="form-input" onchange="updateFormField('windOption',this.value)">
          <option value="disengage" ${(d.windOption||'disengage')==='disengage'?'selected':''}>Disengage — alejarse sin provocar AoO</option>
          <option value="dash" ${d.windOption==='dash'?'selected':''}>Dash — doble movimiento</option>
        </select>
      </div>
      <div class="ability-stat-line">Salto en distancia también se duplica.</div>
    </div>`;
  }

  if(abilityKey === 'divine-smite'){
    const slots = getSpellSlotsForLevel('tyrell', lvl);
    const slotOpts = Object.keys(slots).map(lv => {
      const state = loadSlotState('tyrell', parseInt(lv));
      const avail = state.max - state.used;
      const radDice = 2 + (parseInt(lv)-1);
      return `<option value="${lv}" ${parseInt(d.slotLevel)===parseInt(lv)?'selected':''}>Nivel ${lv} · ${radDice}d8 radiante (${avail}/${state.max} disp.)</option>`;
    }).join('');
    const dice = 2 + (parseInt(d.slotLevel||1)-1);
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Al pegar un ataque: gastar slot para agregar daño radiante.</div>
      <div class="form-row">
        <label>Nivel del slot</label>
        <select class="form-input" onchange="updateFormField('slotLevel',this.value)">${slotOpts}</select>
      </div>
      <div class="ability-stat-line">Daño: <strong>${dice}d8 radiante</strong>${d.slotLevel>1?' (upcast)':''}</div>
      ${renderCombatantsTargetPicker(d, 'Objetivo golpeado', 'targetId')}
      <div class="form-row">
        <label>Tirada de daño radiante (${dice}d8)</label>
        <input type="number" class="form-input" placeholder="ej: 14" value="${liveEscape(d.smiteDmg||'')}" oninput="updateFormField('smiteDmg',this.value)">
      </div>
    </div>`;
  }

  if(abilityKey === 'lay-on-hands'){
    const poolMax = getResourceMax('tyrell', 'lay-on-hands', lvl);
    const poolUsed = load('resource_tyrell_lay-on-hands', 0);
    const poolLeft = Math.max(0, poolMax - poolUsed);
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Pool de curación: <strong>${poolLeft} HP</strong> restantes de ${poolMax} (se recarga en descanso largo).</div>
      ${renderCombatantsTargetPicker(d, 'Objetivo a curar', 'targetId')}
      <div class="form-row">
        <label>HP a restaurar (máx. ${poolLeft})</label>
        <input type="number" class="form-input" placeholder="ej: 5" min="1" max="${poolLeft}" value="${liveEscape(d.healAmount||'')}" oninput="updateFormField('healAmount',this.value)">
      </div>
      <div class="ability-stat-line muted">Alternativamente: gastar 5 HP del pool para curar 1 enfermedad o veneno.</div>
    </div>`;
  }

  if(abilityKey === 'divine-sense'){
    const used = load('resource_tyrell_divine-sense', 0);
    const max  = getResourceMax('tyrell', 'divine-sense', lvl);
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Acción: Tyrell percibe la presencia de criaturas celestiales, infernales o no-muertas a 60 ft.</div>
      <div class="ability-stat-line">También detecta lugares consagrados o profanados. Dura hasta el final del turno.</div>
      <div class="ability-stat-line muted">Usos restantes: ${Math.max(0,max-used)}/${max} (recarga en descanso largo)</div>
    </div>`;
  }

  if(abilityKey === 'wild-shape'){
    if(combatant && combatant.wildShape && combatant.wildShape.active){
      const ws = combatant.wildShape;
      return `<div class="ability-rage-active">
        🐺 <strong>Boyd ya está en Forma Salvaje</strong> como ${liveEscape(ws.beastName)} (HP: ${ws.beastHP}/${ws.beastHPMax}).
        <br><button class="btn-small btn-danger" style="margin-top:0.5rem" onclick="endWildShapeBtn('${combatant.id}')">Salir de Forma Salvaje</button>
      </div>`;
    }
    const used = load('resource_boyd_wild-shape', 0);
    const max  = getResourceMax('boyd', 'wild-shape', lvl);

    const allForms = (typeof CAMPAIGN !== 'undefined' && CAMPAIGN.wildShapeForms) || [];
    const available   = allForms.filter(f => lvl >= (f.minLevel || 2));
    const locked      = allForms.filter(f => lvl < (f.minLevel || 2));

    const formOpts = available.map(f =>
      `<option value="${f.id}" ${d.beastId===f.id?'selected':''}>` +
      `${liveEscape(f.name)} · CR ${f.cr} · HP ${f.hpMax} · CA ${f.ac}</option>`
    ).join('');
    const lockedOpts = locked.map(f =>
      `<option value="" disabled>🔒 ${liveEscape(f.name)} (requiere Nv ${f.minLevel})</option>`
    ).join('');

    // Stats de la forma seleccionada
    const selectedForm = allForms.find(f => f.id === d.beastId);
    const statsBlock = selectedForm ? `
      <div class="ws-form-stats">
        <div class="ws-stat-row">
          <span>HP <strong>${selectedForm.hpMax}</strong></span>
          <span>CA <strong>${selectedForm.ac}</strong></span>
          <span>Vel. <strong>${selectedForm.speed}</strong></span>
          <span>STR <strong>${selectedForm.str}</strong> DEX <strong>${selectedForm.dex}</strong> CON <strong>${selectedForm.con}</strong></span>
        </div>
        <div class="ws-attacks">
          ${selectedForm.attacks.map(a =>
            `<div class="ws-attack-row">⚔ <strong>${liveEscape(a.name)}</strong> +${a.bonus} · ${liveEscape(a.dmg)} ${liveEscape(a.dmgType)}${a.note?` <em class="muted">(${liveEscape(a.note)})</em>`:''}</div>`
          ).join('')}
        </div>
        ${selectedForm.notes ? `<div class="ability-stat-line muted" style="margin-top:0.4rem">📋 ${liveEscape(selectedForm.notes)}</div>` : ''}
      </div>
    ` : '';

    return `<div class="ability-specific-block">
      <div class="ability-stat-line">Boyd se transforma en una bestia. Los HP de la bestia actúan como escudo — el daño va a ellos primero.</div>
      <div class="ability-stat-line muted">Usos: ${Math.max(0,max-used)}/${max} · Restricción Nv ${lvl}: CR ${lvl>=8?'1':lvl>=4?'1/2':'1/4'} máx${lvl<4?', sin vuelo':''}</div>
      <div class="form-row">
        <label>Forma Salvaje</label>
        <select class="form-input" onchange="selectWildShapeForm(this.value)">
          <option value="">— elegir forma —</option>
          ${formOpts}
          ${lockedOpts}
        </select>
      </div>
      ${statsBlock}
      ${!selectedForm ? `<div class="form-row"><label>O escribí el nombre manualmente</label>
        <input class="form-input" placeholder="ej: Lobo" value="${liveEscape(d.beastName||'')}" oninput="updateFormField('beastName',this.value)">
      </div>
      <div class="form-row"><label>HP máx. de la bestia</label>
        <input type="number" class="form-input" placeholder="ej: 11" value="${liveEscape(d.beastHP||'')}" oninput="updateFormField('beastHP',this.value)">
      </div>` : ''}
    </div>`;
  }

  return '';
}

function renderCombatantsTargetPicker(d, label, field){
  const all = LIVE_SESSION.combat.participants;
  if(!all || all.length === 0) return '';
  const opts = `<option value="">— elegir objetivo —</option>` +
    all.map(p=>`<option value="${p.id}" ${d[field]===p.id?'selected':''}>${liveEscape(getCombatantName(p))} (HP ${getCombatantHP(p)})</option>`).join('');
  return `<div class="form-row"><label>${label}</label>
    <select class="form-input" onchange="updateFormField('${field}',this.value)">${opts}</select>
  </div>`;
}

function selectWildShapeForm(formId){
  if(!currentForm || currentForm.type !== 'class-ability') return;
  if(!formId){ currentForm.data.beastId=''; currentForm.data.beastName=''; currentForm.data.beastHP=''; renderNoteForm(); return; }
  const f = ((typeof CAMPAIGN !== 'undefined' && CAMPAIGN.wildShapeForms) || []).find(x=>x.id===formId);
  if(!f) return;
  currentForm.data.beastId   = f.id;
  currentForm.data.beastName = f.name;
  currentForm.data.beastHP   = String(f.hpMax);
  renderNoteForm();
}

function saveClassAbilityNote(){
  const d = currentForm.data;
  const c = d.character;
  const key = d.abilityKey;
  const lvl = getCharLevel(c);
  const meta = ABILITY_META[key];
  if(!meta){ alert('Elegí una habilidad.'); return; }

  const combatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===c);
  let noteText = '';

  // ── Furia ──
  if(key === 'rage'){
    const isInRage = !!(combatant && combatant.inRage);
    if(isInRage){ alert('Rac ya está en Furia. Usá el botón "Terminar Furia" en lugar de activarla de nuevo.'); return; }
    // Consumir recurso
    const used = load('resource_rac_rage', 0);
    const max  = getResourceMax('rac', 'rage', lvl);
    if(used >= max && !confirm('Sin furias disponibles. ¿Guardar igual?')) return;
    save('resource_rac_rage', used + 1);
    // Estado en combatiente
    if(combatant){ combatant.inRage = true; combatant.rageTurnsLeft = 10; }
    const bonus = getRageDamageBonus(lvl);
    noteText = `😠 Rac entra en Furia. Bonus daño +${bonus} en ataques STR. Resistencia a daño físico. Duración: 10 rounds.`;
    if(typeof renderCharAbilities === 'function') renderCharAbilities('rac');
  }

  // ── Ki abilities ──
  else if(['flurry-of-blows','patient-defense','step-of-the-wind'].includes(key)){
    const used = load('resource_relyo_ki', 0);
    const max  = getResourceMax('relyo', 'ki', lvl);
    const cost = meta.cost || 1;
    if(used + cost > max && !confirm(`Sin ki suficiente (${max-used} disponible, costo ${cost}). ¿Guardar igual?`)) return;
    save('resource_relyo_ki', Math.min(used + cost, max));
    if(key === 'flurry-of-blows'){
      const die = getMartialArtsDie(lvl);
      const dex = abilityMod(ABILITY_SCORES.relyo.dex);
      const prof = getCharProfBonus('relyo');
      const atk = dex + prof;
      const r1 = d.flurryRoll1 ? `Golpe 1: d20=${d.flurryRoll1} (+${atk} = ${parseInt(d.flurryRoll1)+atk})` : '';
      const r2 = d.flurryRoll2 ? `Golpe 2: d20=${d.flurryRoll2} (+${atk} = ${parseInt(d.flurryRoll2)+atk})` : '';
      noteText = `👊 Lluvia de Golpes (Flurry of Blows): 2 ataques desarmados adicionales. Daño: 1d${die}+${dex}. ${r1} ${r2}`.trim();
    } else if(key === 'patient-defense'){
      noteText = `🛡 Defensa Paciente (Patient Defense): Relyo en Dodge hasta su próximo turno. Los atacantes tienen desventaja. 🎲 Tirá 2d20 y elegí el menor.`;
      if(combatant){ applyCondition(combatant.id, 'dodge', 1, 'Patient Defense', combatant.id); }
    } else {
      noteText = `💨 Paso del Viento (Step of the Wind): ${d.windOption==='dash'?'Dash (doble movimiento)':'Disengage (sin AoO)'}. Salto duplicado.`;
    }
    if(typeof renderCharAbilities === 'function') renderCharAbilities('relyo');
  }

  // ── Divine Smite ──
  else if(key === 'divine-smite'){
    const slotLv = parseInt(d.slotLevel) || 1;
    const ok = consumeSpellSlot('tyrell', slotLv);
    if(!ok && !confirm('Sin slot disponible. ¿Guardar igual?')) return;
    const dice = 2 + (slotLv - 1);
    const dmg  = parseInt(d.smiteDmg) || 0;
    // Aplicar daño radiante al objetivo
    if(dmg > 0 && d.targetId){
      changeCombatantHP(d.targetId, -dmg);
    }
    noteText = `✨ Castigo Divino (Divine Smite) Nivel ${slotLv}: ${dice}d8 radiante${dmg>0?' = '+dmg+' daño':''}.${d.targetId?' Aplicado al objetivo.':''}`;
    if(typeof renderCharAbilities === 'function') renderCharAbilities('tyrell');
  }

  // ── Lay on Hands ──
  else if(key === 'lay-on-hands'){
    const poolMax = getResourceMax('tyrell', 'lay-on-hands', lvl);
    const poolUsed = load('resource_tyrell_lay-on-hands', 0);
    const poolLeft = Math.max(0, poolMax - poolUsed);
    const amount = parseInt(d.healAmount) || 0;
    if(amount <= 0){ alert('Ingresá cuántos HP curar.'); return; }
    if(amount > poolLeft && !confirm(`Eso excede el pool disponible (${poolLeft} HP). ¿Guardar igual?`)) return;
    save('resource_tyrell_lay-on-hands', Math.min(poolUsed + amount, poolMax));
    // Curar al objetivo
    if(d.targetId) changeCombatantHP(d.targetId, amount);
    noteText = `🖐 Imposición de Manos (Lay on Hands): ${amount} HP curados.${d.targetId?' Aplicado al objetivo.':''} Pool restante: ${Math.max(0,poolLeft-amount)} HP.`;
    if(typeof renderCharAbilities === 'function') renderCharAbilities('tyrell');
  }

  // ── Divine Sense ──
  else if(key === 'divine-sense'){
    const used = load('resource_tyrell_divine-sense', 0);
    const max  = getResourceMax('tyrell', 'divine-sense', lvl);
    if(used >= max && !confirm('Sin usos disponibles. ¿Guardar igual?')) return;
    save('resource_tyrell_divine-sense', used + 1);
    noteText = `👁 Sentido Divino (Divine Sense): Tyrell detecta criaturas celestiales, infernales o no-muertas a 60 ft. Dura hasta fin del turno.`;
    if(typeof renderCharAbilities === 'function') renderCharAbilities('tyrell');
  }

  // ── Wild Shape ──
  else if(key === 'wild-shape'){
    if(!d.beastName){ alert('Ingresá el nombre de la bestia.'); return; }
    const beastHPMax = parseInt(d.beastHP);
    if(!beastHPMax || beastHPMax <= 0){ alert('Ingresá los HP máx. de la bestia.'); return; }
    // Consumir recurso
    const used = load('resource_boyd_wild-shape', 0);
    const max  = getResourceMax('boyd', 'wild-shape', lvl);
    if(used >= max && !confirm('Sin usos disponibles. ¿Guardar igual?')) return;
    save('resource_boyd_wild-shape', used + 1);
    // Guardar HP actuales de Boyd
    const boydCurrentHP = load('hp_boyd', getHPMax('boyd'));
    // Actualizar estado del combatiente
    if(combatant){
      combatant.wildShape = { active:true, beastId:d.beastId||'', beastName:d.beastName, beastHP:beastHPMax, beastHPMax, originalHP:boydCurrentHP };
    }
    noteText = `🐺 Forma Salvaje (Wild Shape): Boyd se transforma en ${d.beastName} (HP ${beastHPMax}). Todo el daño va primero a los HP de la bestia.`;
    renderPresentsGrid();
    if(typeof renderCharAbilities === 'function') renderCharAbilities('boyd');
  }

  else {
    noteText = `⚡ ${meta.name} usada por ${c.charAt(0).toUpperCase()+c.slice(1)}.`;
  }

  pushNote({
    type:'class-ability', character:c, abilityKey:key,
    abilityName: meta.name, abilityNameEn: meta.nameEn,
    notes: (d.notes ? noteText+'\n'+d.notes : noteText)
  });

  // Solo marcar turno gastado si la habilidad es una Action principal (isAction:true)
  const trigId = combatant ? combatant.id : null;
  closeNoteForm();
  if(trigId && meta.isAction) markActed(trigId);
  saveLiveSession();
  renderLive();
}

/* ── RENDER NOTE FORM ── */
function renderNoteForm(){
  const container = document.getElementById('note-form-container');
  if(!container) return;
  if(!currentForm){ container.innerHTML = ''; return; }
  if(currentForm.type === 'action') container.innerHTML = renderActionForm();
  else if(currentForm.type === 'npc-action') { container.innerHTML = renderNpcActionForm(); updateNpcActionAssistance(); return; }
  else if(currentForm.type === 'skip-turn') container.innerHTML = renderSkipTurnForm();
  else if(currentForm.type === 'conversation') container.innerHTML = renderConversationForm();
  else if(currentForm.type === 'npc') container.innerHTML = renderNpcForm();
  else if(currentForm.type === 'combat') container.innerHTML = renderCombatForm();
  else if(currentForm.type === 'loot') { container.innerHTML = renderLootForm(); updateLootFormResult(); return; }
  else if(currentForm.type === 'class-ability') container.innerHTML = renderClassAbilityForm();
  else container.innerHTML = renderNarrativeForm();
  updateFormAssistance();
}

/* Toggle un objetivo en el array targetIds sin re-renderizar todo el form */
function toggleTarget(id){
  if(!currentForm) return;
  const ids = currentForm.data.targetIds || [];
  const idx = ids.indexOf(id);
  if(idx === -1) ids.push(id);
  else ids.splice(idx, 1);
  currentForm.data.targetIds = ids;
  // Actualizar visual del pill sin re-render completo
  const pill = document.getElementById('target-pill-'+id);
  if(pill) pill.classList.toggle('selected', ids.includes(id));
  updateFormAssistance();
  updateNpcActionAssistance();
}

/* Renderiza el picker de objetivos con pills clickeables */
function renderTargetPicker(targetIds, customDC, roll, modifier, isAttack){
  const targets = getAliveTargets();
  if(!targets.length) return '<div class="form-row"><span class="muted" style="font-size:0.8rem">Sin combatientes en el tracker.</span></div>';
  const total = (parseInt(roll)||0) + (parseInt(modifier)||0);
  const preamble = targets.length > 1
    ? '<div class="target-picker-label">Objetivos <span class="muted">(click para seleccionar)</span></div>'
    : '<div class="target-picker-label">Objetivo</div>';
  const pills = targets.map(p => {
    const sel = (targetIds||[]).includes(p.id);
    const ca = getCombatantAC(p);
    const threshold = customDC || ca;
    let outcomeTxt = '—', outcomeCls = '';
    if(roll !== '' && roll != null && threshold){
      if(isNat20(roll)){ outcomeTxt='★'; outcomeCls='nat20'; }
      else if(isNat1(roll)){ outcomeTxt='✗'; outcomeCls='nat1'; }
      else if(isAttack){
        outcomeTxt = total >= parseInt(threshold) ? 'HIT' : 'MISS';
        outcomeCls = total >= parseInt(threshold) ? 'hit' : 'miss';
      } else {
        outcomeTxt = total >= parseInt(threshold) ? 'PASS' : 'FAIL';
        outcomeCls = total >= parseInt(threshold) ? 'pass' : 'fail';
      }
    }
    return `<button type="button" id="target-pill-${p.id}"
        class="target-pill${sel?' selected':''}"
        onclick="toggleTarget('${p.id}')">
      <span class="tp-name">${liveEscape(getCombatantName(p))}</span>
      <span class="tp-meta">CA ${ca} · HP ${getCombatantHP(p)}</span>
      <span id="target-outcome-${p.id}" class="outcome-badge ${outcomeCls}">${outcomeTxt}</span>
    </button>`;
  }).join('');
  return `${preamble}<div class="target-picker">${pills}</div>`;
}

/* Picker de objetivo único (dropdown) — para healing y casos sin CA inline */
function renderSingleTargetPicker(targetIds, roll, modifier, forAllies){
  const targets = forAllies ? getAlivePlayers() : getAliveMonsters();
  if(!targets.length) return `<div class="form-row"><span class="muted" style="font-size:0.8rem">${forAllies?'Sin aliados en el tracker.':'Sin enemigos en el tracker.'}</span></div>`;
  const currentId = (targetIds||[])[0]||'';
  const opts=`<option value="">— elegir objetivo —</option>`+
    targets.map(p=>`<option value="${p.id}" ${p.id===currentId?'selected':''}>${liveEscape(getCombatantName(p))} — HP ${getCombatantHP(p)}/${getCombatantHPMax(p)}</option>`).join('');
  return `<div class="form-row">
    <label>${forAllies?'Objetivo (aliado)':'Objetivo (enemigo)'}</label>
    <select class="form-input" onchange="setSingleTarget(this.value)">${opts}</select>
  </div>`;
}

function setSingleTarget(id){
  if(!currentForm) return;
  currentForm.data.targetIds = id ? [id] : [];
  if(id){
    const p = getCombatant(id);
    if(p) currentForm.data.targetCA = String(getCombatantAC(p));
  } else {
    currentForm.data.targetCA = '';
  }
  renderNoteForm();
}

/* Sync directo del total de daño — llamado desde los inputs de dado y bonus */
function syncDamageTotal(){
  const el = document.getElementById('damage-total');
  if(!el || !currentForm) return;
  const d = currentForm.data;
  const die = parseInt(d.damage);
  const bon = parseInt(d.damageBonus)||0;
  el.textContent = (!isNaN(die) && d.damage !== '') ? String(die + bon) : '—';
  if(currentForm.type === 'action') updateFormAssistance();
  else if(currentForm.type === 'npc-action') updateNpcActionAssistance();
}

/* Bloque de curación (healing spells — damageType:'healing') */
function renderHealBlock(d){
  const targets = getAlivePlayers();
  const currentId = (d.targetIds||[])[0]||'';
  const opts=`<option value="">— elegir objetivo —</option>`+
    targets.map(p=>`<option value="${p.id}" ${p.id===currentId?'selected':''}>${liveEscape(getCombatantName(p))} — HP ${getCombatantHP(p)}/${getCombatantHPMax(p)}</option>`).join('');
  return `<div class="heal-block">
    <div class="form-row">
      <label>Objetivo (aliado a curar)</label>
      <select class="form-input" onchange="setSingleTarget(this.value)">${opts}</select>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>HP a restaurar</label>
        <input type="number" class="form-input" placeholder="ej: 7" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)">
      </div>
      <div class="form-row form-checkbox-row">
        <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar curación automáticamente</label>
      </div>
    </div>
  </div>`;
}

function renderActionForm(){
  const d = currentForm.data;
  const c = d.character;
  const preset = CLASS_PRESETS[c] || {};

  // Spell options (solo preparados)
  const preparedSpells = (preset.spellList||[]).filter(s=>isSpellPrepared(c, s.name));
  const spellOpts = preparedSpells.map(s=>
    `<option value="${liveEscape(s.name)}" ${d.spellName===s.name?'selected':''}>${s.name} / ${s.nameEs} (Nv ${s.level})</option>`
  ).join('');

  // Cantrip options (solo activos)
  const activeCantrips = (preset.cantripsData||[]).filter(cn=>isCantripActive(c, cn.name));
  const cantripOpts = activeCantrips.map(cn=>
    `<option value="${liveEscape(cn.name)}" ${d.cantripName===cn.name?'selected':''}>${cn.name} / ${cn.nameEs}</option>`
  ).join('');

  // Skill options
  const skillOpts = (preset.skillProfs||[]).map(sk=>
    `<option value="${sk.name}" ${d.skill===sk.name?'selected':''}>${sk.name} / ${sk.nameEs} (${sk.ability.toUpperCase()})</option>`
  ).join('');

  // Spell levels disponibles (para upcasting)
  const availableLevels = preset.spellSlots ? Object.keys(preset.spellSlots) : [];
  const levelOpts = availableLevels.map(lvl=>{
    const state = loadSlotState(c, lvl);
    const avail = state.max - state.used;
    return `<option value="${lvl}" ${parseInt(d.spellLevel)===parseInt(lvl)?'selected':''}>Nivel ${lvl} (${avail}/${state.max} disponibles)</option>`;
  }).join('');

  // Detectar intent de la acción (determina UI de targets/daño)
  const selectedSpellData = d.actionType === 'spell' ? preparedSpells.find(s=>s.name===d.spellName) : null;
  const selectedCantripData = d.actionType === 'cantrip' ? activeCantrips.find(cn=>cn.name===d.cantripName) : null;
  const activeSpellData = selectedSpellData || selectedCantripData;
  const isHealSpell = d.damageType === 'healing' || !!(activeSpellData && activeSpellData.damageType === 'healing');
  const isPhysicalAttack = ['attack-melee','attack-ranged'].includes(d.actionType);
  const isAttackSpell = (d.actionType==='spell' && spellRequiresAttack(d.spellName, d.character)) ||
                        (d.actionType==='cantrip' && cantripRequiresAttack(d.cantripName, d.character));
  const needsRollTarget = isPhysicalAttack || isAttackSpell;
  const isUtilitySpell = !!(activeSpellData && !activeSpellData.damage && !activeSpellData.saveType && !isHealSpell);
  const dmgTypes = ['slashing','piercing','bludgeoning','fire','cold','lightning','thunder','acid','poison','psychic','necrotic','radiant','force'];

  // Sub-fields condicionales
  let conditionalHTML = '';
  if(d.actionType === 'skill'){
    conditionalHTML = `
      <div class="form-row">
        <label>Skill</label>
        <select class="form-input" onchange="updateFormField('skill', this.value)">
          <option value="">— elegir —</option>
          ${skillOpts}
        </select>
      </div>`;
  } else if(d.actionType === 'save'){
    conditionalHTML = `
      <div class="form-row">
        <label>Saving Throw</label>
        <select class="form-input" onchange="updateFormField('save', this.value)">
          ${['str','dex','con','int','wis','cha'].map(ab=>`<option value="${ab}" ${d.save===ab?'selected':''}>${ab.toUpperCase()}</option>`).join('')}
        </select>
      </div>`;
  } else if(d.actionType === 'spell'){
    const selectedSpell = selectedSpellData;
    if(selectedSpell){
      if(!d.damageDice && selectedSpell.damage) d.damageDice = selectedSpell.damage;
      if(!d.damageType && selectedSpell.damageType) d.damageType = selectedSpell.damageType;
      if(selectedSpell.saveType && !d.isSaveSpell){
        d.isSaveSpell = true; d.saveType = selectedSpell.saveType;
        d.halfOnSave = selectedSpell.halfOnSave || false;
        if(!d.saveDC) d.saveDC = String(calcSpellSaveDC(d.character));
      } else if(!selectedSpell.saveType){
        d.isSaveSpell = false;
        if(d.modifier === '' || d.modifier == null){ const m = calcSpellAttackMod(d.character); if(m !== '') d.modifier = String(m); }
      }
    }
    const spellInfo = selectedSpell ? `<div class="spell-info-preview">
      ${schoolBadge(selectedSpell.school)} <span class="spell-shape">${selectedSpell.shape||''}</span>
      <div style="font-size:0.82rem;color:var(--cream);margin-top:0.3rem">${selectedSpell.desc}</div>
    </div>` : '';
    const showDamageDice = !!(selectedSpell && selectedSpell.damage && !isHealSpell);
    conditionalHTML = `
      <div class="form-row">
        <label>Hechizo (solo preparados)</label>
        <select class="form-input" onchange="selectSpell(this.value, '${liveEscape(d.character)}')">
          <option value="">— elegir hechizo —</option>
          ${spellOpts}
        </select>
        ${preparedSpells.length === 0 ? '<div class="form-warn">⚠ ningún hechizo preparado. Andá a la hoja del personaje y marcá con ✓ los hechizos a preparar.</div>' : ''}
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Nivel del slot a gastar</label>
          <select class="form-input" onchange="updateFormField('spellLevel', this.value)">${levelOpts}</select>
        </div>
        ${showDamageDice ? `<div class="form-row">
          <label>Dado de daño</label>
          <input class="form-input" placeholder="ej: 8d6" value="${liveEscape(d.damageDice||'')}" oninput="updateFormField('damageDice', this.value)">
        </div>` : ''}
      </div>
      ${spellInfo}`;
  } else if(d.actionType === 'cantrip'){
    const selectedCantrip = selectedCantripData;
    if(selectedCantrip){
      if(!d.damageDice){ const dice = getCantripDamageDice(selectedCantrip, getCharLevel(d.character), d.character); if(dice) d.damageDice = dice; }
      if(!d.damageType && selectedCantrip.damageType) d.damageType = selectedCantrip.damageType;
      if(selectedCantrip.saveType && !d.isSaveSpell){
        d.isSaveSpell = true; d.saveType = selectedCantrip.saveType;
        d.halfOnSave = selectedCantrip.halfOnSave || false;
        if(!d.saveDC) d.saveDC = String(calcSpellSaveDC(d.character));
      } else if(!selectedCantrip.saveType){
        d.isSaveSpell = false;
        if(d.modifier === '' || d.modifier == null){ const m = calcSpellAttackMod(d.character); if(m !== '') d.modifier = String(m); }
      }
    }
    const cantripInfo = selectedCantrip ? `<div class="spell-info-preview">
      ${schoolBadge(selectedCantrip.school)} <span class="spell-shape">${selectedCantrip.shape||''}</span>
      <div style="font-size:0.82rem;color:var(--cream);margin-top:0.3rem">${selectedCantrip.desc}</div>
    </div>` : '';
    const showCantripDice = !!(selectedCantrip && !isHealSpell && !isUtilitySpell);
    conditionalHTML = `
      <div class="form-grid">
        <div class="form-row">
          <label>Cantrip (solo activos)</label>
          <select class="form-input" onchange="selectCantrip(this.value, '${liveEscape(d.character)}')">
            <option value="">— elegir cantrip —</option>
            ${cantripOpts}
          </select>
          ${activeCantrips.length === 0 ? '<div class="form-warn">⚠ ningún cantrip activo.</div>' : ''}
        </div>
        ${showCantripDice ? `<div class="form-row">
          <label>Dado de daño</label>
          <input class="form-input" placeholder="ej: 2d10" value="${liveEscape(d.damageDice||'')}" oninput="updateFormField('damageDice', this.value)">
        </div>` : ''}
      </div>
      ${cantripInfo}`;
  } else if(d.actionType === 'attack-melee' || d.actionType === 'attack-ranged'){
    const equippedWeapons = getEquippedWeapons(d.character);
    // Auto-fill al renderizar si hay arma elegida pero faltan campos
    if(d.weaponId){
      const item = getItem(d.weaponId);
      if(item){
        if(d.modifier === '' || d.modifier == null){ const m = calcWeaponAttackMod(d.character, item); if(m !== '') d.modifier = String(m); }
        if(d.damageBonus === '' || d.damageBonus == null) d.damageBonus = String(calcWeaponDamageBonus(d.character, item));
        if(!d.damageDice) d.damageDice = item.damage || '';
        if(!d.damageType) d.damageType = item.damageType || 'slashing';
      }
    }
    const weaponOpts = `<option value="">— libre / sin arma —</option>` +
      equippedWeapons.map(w=>`<option value="${w.id}" ${d.weaponId===w.id?'selected':''}>${w.nameEs||w.name} (${w.damage} ${w.damageType})</option>`).join('');
    conditionalHTML = `
      <div class="form-grid">
        <div class="form-row">
          <label>Arma</label>
          <select class="form-input" onchange="selectWeapon(this.value)">${weaponOpts}</select>
        </div>
        <div class="form-row">
          <label>Dado de daño</label>
          <input class="form-input" placeholder="ej: 1d12" value="${liveEscape(d.damageDice||'')}" oninput="updateFormField('damageDice', this.value)">
        </div>
      </div>`;
  }

  // Sección inferior: targets + daño/efecto según el intent de la acción
  let bottomHTML = '';
  if(d.isSaveSpell){
    bottomHTML = renderSaveBlock(d);
  } else if(isHealSpell){
    bottomHTML = renderHealBlock(d);
  } else if(needsRollTarget){
    // Layout: 1) Objetivo+CA  2) d20+mod+total  3) Resultado  4) Daño  5) HP preview
    const atkTargetId = (d.targetIds||[])[0]||'';
    const atkTargetP  = atkTargetId ? getCombatant(atkTargetId) : null;
    const autoCA      = atkTargetP ? getCombatantAC(atkTargetP) : '';
    const displayCA   = d.targetCA || (autoCA ? String(autoCA) : '');
    const atkOpts     = `<option value="">— elegir objetivo —</option>` +
      getAliveMonsters().map(p=>`<option value="${p.id}" ${p.id===atkTargetId?'selected':''}>${liveEscape(getCombatantName(p))} — CA ${getCombatantAC(p)} · HP ${getCombatantHP(p)}</option>`).join('');

    // Calcular resultado para render inicial
    const rollN = parseInt(d.roll)||0, modN = parseInt(d.modifier)||0, totalN = rollN+modN;
    const caN = parseInt(displayCA)||0;
    let outMainTxt='—', outMainCls='';
    if(d.roll!==''&&d.roll!=null&&caN){
      if(isNat20(d.roll)){outMainTxt=`★ CRÍTICO — NAT 20! (total: ${totalN})`;outMainCls='nat20';}
      else if(isNat1(d.roll)){outMainTxt=`✗ PIFIA — NAT 1 (total: ${totalN})`;outMainCls='nat1';}
      else{const h=totalN>=caN;outMainTxt=h?`HIT! — ${totalN} ≥ CA ${caN}`:`MISS — ${totalN} < CA ${caN}`;outMainCls=h?'hit':'miss';}
    } else if(d.roll!==''&&d.roll!=null){
      outMainTxt=`Total: ${totalN}`;
    }

    // Daño: dado + bonus + total
    const dieRoll = parseInt(d.damage)||0;
    const dmgBonus = parseInt(d.damageBonus)||0;
    const totalDmg = dieRoll + dmgBonus;
    const dmgBonusLabel = dmgBonus >= 0 ? `+${dmgBonus}` : String(dmgBonus);
    const dmgTotalDisplay = d.damage !== '' && d.damage != null ? String(totalDmg) : '—';

    // HP preview inicial
    let hpPreviewHTML='';
    if(atkTargetP && totalDmg > 0 && d.applyDamage && caN && d.damage!==''){
      const curHP=getCombatantHP(atkTargetP), maxHP=getCombatantHPMax(atkTargetP);
      const willApply=isNat20(d.roll)||(d.roll!==''&&d.roll!=null&&!isNat1(d.roll)&&totalN>=caN);
      if(willApply){
        const newHP=Math.max(0,curHP-totalDmg);
        hpPreviewHTML=`${liveEscape(getCombatantName(atkTargetP))}: HP ${curHP} → <strong class="${newHP===0?'hp-zero':''}">${newHP}</strong> / ${maxHP}`;
      } else if(d.roll!==''&&d.roll!=null){
        hpPreviewHTML=`<span class="muted">MISS — sin daño.</span>`;
      }
    }

    bottomHTML = `
      <div class="form-grid-halves">
        <div class="form-row">
          <label>Objetivo (enemigo)</label>
          <select class="form-input" onchange="setSingleTarget(this.value)">${atkOpts}</select>
        </div>
        <div class="form-row">
          <label>CA</label>
          <input type="number" class="form-input" id="target-ca-input" placeholder="—" value="${liveEscape(displayCA)}" oninput="updateFormField('targetCA', this.value)">
        </div>
      </div>
      ${renderTargetConditionWarnings(atkTargetId)}
      <div class="form-grid">
        <div class="form-row">
          <label>Tirada d20</label>
          <input type="number" class="form-input" min="1" max="20" placeholder="1-20" value="${liveEscape(d.roll)}" oninput="updateFormField('roll', this.value)">
        </div>
        <div class="form-row">
          <label>Modificador (+/-)</label>
          <input type="number" class="form-input" placeholder="+5" value="${liveEscape(d.modifier)}" oninput="updateFormField('modifier', this.value)">
        </div>
        <div class="form-row">
          <label>Total ataque</label>
          <div class="form-total-display"><span id="form-total">—</span></div>
        </div>
      </div>
      <div id="result-outcome-main" class="result-outcome-main ${outMainCls}">${outMainTxt}</div>
      <div class="form-grid">
        <div class="form-row">
          <label>Dado de daño</label>
          <input type="number" class="form-input" placeholder="ej: 10" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value); syncDamageTotal()">
        </div>
        <div class="form-row">
          <label>Bonus daño (auto)</label>
          <input type="number" class="form-input" placeholder="+0" value="${liveEscape(d.damageBonus)}" oninput="updateFormField('damageBonus', this.value); syncDamageTotal()">
        </div>
        <div class="form-row">
          <label>Total daño</label>
          <div class="form-total-display"><span id="damage-total">${dmgTotalDisplay}</span></div>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Tipo de daño</label>
          <select class="form-input" onchange="updateFormField('damageType', this.value)">
            ${dmgTypes.map(t=>`<option value="${t}" ${d.damageType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-row form-checkbox-row">
          <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño automáticamente</label>
        </div>
      </div>
      <div id="result-hp-preview" class="result-hp-preview">${hpPreviewHTML}</div>`;
  } else if(isUtilitySpell){
    // Spell sin daño y sin save: mostrar efecto que aplica
    const eff = activeSpellData && activeSpellData.effect;
    const condName = eff && eff.targetConditionOnFail ? eff.targetConditionOnFail : '';
    const dur = eff && eff.duration ? `${eff.duration} rounds` : '';
    const casterEff = eff && eff.casterCondition === 'concentration' ? '◎ Requiere concentración' : '';
    bottomHTML = `<div class="spell-effect-block">
      ${casterEff ? `<div class="spell-effect-line">${liveEscape(casterEff)}</div>` : ''}
      ${condName ? `<div class="spell-effect-line">⚡ Aplica <strong>${liveEscape(condName)}</strong>${dur ? ` · ${dur}` : ''} a los objetivos que fallen el save.</div>` : ''}
      ${!condName && !casterEff ? '<div class="spell-effect-line muted">Sin daño directo.</div>' : ''}
    </div>`;
  } else {
    // Skill check, saving throw personal, free action, o spell sin seleccionar
    bottomHTML = `
      <div class="form-grid">
        <div class="form-row">
          <label>Tirada d20</label>
          <input type="number" class="form-input" min="1" max="20" placeholder="1-20" value="${liveEscape(d.roll)}" oninput="updateFormField('roll', this.value)">
        </div>
        <div class="form-row">
          <label>Modificador (+/-)</label>
          <input type="number" class="form-input" placeholder="+5" value="${liveEscape(d.modifier)}" oninput="updateFormField('modifier', this.value)">
        </div>
        <div class="form-row">
          <label>Total</label>
          <div class="form-total-display"><span id="form-total">—</span></div>
        </div>
      </div>`;
  }

  // ── Rac: detectar si está en Furia o si usó Reckless Attack ──
  const racCombatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId==='rac');
  const racInRage = c === 'rac' && racCombatant && racCombatant.inRage;
  const racReckless = c === 'rac' && racCombatant && racCombatant.recklessThisTurn;
  const rageBonus = getRageDamageBonus(getCharLevel('rac'));

  const rageBannerHTML = (c === 'rac') ? `
    ${racInRage ? `<div class="rage-banner-active">😠 Rac está en <strong>Furia</strong> — daño STR/melee +${rageBonus}, resistencia a daño físico.</div>` : ''}
    ${racReckless ? `<div class="reckless-banner">⚔ Rac usó <strong>Ataque Imprudente</strong> este turno — los atacantes tienen ventaja contra él hasta su próximo turno.</div>` : ''}
  ` : '';

  // Reckless Attack checkbox (solo Rac + ataque melee)
  const recklessHTML = (c === 'rac' && d.actionType === 'attack-melee') ? `
    <div class="form-checkbox-row reckless-row">
      <label>
        <input type="checkbox" ${d.recklessAttack?'checked':''} onchange="updateFormField('recklessAttack', this.checked)">
        <strong>Ataque Imprudente (Reckless Attack)</strong> — ventaja en este ataque STR.
      </label>
      <div class="disclaimer-box">🎲 Tirá 2d20 físicos y elegí el mayor (ventaja). Hasta tu próximo turno los enemigos tienen ventaja para atacarte.</div>
    </div>
  ` : '';

  return `
    <div class="note-form action-form">
      <div class="form-title">+ Acción jugador</div>

      <div class="form-grid">
        <div class="form-row">
          <label>Personaje</label>
          <select class="form-input" onchange="updateFormField('character', this.value)">
            ${CHARS.map(ch=>`<option value="${ch}" ${d.character===ch?'selected':''}>${ch.charAt(0).toUpperCase()+ch.slice(1)} (${(CLASS_PRESETS[ch]||{}).className||''})</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Tipo de acción</label>
          <select class="form-input" onchange="updateFormField('actionType', this.value)">
            <option value="attack-melee" ${d.actionType==='attack-melee'?'selected':''}>Ataque cuerpo a cuerpo</option>
            <option value="attack-ranged" ${d.actionType==='attack-ranged'?'selected':''}>Ataque a distancia</option>
            <option value="skill" ${d.actionType==='skill'?'selected':''}>Skill check</option>
            <option value="save" ${d.actionType==='save'?'selected':''}>Saving throw</option>
            <option value="spell" ${d.actionType==='spell'?'selected':''}>Lanzar hechizo</option>
            <option value="cantrip" ${d.actionType==='cantrip'?'selected':''}>Lanzar cantrip</option>
            <option value="other" ${d.actionType==='other'?'selected':''}>Acción libre / narrativa</option>
          </select>
        </div>
      </div>

      ${rageBannerHTML}
      ${recklessHTML}
      ${conditionalHTML}

      ${bottomHTML}

      <div class="form-row">
        <label>Notas libres</label>
        <textarea class="form-input form-textarea" placeholder="Lo que pasó en la mesa..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveActionNote()">Guardar nota</button>
      </div>
    </div>
  `;
}

/* Bloque de saving throws por objetivo (solo enemigos) */
function renderSaveBlock(d){
  const statLabel = (d.saveType||'').toUpperCase();
  const dc = parseInt(d.saveDC) || calcSpellSaveDC(d.character);
  const targets = getAliveMonsters();
  const rolls = d.targetSaveRolls || {};
  const overrides = d.targetSaveOverrides || {};
  const damageTypes = ['slashing','piercing','bludgeoning','fire','cold','lightning','thunder','acid','poison','psychic','necrotic','radiant','force'];
  // Efecto de condición del spell (para mostrar info cuando no hay daño)
  const preset = CLASS_PRESETS[d.character];
  const spellData = (preset&&preset.spellList||[]).find(s=>s.name===d.spellName) ||
                    (preset&&preset.cantripsData||[]).find(s=>s.name===d.cantripName);
  const eff = spellData && spellData.effect;
  const condName = eff && eff.targetConditionOnFail;
  const effDur = eff && eff.duration ? `${eff.duration} rounds` : '';
  const showDamageSection = !!d.damageDice;

  const targetRows = targets.map(p => {
    const saveMod = getCombatantSaveMod(p, d.saveType);
    const modLabel = saveMod != null ? (saveMod >= 0 ? `+${saveMod}` : String(saveMod)) : '?';
    const roll = rolls[p.id] || '';
    const total = roll !== '' && saveMod != null ? parseInt(roll) + saveMod : null;
    const override = overrides[p.id];
    let outcomeTxt = '—', outcomeCls = '';
    if(override){ outcomeTxt = override === 'pass' ? 'PASS ✎' : 'FAIL ✎'; outcomeCls = override + ' overridden'; }
    else if(total != null){ outcomeTxt = total >= dc ? 'PASS' : 'FAIL'; outcomeCls = total >= dc ? 'pass' : 'fail'; }
    const isSelected = (d.targetIds||[]).includes(p.id);
    return `<div class="save-target-row${isSelected?' selected':''}">
      <button type="button" class="save-target-toggle${isSelected?' on':''}" onclick="toggleTarget('${p.id}')" title="Incluir/excluir objetivo">
        ${liveEscape(getCombatantName(p))} <span class="muted" style="font-size:0.72rem">CA ${getCombatantAC(p)} · HP ${getCombatantHP(p)}</span>
      </button>
      <span class="save-stat-mod" title="${statLabel} save mod">${statLabel} ${modLabel}</span>
      <input type="number" class="form-input save-roll-input" min="1" max="20" placeholder="d20"
        value="${liveEscape(String(roll))}"
        oninput="updateTargetSaveRoll('${p.id}', this.value)">
      ${total != null ? `<span class="save-total">${total}</span>` : '<span class="save-total muted">—</span>'}
      <span id="save-outcome-${p.id}" class="outcome-badge ${outcomeCls}">${outcomeTxt}</span>
      <button type="button" class="save-override-btn" onclick="overrideTargetSave('${p.id}', '${outcomeCls.includes('pass')?'fail':'pass'}')" title="Invertir resultado">↕</button>
    </div>`;
  }).join('');

  const halfNote = d.halfOnSave ? '<span class="muted" style="font-size:0.75rem">· mitad de daño si pasan</span>' : '';

  return `<div class="save-block">
    <div class="save-block-header">
      <span class="save-dc-label">${statLabel} Save DC</span>
      <input type="number" class="form-input save-dc-input" value="${liveEscape(String(dc))}" oninput="updateFormField('saveDC', this.value)">
      ${halfNote}
    </div>
    ${condName ? `<div class="spell-effect-block" style="margin-bottom:0.5rem">
      <div class="spell-effect-line">⚡ Al fallar: <strong>${liveEscape(condName)}</strong>${effDur ? ` · ${effDur}` : ''}</div>
    </div>` : ''}
    ${targets.length ? `<div class="save-targets-list">${targetRows}</div>` : '<div class="muted" style="font-size:0.8rem;padding:0.5rem 0">Sin enemigos en el tracker.</div>'}
    ${showDamageSection ? `<div class="form-grid" style="margin-top:0.75rem">
      <div class="form-row">
        <label>Daño (a los que fallan)</label>
        <input type="number" class="form-input" placeholder="ej: 18" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)">
      </div>
      <div class="form-row">
        <label>Tipo de daño</label>
        <select class="form-input" onchange="updateFormField('damageType', this.value)">
          ${damageTypes.map(t=>`<option value="${t}" ${d.damageType===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-row form-checkbox-row">
        <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño automáticamente</label>
      </div>
    </div>` : ''}
  </div>`;
}

/* Extrae el bonus numérico de una expresión de dados.
   "1d12+3" → 3,  "1d12+3 slashing" → 3,  "2d6-1" → -1,  "1d8" → 0 */
function parseDamageBonus(diceStr){
  if(!diceStr) return 0;
  const m = String(diceStr).match(/\d+d\d+([+-]\d+)/);
  return m ? parseInt(m[1]) : 0;
}

/* Bonus de daño del arma: solo extrae el +N que ya viene en el string del arma.
   El modificador del stat ya está incorporado en ese valor — no lo sumamos de nuevo. */
function calcWeaponDamageBonus(charId, item){
  if(!item) return 0;
  return parseDamageBonus(item.damage);
}

/* Warnings tácticos por condiciones activas en el objetivo */
function renderTargetConditionWarnings(targetId){
  if(!targetId) return '';
  const p = getCombatant(targetId);
  if(!p || !p.conditions || !p.conditions.length) return '';
  const msgs = [];
  (p.conditions||[]).forEach(c => {
    const id = typeof c==='object' ? c.id : c;
    const cond = getCondition(id);
    if(!cond || !cond.mechanical) return;
    const m = cond.mechanical;
    const icon = cond.icon||'⚠';
    if(m.attacksAgainstAdvantage) msgs.push(`${icon} <strong>${cond.name}</strong> → tus ataques tienen <strong class="adv-text">VENTAJA</strong> <span class="cond-rule-note">(tirá 2 d20, quedate con el mayor)</span>`);
    if(m.attacksDisadvantage)      msgs.push(`${icon} <strong>${cond.name}</strong> → el objetivo ataca con <strong class="dis-text">DESVENTAJA</strong> <span class="cond-rule-note">(tirá 2 d20, quedate con el menor)</span>`);
    if(m.acBonus)                  msgs.push(`${icon} <strong>${cond.name}</strong> → CA +${m.acBonus}`);
    if(m.speedZero)                msgs.push(`${icon} <strong>${cond.name}</strong> → velocidad 0`);
  });
  if(!msgs.length) return '';
  return `<div class="target-cond-warnings">${msgs.map(t=>`<div class="cond-warn-line">${t}</div>`).join('')}</div>`;
}

/* Calcula el modificador de ataque para un arma dado un personaje */
function calcWeaponAttackMod(charId, item){
  if(!item) return '';
  const scores = ABILITY_SCORES[charId];
  if(!scores) return '';
  // Monjes pueden usar STR o DEX (el mayor)
  let stat = item.atkStat;
  if(item.properties && item.properties.includes('monk')){
    stat = (scores.str >= scores.dex) ? 'str' : 'dex';
  }
  // Finesse: el personaje elige el mayor entre STR y DEX
  if(item.properties && item.properties.includes('finesse')){
    const strMod = abilityMod(scores.str);
    const dexMod = abilityMod(scores.dex);
    stat = dexMod >= strMod ? 'dex' : 'str';
  }
  const mod = abilityMod(scores[stat] || 10);
  const prof = item.proficient ? getCharProfBonus(charId) : 0;
  return mod + prof;
}

/* Devuelve el modificador de save de un combatiente para un stat dado */
function getCombatantSaveMod(p, stat){
  if(!p || !stat) return null;
  if(p.kind === 'player'){
    const scores = ABILITY_SCORES[p.refId];
    if(!scores) return null;
    return abilityMod(scores[stat]);
  }
  // Monstruo del bestiario
  const preset = PRESET_MONSTERS.find(m => m.id === p.refId);
  if(preset && preset[stat] != null) return abilityMod(preset[stat]);
  return null;
}

/* Actualiza la tirada de save de un objetivo sin re-renderizar todo el form */
function updateTargetSaveRoll(targetId, roll){
  if(!currentForm) return;
  if(!currentForm.data.targetSaveRolls) currentForm.data.targetSaveRolls = {};
  currentForm.data.targetSaveRolls[targetId] = roll;
  // Actualizar badge del target en tiempo real
  const d = currentForm.data;
  const dc = parseInt(d.saveDC) || 0;
  const p = getCombatant(targetId);
  const saveMod = getCombatantSaveMod(p, d.saveType) || 0;
  const total = (parseInt(roll) || 0) + saveMod;
  const badge = document.getElementById('save-outcome-' + targetId);
  if(badge){
    if(!roll){ badge.textContent = '—'; badge.className = 'outcome-badge'; return; }
    const pass = total >= dc;
    badge.textContent = pass ? 'PASS' : 'FAIL';
    badge.className = 'outcome-badge ' + (pass ? 'pass' : 'fail');
  }
  // Actualizar total display
  const totalEl = document.getElementById('save-total-' + targetId);
  if(totalEl) totalEl.textContent = roll ? `${total}` : '—';
}

/* Override manual de pass/fail por el DM */
function overrideTargetSave(targetId, result){
  if(!currentForm) return;
  if(!currentForm.data.targetSaveOverrides) currentForm.data.targetSaveOverrides = {};
  currentForm.data.targetSaveOverrides[targetId] = result;
  const badge = document.getElementById('save-outcome-' + targetId);
  if(badge){
    badge.textContent = result === 'pass' ? 'PASS ✎' : 'FAIL ✎';
    badge.className = 'outcome-badge ' + result + ' overridden';
  }
}

/* Auto-fill al elegir un spell */
function selectSpell(spellName, charId){
  if(!currentForm) return;
  currentForm.data.spellName = spellName;
  currentForm.data.targetSaveRolls = {};
  currentForm.data.targetSaveOverrides = {};
  if(!spellName){ currentForm.data.isSaveSpell = false; renderNoteForm(); return; }
  const preset = CLASS_PRESETS[charId];
  const sp = (preset && preset.spellList || []).find(s => s.name === spellName);
  if(sp && sp.damage) currentForm.data.damageDice = sp.damage;
  if(sp && sp.damageType) currentForm.data.damageType = sp.damageType;
  if(sp && sp.saveType){
    // Modo save: DC auto-calculado, no se muestra tirada de ataque
    currentForm.data.isSaveSpell = true;
    currentForm.data.saveType = sp.saveType;
    currentForm.data.halfOnSave = sp.halfOnSave || false;
    currentForm.data.saveDC = String(calcSpellSaveDC(charId));
    currentForm.data.modifier = '';
  } else {
    currentForm.data.isSaveSpell = false;
    const mod = calcSpellAttackMod(charId);
    if(mod !== '') currentForm.data.modifier = String(mod);
  }
  renderNoteForm();
}

/* Auto-fill al elegir un cantrip */
function selectCantrip(cantripName, charId){
  if(!currentForm) return;
  currentForm.data.cantripName = cantripName;
  currentForm.data.targetSaveRolls = {};
  currentForm.data.targetSaveOverrides = {};
  if(!cantripName){ currentForm.data.isSaveSpell = false; renderNoteForm(); return; }
  const preset = CLASS_PRESETS[charId];
  const cn = (preset && preset.cantripsData || []).find(c => c.name === cantripName);
  if(cn){
    const dice = getCantripDamageDice(cn, getCharLevel(charId), charId);
    if(dice) currentForm.data.damageDice = dice;
    if(cn.damageType) currentForm.data.damageType = cn.damageType;
    if(cn.saveType){
      currentForm.data.isSaveSpell = true;
      currentForm.data.saveType = cn.saveType;
      currentForm.data.halfOnSave = cn.halfOnSave || false;
      currentForm.data.saveDC = String(calcSpellSaveDC(charId));
      currentForm.data.modifier = '';
    } else {
      currentForm.data.isSaveSpell = false;
      const mod = calcSpellAttackMod(charId);
      if(mod !== '') currentForm.data.modifier = String(mod);
    }
  }
  renderNoteForm();
}

/* Cuando el usuario elige un arma en el form, rellena modificador/daño/tipo/bonus */
function selectWeapon(itemId){
  const d = currentForm.data;
  if(!itemId){ currentForm.data.weaponId = ''; currentForm.data.damageBonus = ''; renderNoteForm(); return; }
  const item = getItem(itemId);
  if(!item) return;
  currentForm.data.weaponId = itemId;
  currentForm.data.weapon = item.nameEs || item.name;
  currentForm.data.damageDice = item.damage || '';
  currentForm.data.damageType = item.damageType || 'slashing';
  currentForm.data.damage = '';
  const atkMod = calcWeaponAttackMod(d.character, item);
  if(atkMod !== '') currentForm.data.modifier = String(atkMod);
  const dmgBonus = calcWeaponDamageBonus(d.character, item);
  currentForm.data.damageBonus = String(dmgBonus);
  renderNoteForm();
}

/* Cuando el usuario elige un ataque de monstruo */
function selectMonsterAttack(attackIdx){
  const d = currentForm.data;
  const monster = PRESET_MONSTERS.find(m=>m.id === d.monsterPresetId);
  if(!monster || !monster.attacks) return;
  const atk = monster.attacks[parseInt(attackIdx)];
  if(!atk) return;
  currentForm.data.selectedAttackIdx = parseInt(attackIdx);
  currentForm.data.weapon = atk.name;
  // Parsear bonus "+5" → 5 (guardar como entero, no string con +)
  const parsedBonus = parseInt(atk.bonus||0);
  if(!isNaN(parsedBonus)) currentForm.data.modifier = String(parsedBonus);
  // Parsear daño "1d8+3 perforante" → dado "1d8+3", tipo "piercing"
  if(atk.dmg){
    const dmgParts = atk.dmg.split(' ');
    const diceExpr = dmgParts[0] || '';
    currentForm.data.damageDice = diceExpr;
    currentForm.data.damageBonus = String(parseDamageBonus(diceExpr));
    currentForm.data.damage = '';
    const typeMap = {
      'perforante':'piercing','cortante':'slashing','contundente':'bludgeoning',
      'veneno':'poison','fuego':'fire','frío':'cold','rayo':'lightning',
      'trueno':'thunder','ácido':'acid','necrótico':'necrotic','radiante':'radiant',
      'psíquico':'psychic','fuerza':'force'
    };
    const typeWord = (dmgParts[1]||'').toLowerCase();
    currentForm.data.damageType = typeMap[typeWord] || 'slashing';
  }
  renderNoteForm();
}

function renderNpcForm(){
  const d = currentForm.data;
  return `
    <div class="note-form npc-form">
      <div class="form-title">+ NPC habla / actúa</div>
      <div class="form-grid">
        <div class="form-row">
          <label>NPC</label>
          <select class="form-input" onchange="updateFormField('npcId', this.value)">
            ${NPC_IDS.map(id=>`<option value="${id}" ${d.npcId===id?'selected':''}>${id.charAt(0).toUpperCase()+id.slice(1)}</option>`).join('')}
            <option value="otro" ${d.npcId==='otro'?'selected':''}>Otro (NPC nuevo)</option>
          </select>
        </div>
        ${d.npcId==='otro' ? `
        <div class="form-row">
          <label>Nombre del NPC</label>
          <input class="form-input" placeholder="ej: Capitán del puerto" value="${liveEscape(d.otherName)}" oninput="updateFormField('otherName', this.value)">
        </div>` : ''}
      </div>
      <div class="form-row">
        <label>Qué dice / hace</label>
        <textarea class="form-input form-textarea" placeholder="Diálogo, acción o pista que da el NPC..." oninput="updateFormField('dialogue', this.value)">${liveEscape(d.dialogue)}</textarea>
      </div>
      <div class="form-row">
        <label>Reacción del grupo (opcional)</label>
        <textarea class="form-input form-textarea" placeholder="Cómo respondieron los jugadores..." oninput="updateFormField('reaction', this.value)">${liveEscape(d.reaction)}</textarea>
      </div>
      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveNpcNote()">Guardar nota</button>
      </div>
    </div>
  `;
}

/* ── CONVERSACIÓN MULTI-TURNO ── */
function speakerOptions(selected){
  // selected es el valor `<kind>:<id>` (ej "npc:reynera", "char:rac", "narrator:narrator")
  const groups = [];
  groups.push(`<optgroup label="NPCs">` +
    NPC_IDS.map(id => `<option value="npc:${id}" ${selected==='npc:'+id?'selected':''}>${id.charAt(0).toUpperCase()+id.slice(1)}</option>`).join('') +
    `<option value="npc:otro" ${selected==='npc:otro'?'selected':''}>Otro NPC (escribir nombre)</option>` +
    `</optgroup>`);
  groups.push(`<optgroup label="Personajes">` +
    CHARS.map(c => `<option value="char:${c}" ${selected==='char:'+c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('') +
    `</optgroup>`);
  groups.push(`<optgroup label="Otros"><option value="narrator:narrator" ${selected==='narrator:narrator'?'selected':''}>Narrador / acción ambiental</option><option value="group:grupo" ${selected==='group:grupo'?'selected':''}>El grupo (coral)</option></optgroup>`);
  return groups.join('');
}

function speakerValue(ex){
  // Compatibilidad: el form interno usa speakerKind + speaker; serializamos como "kind:id".
  return (ex.speakerKind || 'npc') + ':' + (ex.speaker || '');
}

function updateExchangeField(idx, field, value){
  if(!currentForm || currentForm.type !== 'conversation') return;
  const ex = currentForm.data.exchanges[idx];
  if(!ex) return;
  if(field === 'speakerCombo'){
    const [kind, id] = String(value).split(':');
    ex.speakerKind = kind;
    ex.speaker = id;
    if(kind === 'npc' && id === 'otro' && !ex.speakerOther) ex.speakerOther = '';
    renderNoteForm();
    return;
  }
  ex[field] = value;
}

function addExchangeLine(){
  if(!currentForm || currentForm.type !== 'conversation') return;
  const last = currentForm.data.exchanges[currentForm.data.exchanges.length - 1];
  // Alternar: si el último fue NPC, sugerir un personaje; si fue char, sugerir el NPC principal.
  let nextKind = 'npc', nextId = currentForm.data.npcId;
  if(last && last.speakerKind === 'npc'){ nextKind = 'char'; nextId = CHARS[0]; }
  currentForm.data.exchanges.push({ speakerKind: nextKind, speaker: nextId, text:'' });
  renderNoteForm();
}

function removeExchangeLine(idx){
  if(!currentForm || currentForm.type !== 'conversation') return;
  if(currentForm.data.exchanges.length <= 1){
    alert('La conversación necesita al menos una línea.');
    return;
  }
  currentForm.data.exchanges.splice(idx, 1);
  renderNoteForm();
}

function moveExchangeLine(idx, delta){
  if(!currentForm || currentForm.type !== 'conversation') return;
  const arr = currentForm.data.exchanges;
  const j = idx + delta;
  if(j < 0 || j >= arr.length) return;
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  renderNoteForm();
}

function renderConversationForm(){
  const d = currentForm.data;
  const linesHTML = d.exchanges.map((ex, idx) => {
    const sv = speakerValue(ex);
    const isOtherNpc = ex.speakerKind === 'npc' && ex.speaker === 'otro';
    return `<div class="conv-line">
      <div class="conv-line-head">
        <span class="conv-line-num">#${idx+1}</span>
        <select class="form-input conv-speaker" onchange="updateExchangeField(${idx},'speakerCombo', this.value)">
          ${speakerOptions(sv)}
        </select>
        ${isOtherNpc ? `<input class="form-input conv-other" placeholder="Nombre del NPC nuevo" value="${liveEscape(ex.speakerOther||'')}" oninput="updateExchangeField(${idx},'speakerOther', this.value)">` : ''}
        <div class="conv-line-btns">
          <button class="btn-small" onclick="moveExchangeLine(${idx},-1)" title="Subir" ${idx===0?'disabled':''}>↑</button>
          <button class="btn-small" onclick="moveExchangeLine(${idx},1)" title="Bajar" ${idx===d.exchanges.length-1?'disabled':''}>↓</button>
          <button class="btn-small btn-danger" onclick="removeExchangeLine(${idx})" title="Borrar línea">✕</button>
        </div>
      </div>
      <textarea class="form-input form-textarea conv-text" placeholder="Qué dice/hace en este turno..." oninput="updateExchangeField(${idx},'text', this.value)">${liveEscape(ex.text||'')}</textarea>
    </div>`;
  }).join('');

  return `
    <div class="note-form conv-form">
      <div class="form-title">+ Conversación</div>
      <p class="muted" style="font-size:0.8rem;margin-bottom:0.6rem">Registrá idas y vueltas entre NPCs y personajes. Agregá tantas líneas como necesites — la conversación queda como una sola nota en el stream.</p>

      <div class="form-grid">
        <div class="form-row">
          <label>NPC principal (para el título)</label>
          <select class="form-input" onchange="updateFormField('npcId', this.value)">
            ${NPC_IDS.map(id=>`<option value="${id}" ${d.npcId===id?'selected':''}>${id.charAt(0).toUpperCase()+id.slice(1)}</option>`).join('')}
            <option value="otro" ${d.npcId==='otro'?'selected':''}>Otro / NPC nuevo</option>
            <option value="varios" ${d.npcId==='varios'?'selected':''}>Varios NPCs</option>
          </select>
        </div>
        ${d.npcId==='otro' ? `
        <div class="form-row">
          <label>Nombre del NPC nuevo</label>
          <input class="form-input" placeholder="ej: Capitán del puerto" value="${liveEscape(d.otherName)}" oninput="updateFormField('otherName', this.value)">
        </div>` : ''}
      </div>

      <div class="form-row">
        <label>Contexto (opcional)</label>
        <input class="form-input" placeholder="Dónde, cuándo, después de qué evento..." value="${liveEscape(d.context||'')}" oninput="updateFormField('context', this.value)">
      </div>

      <div class="conv-lines">${linesHTML}</div>

      <div style="margin:0.6rem 0">
        <button class="btn-small btn-add-line" onclick="addExchangeLine()">+ Agregar línea</button>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveConversationNote()">Guardar conversación</button>
      </div>
    </div>
  `;
}

function saveConversationNote(){
  const d = currentForm.data;
  const cleanExchanges = (d.exchanges || []).filter(ex => (ex.text||'').trim()).map(ex => ({
    speakerKind: ex.speakerKind,
    speaker: ex.speaker,
    speakerOther: ex.speakerOther || '',
    text: ex.text
  }));
  if(cleanExchanges.length === 0){
    alert('Agregá al menos una línea con texto antes de guardar.');
    return;
  }
  let title;
  if(d.npcId === 'otro') title = d.otherName || 'NPC nuevo';
  else if(d.npcId === 'varios') title = 'Varios NPCs';
  else title = (d.npcId || '').charAt(0).toUpperCase() + (d.npcId || '').slice(1);

  pushNote({
    type: 'conversation',
    npcId: d.npcId,
    title,
    context: d.context || '',
    exchanges: cleanExchanges
  });
  closeNoteForm();
  renderNotesStream();
}

/* ── ACCIÓN NPC/MONSTRUO ── */
function updateNpcActionAssistance(){
  if(!currentForm || currentForm.type !== 'npc-action') return;
  const d = currentForm.data;
  const roll = parseInt(d.roll)||0;
  const mod = parseInt(d.modifier)||0;
  const total = roll + mod;

  // Total ataque
  const totalEl = document.getElementById('form-total');
  if(totalEl) totalEl.textContent = (d.roll===''||d.roll==null) ? '—' : total;

  // Main outcome badge
  const mainOutcomeEl = document.getElementById('result-outcome-main');
  if(mainOutcomeEl){
    const ca = parseInt(d.targetCA)||0;
    let txt='—', cls='';
    if(d.roll!==''&&d.roll!=null){
      if(isNat20(d.roll)){txt=`★ CRÍTICO — NAT 20! (total: ${total})`;cls='nat20';}
      else if(isNat1(d.roll)){txt=`✗ PIFIA — NAT 1 (total: ${total})`;cls='nat1';}
      else if(ca){const h=total>=ca;txt=h?`HIT! — ${total} ≥ CA ${ca}`:`MISS — ${total} < CA ${ca}`;cls=h?'hit':'miss';}
      else{txt=`Total: ${total}`;}
    }
    mainOutcomeEl.textContent=txt;
    mainOutcomeEl.className='result-outcome-main'+(cls?' '+cls:'');
  }

  // Damage total
  const dmgTotalEl = document.getElementById('damage-total');
  if(dmgTotalEl){
    const die=parseInt(d.damage), bon=parseInt(d.damageBonus)||0;
    dmgTotalEl.textContent=(!isNaN(die)&&d.damage!=='')?String(die+bon):'—';
  }

  // HP preview
  const hpEl = document.getElementById('result-hp-preview');
  if(hpEl){
    const tid=(d.targetIds||[])[0];
    const p=tid?getCombatant(tid):null;
    const dieV=parseInt(d.damage);
    const dmg=(isNaN(dieV)||d.damage==='')?0:dieV+(parseInt(d.damageBonus)||0);
    if(p&&dmg>0&&d.applyDamage){
      const curHP=getCombatantHP(p),maxHP=getCombatantHPMax(p),ca=parseInt(d.targetCA)||0;
      const willApply=isNat20(d.roll)||(d.roll!==''&&d.roll!=null&&!isNat1(d.roll)&&ca&&total>=ca);
      if(willApply){
        const newHP=Math.max(0,curHP-dmg);
        hpEl.innerHTML=`${liveEscape(getCombatantName(p))}: HP ${curHP} → <strong class="${newHP===0?'hp-zero':''}">${newHP}</strong> / ${maxHP}`;
      } else {
        hpEl.innerHTML=d.roll!==''&&d.roll!=null?`<span class="muted">MISS — sin daño.</span>`:'';
      }
    } else if(!p||dmg===0){ hpEl.innerHTML=''; }
  }
}

function renderNpcActionForm(){
  const d = currentForm.data;
  const monster = PRESET_MONSTERS.find(m=>m.id === d.monsterPresetId);
  const attacksHTML = monster && monster.attacks && monster.attacks.length > 0 ? `
      <div class="form-row">
        <label>Ataque predefinido</label>
        <select class="form-input" onchange="selectMonsterAttack(this.value)">
          <option value="">— elegir ataque —</option>
          ${monster.attacks.map((a,i)=>`<option value="${i}" ${d.selectedAttackIdx===i?'selected':''}>${liveEscape(a.name)} · ${liveEscape(a.bonus||'—')} · ${liveEscape(a.dmg||'—')}</option>`).join('')}
        </select>
      </div>` : '';

  // Auto-fill al renderizar si hay ataque pre-seleccionado pero faltan campos
  if(d.selectedAttackIdx != null && monster && monster.attacks){
    const atk = monster.attacks[d.selectedAttackIdx];
    if(atk){
      if(d.modifier === '' || d.modifier == null){
        const pb = parseInt(atk.bonus||0);
        if(!isNaN(pb)) d.modifier = String(pb);
      }
      if(d.damageBonus === '' || d.damageBonus == null){
        const dp = (atk.dmg||'').split(' ');
        d.damageBonus = String(parseDamageBonus(dp[0]||''));
      }
      if(!d.damageDice && atk.dmg){ d.damageDice = atk.dmg.split(' ')[0]; }
    }
  }

  // Target (jugador) + CA
  const npcTargetId = (d.targetIds||[])[0]||'';
  const npcTargetP  = npcTargetId ? getCombatant(npcTargetId) : null;
  const npcAutoCA   = npcTargetP ? getCombatantAC(npcTargetP) : '';
  const npcDisplayCA= d.targetCA || (npcAutoCA ? String(npcAutoCA) : '');
  const npcTargetOpts = `<option value="">— elegir objetivo —</option>` +
    getAlivePlayers().map(p=>`<option value="${p.id}" ${p.id===npcTargetId?'selected':''}>${liveEscape(getCombatantName(p))} — CA ${getCombatantAC(p)} · HP ${getCombatantHP(p)}</option>`).join('');

  // Resultado inicial
  const rollN=parseInt(d.roll)||0, modN=parseInt(d.modifier)||0, totalN=rollN+modN;
  const caN=parseInt(npcDisplayCA)||0;
  let outMainTxt='—', outMainCls='';
  if(d.roll!==''&&d.roll!=null&&caN){
    if(isNat20(d.roll)){outMainTxt=`★ CRÍTICO — NAT 20! (total: ${totalN})`;outMainCls='nat20';}
    else if(isNat1(d.roll)){outMainTxt=`✗ PIFIA — NAT 1 (total: ${totalN})`;outMainCls='nat1';}
    else{const h=totalN>=caN;outMainTxt=h?`HIT! — ${totalN} ≥ CA ${caN}`:`MISS — ${totalN} < CA ${caN}`;outMainCls=h?'hit':'miss';}
  } else if(d.roll!==''&&d.roll!=null){ outMainTxt=`Total: ${totalN}`; }

  // Daño
  const dieRoll=parseInt(d.damage)||0, dmgBonus=parseInt(d.damageBonus)||0;
  const totalDmg=dieRoll+dmgBonus;
  const dmgTotalDisplay=d.damage!==''&&d.damage!=null?String(totalDmg):'—';

  // HP preview
  let hpPreviewHTML='';
  if(npcTargetP && totalDmg>0 && d.applyDamage && caN && d.damage!==''){
    const curHP=getCombatantHP(npcTargetP), maxHP=getCombatantHPMax(npcTargetP);
    const willApply=isNat20(d.roll)||(d.roll!==''&&d.roll!=null&&!isNat1(d.roll)&&totalN>=caN);
    if(willApply){
      const newHP=Math.max(0,curHP-totalDmg);
      hpPreviewHTML=`${liveEscape(getCombatantName(npcTargetP))}: HP ${curHP} → <strong class="${newHP===0?'hp-zero':''}">${newHP}</strong> / ${maxHP}`;
    } else if(d.roll!==''&&d.roll!=null){
      hpPreviewHTML=`<span class="muted">MISS — sin daño.</span>`;
    }
  }

  const dmgTypes=['slashing','piercing','bludgeoning','fire','cold','lightning','thunder','acid','poison','psychic','necrotic','radiant','force'];

  return `
    <div class="note-form npc-action-form">
      <div class="form-title">⚔ Acción — ${liveEscape(d.monsterName)}</div>

      ${attacksHTML}

      <div class="form-row">
        <label>Tipo de acción</label>
        <select class="form-input" onchange="updateFormField('actionType', this.value)">
          <option value="attack-melee" ${d.actionType==='attack-melee'?'selected':''}>Ataque cuerpo a cuerpo</option>
          <option value="attack-ranged" ${d.actionType==='attack-ranged'?'selected':''}>Ataque a distancia</option>
          <option value="ability" ${d.actionType==='ability'?'selected':''}>Habilidad especial</option>
          <option value="spell" ${d.actionType==='spell'?'selected':''}>Hechizo/efecto mágico</option>
          <option value="other" ${d.actionType==='other'?'selected':''}>Otra acción / narrativa</option>
        </select>
      </div>

      <div class="form-grid-halves">
        <div class="form-row">
          <label>Objetivo (jugador)</label>
          <select class="form-input" onchange="setSingleTarget(this.value)">${npcTargetOpts}</select>
        </div>
        <div class="form-row">
          <label>CA</label>
          <input type="number" class="form-input" placeholder="—" value="${liveEscape(npcDisplayCA)}" oninput="updateFormField('targetCA', this.value)">
        </div>
      </div>
      ${renderTargetConditionWarnings(npcTargetId)}
      ${(()=>{
        const tp = npcTargetId ? getCombatant(npcTargetId) : null;
        if(!tp || tp.kind !== 'player') return '';
        let w = '';
        if(tp.recklessThisTurn) w += `<div class="advantage-warning">⚔ ¡${liveEscape(getCombatantName(tp))} usó <strong>Ataque Imprudente</strong>! Este ataque tiene <strong>ventaja</strong>.<br><span class="disclaimer-box" style="display:inline-block;margin-top:0.3rem">🎲 Tirá 2d20 físicos y elegí el mayor.</span></div>`;
        if(tp.inRage) w += `<div class="rage-warning">😠 <strong>${liveEscape(getCombatantName(tp))} está en Furia</strong> — tiene resistencia a daño físico (slashing/piercing/bludgeoning). El daño efectivo se reduce a la mitad.</div>`;
        return w;
      })()}

      <div class="form-grid">
        <div class="form-row">
          <label>Tirada d20</label>
          <input type="number" class="form-input" min="1" max="20" placeholder="1-20" value="${liveEscape(d.roll)}" oninput="updateFormField('roll', this.value)">
        </div>
        <div class="form-row">
          <label>Modificador (+/-)</label>
          <input type="number" class="form-input" placeholder="+0" value="${liveEscape(d.modifier)}" oninput="updateFormField('modifier', this.value)">
        </div>
        <div class="form-row">
          <label>Total ataque</label>
          <div class="form-total-display"><span id="form-total">—</span></div>
        </div>
      </div>

      <div id="result-outcome-main" class="result-outcome-main ${outMainCls}">${outMainTxt}</div>

      <div class="form-grid">
        <div class="form-row">
          <label>Dado de daño</label>
          <input type="number" class="form-input" placeholder="ej: 7" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value); syncDamageTotal()">
        </div>
        <div class="form-row">
          <label>Bonus daño (auto)</label>
          <input type="number" class="form-input" placeholder="+0" value="${liveEscape(d.damageBonus)}" oninput="updateFormField('damageBonus', this.value); syncDamageTotal()">
        </div>
        <div class="form-row">
          <label>Total daño</label>
          <div class="form-total-display"><span id="damage-total">${dmgTotalDisplay}</span></div>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Tipo de daño</label>
          <select class="form-input" onchange="updateFormField('damageType', this.value)">
            ${dmgTypes.map(t=>`<option value="${t}" ${d.damageType===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-row form-checkbox-row">
          <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño al objetivo</label>
        </div>
      </div>
      <div id="result-hp-preview" class="result-hp-preview">${hpPreviewHTML}</div>

      <div class="form-row">
        <label>Notas / descripción</label>
        <textarea class="form-input form-textarea" placeholder="Qué hace el monstruo, cómo lo hace..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveNpcActionNote()">Guardar acción</button>
      </div>
    </div>
  `;
}

function saveNpcActionNote(){
  const d = currentForm.data;
  const roll = parseInt(d.roll)||0;
  const mod = parseInt(d.modifier)||0;
  const total = roll + mod;

  const targetIds = d.targetIds || [];
  const targetResults = targetIds.map(tid => {
    const p = getCombatant(tid);
    if(!p) return null;
    const threshold = parseInt(d.targetCA) || d.customDC || getCombatantAC(p);
    let outcome = null;
    if(isNat20(d.roll)) outcome = 'nat20';
    else if(isNat1(d.roll)) outcome = 'nat1';
    else if(d.roll!=='' && threshold) outcome = total >= parseInt(threshold) ? 'hit' : 'miss';
    const actualDmg = (parseInt(d.damage)||0) + (parseInt(d.damageBonus)||0);
    const hpBefore = getCombatantHP(p);
    let hpAfter = hpBefore;
    const dmgApplied = d.applyDamage && actualDmg > 0 && (outcome==='hit'||outcome==='nat20');
    if(dmgApplied){
      changeCombatantHP(tid, -actualDmg);
      hpAfter = getCombatantHP(p);
    }
    return { id: tid, name: getCombatantName(p), threshold, outcome, hpBefore, hpAfter, dmgApplied, damage: actualDmg };
  }).filter(Boolean);

  let outcomeGlobal = null;
  if(!targetIds.length){
    if(isNat20(d.roll)) outcomeGlobal = 'nat20';
    else if(isNat1(d.roll)) outcomeGlobal = 'nat1';
  }

  pushNote({
    type: 'npc-action',
    monsterName: d.monsterName,
    combatantId: d.combatantId,
    actionType: d.actionType,
    weapon: d.weapon,
    roll: d.roll,
    modifier: d.modifier,
    total: d.roll!=='' ? total : null,
    targetResults,
    outcome: outcomeGlobal,
    damageDice: d.damageDice,
    damage: (parseInt(d.damage)||0) + (parseInt(d.damageBonus)||0),
    damageType: d.damageType,
    notes: d.notes
  });
  const cid = d.combatantId;
  closeNoteForm();
  if(cid) markActed(cid);
  renderLive();
}

/* ── SALTAR TURNO ── */
function renderSkipTurnForm(){
  const d = currentForm.data;
  return `
    <div class="note-form skip-form">
      <div class="form-title">⏭ Saltar turno — ${liveEscape(d.combatantName)}</div>
      <div class="form-row">
        <label>Notas libres (opcional)</label>
        <textarea class="form-input form-textarea" placeholder="Aturdido, concentración, esperando, sin acción disponible..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>
      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveSkipTurnNote()">Saltar turno</button>
      </div>
    </div>
  `;
}

function saveSkipTurnNote(){
  const d = currentForm.data;
  pushNote({
    type: 'combat',
    subtype: 'skip',
    notes: `⏭ ${liveEscape(d.combatantName)} salta su turno.${d.notes ? ' ' + d.notes : ''}`
  });
  const cid = d.combatantId;
  closeNoteForm();
  if(cid) markActed(cid);
  renderLive();
}

function renderCombatForm(){
  const d = currentForm.data;
  return `
    <div class="note-form combat-form">
      <div class="form-title">+ Marcador de combate</div>
      <div class="form-row">
        <label>Tipo de marcador</label>
        <select class="form-input" onchange="updateFormField('subtype', this.value)">
          <option value="next-round" ${d.subtype==='next-round'?'selected':''}>Próximo round</option>
          <option value="start" ${d.subtype==='start'?'selected':''}>Iniciar combate</option>
          <option value="end" ${d.subtype==='end'?'selected':''}>Fin del combate</option>
          <option value="summary" ${d.subtype==='summary'?'selected':''}>Resumen / pausa</option>
          <option value="other" ${d.subtype==='other'?'selected':''}>Otro</option>
        </select>
      </div>
      <div class="form-row">
        <label>Descripción</label>
        <textarea class="form-input form-textarea" placeholder="Qué pasó en este momento del combate..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>
      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveCombatNote()">Guardar nota</button>
      </div>
    </div>
  `;
}

function renderNarrativeForm(){
  const d = currentForm.data;

  // Eventos disponibles para vincular: todos menos los "Hecho", en el orden de Campaña
  const availableEvents = (typeof CAMPAIGN !== 'undefined' && CAMPAIGN.events)
    ? CAMPAIGN.events.filter(e => e.status !== 'done')
    : [];

  const statusLabel = {planned:'planif.', 'in-progress':'en curso', idea:'idea'};
  const eventOpts = availableEvents.map(e => {
    const lbl = statusLabel[e.status] || e.status || '';
    const sesPart = e.session ? ` · Ses. ${e.session}` : '';
    return `<option value="${e.id}" ${d.eventId === e.id ? 'selected' : ''}>${liveEscape(e.title)}${sesPart} [${lbl}]</option>`;
  }).join('');

  const contextHint = d.eventId
    ? '<span style="color:var(--gold)">📋 Editando evento planificado.</span> Al guardar, este evento pasa a "en curso" en Campaña → Eventos. Los cambios de título/descripción actualizan el evento original.'
    : '<span style="color:var(--cream)">✦ Sin evento vinculado.</span> Al finalizar la sesión se va a crear un evento nuevo con estado "Hecho" en Campaña → Eventos.';

  return `
    <div class="note-form narrative-form">
      <div class="form-title">+ Nota narrativa</div>

      <div class="form-row">
        <label>Vincular a evento</label>
        <select class="form-input" onchange="selectNarrativeEvent(this.value)">
          <option value="">— No planificado (escribir libremente) —</option>
          ${eventOpts}
        </select>
        <p class="muted" style="font-size:0.8rem;margin-top:0.3rem;line-height:1.4">${contextHint}</p>
      </div>

      <div class="form-row">
        <label>Título</label>
        <input class="form-input" placeholder="ej: Llegada al claro" value="${liveEscape(d.title)}" oninput="updateFormField('title', this.value)">
      </div>
      <div class="form-row">
        <label>Texto</label>
        <textarea class="form-input form-textarea" style="min-height:120px" placeholder="Lo que pasó narrativamente..." oninput="updateFormField('text', this.value)">${liveEscape(d.text)}</textarea>
      </div>
      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveNarrativeNote()">Guardar nota</button>
      </div>
    </div>
  `;
}

/* Al elegir un evento del dropdown: prefill title + text con la data del evento.
   "No planificado" (value vacío): limpia los campos para escritura libre. */
function selectNarrativeEvent(eventId){
  if(!currentForm || currentForm.type !== 'narrative') return;
  currentForm.data.eventId = eventId;
  if(eventId && typeof CAMPAIGN !== 'undefined'){
    const e = CAMPAIGN.events.find(x => x.id === eventId);
    if(e){
      currentForm.data.title = e.title || '';
      currentForm.data.text = e.description || '';
    }
  } else {
    // "No planificado" → limpiar campos para input libre
    currentForm.data.title = '';
    currentForm.data.text = '';
  }
  renderNoteForm();
}

/* ── SAVE NOTE (con side effects) ── */
function saveActionNote(){
  const d = currentForm.data;

  // Side effect 1: consume spell slot si es hechizo nivelado
  if(d.actionType === 'spell' && d.spellName){
    const ok = consumeSpellSlot(d.character, parseInt(d.spellLevel)||1);
    if(!ok && !confirm('No quedan slots de ese nivel. ¿Guardar la nota igual?')) return;
  }

  // ── Modo Save Throw (spell con saveType) ──────────────────────────────────
  if(d.isSaveSpell){
    const dc = parseInt(d.saveDC) || calcSpellSaveDC(d.character);
    const rolls = d.targetSaveRolls || {};
    const overrides = d.targetSaveOverrides || {};
    const targetIds = d.targetIds || [];
    const targetResults = targetIds.map(tid => {
      const p = getCombatant(tid); if(!p) return null;
      const saveMod = getCombatantSaveMod(p, d.saveType) || 0;
      const roll = rolls[tid] || '';
      const total = roll !== '' ? parseInt(roll) + saveMod : null;
      const override = overrides[tid];
      let outcome;
      if(override) outcome = override;
      else if(total != null) outcome = total >= dc ? 'pass' : 'fail';
      else outcome = null;
      const hpBefore = getCombatantHP(p);
      let hpAfter = hpBefore;
      if(d.applyDamage && d.damage && outcome){
        const dmg = parseInt(d.damage) || 0;
        const actual = (outcome === 'fail') ? dmg : (d.halfOnSave ? Math.floor(dmg/2) : 0);
        if(actual > 0){ changeCombatantHP(tid, -actual); hpAfter = getCombatantHP(p); }
      }
      return { id: tid, name: getCombatantName(p), saveType: d.saveType, saveMod, roll, total, dc, outcome, hpBefore, hpAfter, halfOnSave: d.halfOnSave };
    }).filter(Boolean);

    // Aplicar efecto del spell (condiciones + concentración)
    const preset = CLASS_PRESETS[d.character];
    const spellData = (preset && preset.spellList||[]).find(s=>s.name===d.spellName) ||
                      (preset && preset.cantripsData||[]).find(s=>s.name===d.cantripName);
    const effect = spellData && spellData.effect;
    // Concentración en el caster
    const casterCombatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player' && p.refId===d.character);
    if(effect && effect.casterCondition === 'concentration' && casterCombatant){
      if(casterCombatant.concentration){
        // Ya concentrado — advertir pero no bloquear (el DM decidió lanzarlo)
        breakConcentration(casterCombatant.id);
      }
      applyConcentration(casterCombatant.id, d.spellName || d.cantripName, effect.duration || 10);
    }
    // Condición en los targets que fallaron el save
    if(effect && effect.targetConditionOnFail){
      targetResults.filter(r => r.outcome === 'fail').forEach(r => {
        applyCondition(r.id, effect.targetConditionOnFail, effect.duration || 10, d.spellName || d.cantripName, casterCombatant ? casterCombatant.id : null);
      });
    }

    pushNote({
      type:'action', character: d.character,
      actionType: d.actionType, spellName: d.spellName, spellLevel: d.spellLevel, cantripName: d.cantripName,
      isSaveSpell: true, saveType: d.saveType, saveDC: dc, halfOnSave: d.halfOnSave,
      targetResults, damage: d.damage, damageType: d.damageType, damageDice: d.damageDice, notes: d.notes
    });
    const trigId = d.triggeringCombatantId ||
      (LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===d.character)||{}).id;
    closeNoteForm();
    if(trigId) markActed(trigId);
    renderLive();
    return;
  }

  // ── Modo Ataque / Heal ─────────────────────────────────────────────────────
  const isHeal = d.damageType === 'healing';
  const total = (parseInt(d.roll)||0) + (parseInt(d.modifier)||0);
  const isAttack = !isHeal && (['attack-melee','attack-ranged'].includes(d.actionType) ||
                   (d.actionType==='spell' && spellRequiresAttack(d.spellName, d.character)) ||
                   (d.actionType==='cantrip' && cantripRequiresAttack(d.cantripName, d.character)));

  const targetIds = d.targetIds || [];
  const targetResults = targetIds.map(tid => {
    const p = getCombatant(tid);
    if(!p) return null;
    const hpBefore = getCombatantHP(p);
    let hpAfter = hpBefore;
    if(isHeal){
      if(d.applyDamage && d.damage){
        changeCombatantHP(tid, +(parseInt(d.damage)||0));
        hpAfter = getCombatantHP(p);
      }
      return { id: tid, name: getCombatantName(p), outcome: 'heal', hpBefore, hpAfter, dmgApplied: d.applyDamage && !!d.damage };
    }
    const threshold = parseInt(d.targetCA)||d.customDC||getCombatantAC(p);
    let outcome = null;
    if(isNat20(d.roll)) outcome = 'nat20';
    else if(isNat1(d.roll)) outcome = 'nat1';
    else if(d.roll!=='' && threshold) outcome = computeOutcome(total, parseInt(threshold), isAttack);
    const actualDmg = (parseInt(d.damage)||0) + (parseInt(d.damageBonus)||0);
    const dmgApplied = d.applyDamage && actualDmg > 0 && (outcome==='hit'||outcome==='nat20');
    if(dmgApplied){
      changeCombatantHP(tid, -actualDmg);
      hpAfter = getCombatantHP(p);
    }
    return { id: tid, name: getCombatantName(p), threshold, outcome, hpBefore, hpAfter, dmgApplied, damage: actualDmg };
  }).filter(Boolean);

  let outcomeGlobal = null;
  if(!targetIds.length){
    if(isNat20(d.roll)) outcomeGlobal = 'nat20';
    else if(isNat1(d.roll)) outcomeGlobal = 'nat1';
  }

  pushNote({
    type:'action',
    character: d.character,
    actionType: d.actionType,
    weapon: d.weapon,
    skill: d.skill,
    save: d.save,
    spellName: d.spellName,
    spellLevel: d.spellLevel,
    cantripName: d.cantripName,
    roll: d.roll,
    modifier: d.modifier,
    total: d.roll!=='' ? total : null,
    targetResults,
    outcome: outcomeGlobal,
    thresholdKind: isAttack ? 'ca' : 'dc',
    damage: (parseInt(d.damage)||0) + (parseInt(d.damageBonus)||0),
    damageType: d.damageType,
    notes: d.notes
  });
  // Set recklessThisTurn flag if Rac used Reckless Attack
  if(d.character === 'rac' && d.recklessAttack){
    const racC = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId==='rac');
    if(racC) racC.recklessThisTurn = true;
  }

  const trigId = d.triggeringCombatantId ||
    (LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===d.character)||{}).id;
  closeNoteForm();
  if(trigId) markActed(trigId);
  saveLiveSession();
  renderLive();
}

function saveNpcNote(){
  const d = currentForm.data;
  pushNote({
    type:'npc',
    npcId: d.npcId,
    npcName: d.npcId==='otro' ? d.otherName : d.npcId.charAt(0).toUpperCase()+d.npcId.slice(1),
    dialogue: d.dialogue,
    reaction: d.reaction
  });
  closeNoteForm();
  renderNotesStream();
}

function saveCombatNote(){
  const d = currentForm.data;
  pushNote({ type:'combat', subtype:d.subtype, notes:d.notes });
  closeNoteForm();
  renderNotesStream();
}

function saveNarrativeNote(){
  const d = currentForm.data;

  // Si está vinculada a un evento planificado: actualizar título/descripción del evento
  // y cambiar status a "en curso"
  if(d.eventId && typeof CAMPAIGN !== 'undefined'){
    const e = CAMPAIGN.events.find(x => x.id === d.eventId);
    if(e){
      e.title = d.title || e.title;
      e.description = d.text || e.description;
      e.status = 'in-progress';
      fetch(`/api/events/${d.eventId}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ title:e.title, description:e.description, status:'in-progress' })
      }).catch(err => console.error(err));
      if(typeof renderEvents === 'function') renderEvents();
    }
  }

  pushNote({
    type:'narrative',
    title: d.title,
    text: d.text,
    eventId: d.eventId || null
  });
  closeNoteForm();
  renderNotesStream();
}

/* ── LOOT (en Sesión Live, disparado desde combat tracker) ── */
function openLiveLootForm(combatId){
  const p = getCombatant(combatId);
  if(!p || p.kind !== 'monster'){ alert('El loot solo se tira sobre monstruos.'); return; }
  const preset = MONSTERS.find(x => x.id === p.refId);
  if(!preset || !Array.isArray(preset.loot) || preset.loot.length === 0){
    alert('Este monstruo no tiene loot table definida. Si es ad-hoc, agregalo manualmente al inventario del jugador.');
    return;
  }
  currentForm = {
    type:'loot',
    data:{
      combatId,
      monsterPresetId: preset.id,
      monsterName: getCombatantName(p),
      roll: '',
      modifier: '',
      drops: [],          // resultados al rolar
      assignments: {}     // {dropIdx: charId} para tracking de a quién se asignó cada drop
    }
  };
  renderNoteForm();
  // scroll al form
  setTimeout(()=>{
    const el = document.getElementById('note-form-container');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }, 50);
}

function renderLootForm(){
  const d = currentForm.data;
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  if(!preset) return '<div class="note-form"><div class="form-title">Error: monstruo no encontrado.</div></div>';

  // Tabla de loot del monstruo
  const lootTableHTML = `
    <table class="loot-table">
      <thead><tr><th>Item posible</th><th>Necesitás</th><th>Cantidad</th></tr></thead>
      <tbody>
        ${preset.loot.map(it=>{
          const isCrit = it.minRoll >= 20;
          const isGuaranteed = it.minRoll === 0;
          const cls = isCrit ? 'loot-crit' : (isGuaranteed ? 'loot-guaranteed' : '');
          const threshLabel = isGuaranteed ? 'Garantizado' : (isCrit ? 'NAT 20' : it.minRoll+'+');
          return `<tr class="${cls}">
            <td><div class="loot-name">${liveEscape(it.name)}</div>${it.note?`<div class="loot-note">${liveEscape(it.note)}</div>`:''}</td>
            <td class="loot-thresh"><strong>${threshLabel}</strong></td>
            <td class="loot-qty">${liveEscape(it.qty||'1')}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;

  return `
    <div class="note-form loot-form">
      <div class="form-title">🎲 Loot — ${liveEscape(d.monsterName)}</div>
      <p class="muted" style="font-size:0.82rem;margin-bottom:0.6rem">El jugador tira d20 físico. Lo que salga determina qué se salva del cuerpo. NAT 1 = pifia (nada). NAT 20 = se desbloquea trofeo único.</p>

      ${lootTableHTML}

      <div class="form-grid" style="margin-top:0.8rem">
        <div class="form-row">
          <label>Tirada d20</label>
          <input type="number" min="1" max="20" class="form-input" value="${liveEscape(d.roll)}" oninput="updateFormField('roll', this.value)" placeholder="1-20">
        </div>
        <div class="form-row">
          <label>Modificador (Survival, etc.)</label>
          <input type="number" class="form-input" value="${liveEscape(d.modifier)}" oninput="updateFormField('modifier', this.value)" placeholder="+0">
        </div>
        <div class="form-row">
          <label>Total</label>
          <div class="form-total-display"><span id="loot-form-total">—</span></div>
        </div>
      </div>

      <div id="loot-form-result" class="loot-result" style="margin-top:0.5rem"></div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" onclick="saveLootNote()">Guardar como nota en stream</button>
      </div>
    </div>
  `;
}

function updateLootFormResult(){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  if(!preset) return;
  const totalEl = document.getElementById('loot-form-total');
  const resultEl = document.getElementById('loot-form-result');
  if(!totalEl || !resultEl) return;

  const roll = parseInt(d.roll);
  const modV = parseInt(d.modifier) || 0;
  if(isNaN(roll) || roll < 1 || roll > 20){
    totalEl.textContent = '—';
    resultEl.innerHTML = '';
    d.drops = [];
    return;
  }
  const total = roll + modV;
  totalEl.textContent = total + (modV !== 0 ? ` (${roll}${modV>=0?'+':''}${modV})` : '');

  // Nat 1: pifia
  if(roll === 1){
    d.drops = [];
    resultEl.innerHTML = `
      <div class="loot-nat loot-nat1">✗ NAT 1 — Pifia. El cuerpo se destroza al intentar saquearlo. <strong>No se salva nada</strong> automáticamente.</div>
      <div class="loot-override-note">A menos que vos como DM lo decidas narrativamente. En ese caso, sumá el item a mano al inventario del personaje.</div>`;
    return;
  }

  // Evaluar drops (computados ahora — cantidades roladas solo la primera vez para no cambiar al re-render)
  const newDrops = [];
  preset.loot.forEach((it, idx)=>{
    const isNat20Item = it.minRoll >= 20;
    const isGuaranteed = it.minRoll === 0;
    let passes;
    if(isGuaranteed) passes = true;                  // siempre cae (no es NAT 1 — eso ya cortó antes)
    else if(isNat20Item) passes = (roll === 20);     // solo nat 20 natural
    else passes = (total >= it.minRoll);
    if(passes){
      // Si ya estaba rolado para este idx, conservar la cantidad (no re-rolar)
      const prev = d.drops.find(x => x.idx === idx);
      const qtyResult = prev ? prev.qty : rollQty(it.qty || '1');
      newDrops.push({ idx, item: it, qty: qtyResult });
    }
  });
  d.drops = newDrops;

  if(newDrops.length === 0){
    resultEl.innerHTML = `<div class="loot-empty">No se salvó nada con esa tirada (total ${total}). El monstruo se llevó sus secretos.</div>`;
    return;
  }

  const dropsHTML = newDrops.map(drop=>{
    const assignedTo = d.assignments[drop.idx];
    return `<div class="loot-drop">
      <span class="loot-drop-name">✓ ${liveEscape(drop.item.name)} × <strong>${liveEscape(drop.qty.label)}</strong></span>
      <div class="loot-drop-assign">
        <select id="loot-assign-${drop.idx}" ${assignedTo?'disabled':''}>
          ${CHARS.map(c=>`<option value="${c}" ${assignedTo===c?'selected':''}>Para ${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select>
        ${assignedTo
          ? `<button class="btn-small" disabled style="opacity:0.6">✓ Agregado a ${assignedTo.charAt(0).toUpperCase()+assignedTo.slice(1)}</button>`
          : `<button class="btn-small" onclick="assignLootFromForm(${drop.idx})">+ A su mochila</button>`}
      </div>
      ${drop.item.note ? `<div class="loot-drop-note">${liveEscape(drop.item.note)}</div>` : ''}
    </div>`;
  }).join('');
  const nat20Msg = roll === 20 ? `<div class="loot-nat loot-nat20">★ NAT 20 — Crítico. Encontrás incluso lo que normalmente sería inalcanzable.</div>` : '';
  resultEl.innerHTML = nat20Msg + `<div class="loot-drops-list">${dropsHTML}</div>`;
}

function assignLootFromForm(dropIdx){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const drop = d.drops.find(x => x.idx === dropIdx);
  if(!drop) return;
  const sel = document.getElementById('loot-assign-'+dropIdx);
  if(!sel) return;
  const dest = sel.value;
  const label = `${drop.item.name} ×${drop.qty.label} (loot de ${d.monsterName})`;
  const list = load('inv_'+dest, DEFAULT_INVENTORY[dest] || []);
  list.push(label);
  save('inv_'+dest, list);
  renderInventory(dest);
  // Marcar como asignado y re-renderizar el bloque de drops
  d.assignments[dropIdx] = dest;
  updateLootFormResult();
}

function saveLootNote(){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const roll = parseInt(d.roll);
  const modV = parseInt(d.modifier) || 0;
  const total = (isNaN(roll) ? 0 : roll) + modV;

  // Armar descripción narrativa de la tirada
  let lootSummary;
  if(isNaN(roll)){
    lootSummary = 'Sin tirada registrada.';
  } else if(roll === 1){
    lootSummary = `NAT 1 — pifia. No se salva nada del cuerpo.`;
  } else if(d.drops.length === 0){
    lootSummary = `Tirada ${total}. No se salvó nada del cuerpo.`;
  } else {
    const items = d.drops.map(drop=>{
      const who = d.assignments[drop.idx];
      return `• ${drop.item.name} × ${drop.qty.label}${who ? ` → ${who.charAt(0).toUpperCase()+who.slice(1)}` : ' (sin asignar)'}`;
    }).join('\n');
    lootSummary = `Tirada ${total}${modV?` (d20=${roll} + ${modV})`:''}.${roll===20?' ★ NAT 20':''}\n${items}`;
  }

  pushNote({
    type:'combat',
    subtype:'loot',
    notes:`Loot de ${d.monsterName}\n${lootSummary}`
  });
  closeNoteForm();
  renderNotesStream();
}

/* ── RENDER ── */
function renderLive(){
  const page = document.getElementById('page-live');
  if(!page) return;
  renderLiveHeader();
  renderCombatTracker();
  renderNotesStream();
  renderNoteForm();
}

function renderLiveHeader(){
  const el = document.getElementById('live-header-meta');
  if(!el) return;
  const m = LIVE_SESSION.meta;

  // Locations dropdown desde CAMPAIGN.locations
  const locations = (typeof CAMPAIGN !== 'undefined' && Array.isArray(CAMPAIGN.locations)) ? CAMPAIGN.locations : [];
  const locOpts = `<option value="">— sin ubicación —</option>` +
    locations.map(l => `<option value="${l.id}" ${m.locationId===l.id?'selected':''}>${liveEscape(l.name)}</option>`).join('');

  const curLocName = locations.find(l => l.id === m.locationId)?.name || '';
  const locDetail  = m.locationDetail ? ` · ${m.locationDetail}` : '';

  el.innerHTML = `
    <label class="live-meta-field dm-only"><span>Sesión #</span>
      <input type="number" min="1" value="${liveEscape(m.number)}" oninput="updateLiveMeta('number', parseInt(this.value)||1)">
    </label>
    <label class="live-meta-field dm-only"><span>Fecha</span>
      <input type="date" value="${liveEscape(m.date)}" oninput="updateLiveMeta('date', this.value)">
    </label>
    <div class="live-meta-field player-only" style="font-family:var(--font-title);font-size:0.75rem;color:var(--muted);letter-spacing:0.08em">
      Sesión #${liveEscape(String(m.number))} · ${liveEscape(m.date||'—')}
    </div>
    <div class="live-meta-field live-meta-presents" style="flex:1 1 100%">
      <span>Presentes
        <em class="dm-only" style="text-transform:none;font-style:normal;color:var(--muted);font-size:0.7rem">(click en la tarjeta para abrir la hoja · toggle ☑ para marcar presente/ausente)</em>
        <em class="player-only" style="text-transform:none;font-style:normal;color:var(--muted);font-size:0.7rem">(click en la tarjeta para abrir la hoja)</em>
      </span>
      <div class="presents-grid" id="live-presents-grid"></div>
    </div>
    <label class="live-meta-field dm-only"><span>Ubicación</span>
      <select onchange="updateLiveMeta('locationId', this.value)">${locOpts}</select>
    </label>
    <label class="live-meta-field dm-only live-meta-locdetail"><span>Detalle ubicación</span>
      <input type="text" placeholder="ej: Taberna de Reynera, claro al norte..." value="${liveEscape(m.locationDetail||'')}" oninput="updateLiveMeta('locationDetail', this.value)">
    </label>
    ${curLocName ? `<div class="live-meta-field player-only" style="font-family:var(--font-title);font-size:0.75rem;color:var(--muted);letter-spacing:0.08em">
      📍 ${liveEscape(curLocName)}${liveEscape(locDetail)}
    </div>` : ''}
    <button class="btn-finalize dm-only" onclick="finalizeSession()">Finalizar sesión ↗</button>

    <div class="live-group-actions dm-only">
      <div class="live-group-actions-label">Acciones del grupo:</div>
      <button class="btn-group-action" onclick="groupShortRest()" title="Short rest para todos los personajes">☾ Short rest grupal</button>
      <button class="btn-group-action" onclick="groupLongRest()" title="Long rest para todos los personajes">☽ Long rest grupal</button>
      <button class="btn-group-action btn-group-levelup" onclick="groupLevelUp()" title="Subir de nivel a todos los personajes">▲ Subir nivel grupal</button>
    </div>
  `;

  renderPresentsGrid();
}

/* ── PRESENTES (tarjetas clickeables) ── */
function getPresentChars(){
  const arr = LIVE_SESSION.meta.presentChars;
  if(Array.isArray(arr)) return arr;
  // default: todos presentes
  return CHARS.slice();
}

function isCharPresent(c){
  return getPresentChars().includes(c);
}

function togglePresentChar(c){
  const cur = getPresentChars();
  let next;
  if(cur.includes(c)) next = cur.filter(x => x !== c);
  else next = [...cur, c];
  LIVE_SESSION.meta.presentChars = next;
  // mantener meta.present (texto legacy) sincronizado para finalize/exports
  LIVE_SESSION.meta.present = next.map(x => x.charAt(0).toUpperCase()+x.slice(1)).join(', ');
  saveLiveSession();
  renderPresentsGrid();
}

function renderPresentsGrid(){
  const grid = document.getElementById('live-presents-grid');
  if(!grid) return;
  const labels = { rac:'Bárbaro', relyo:'Monje', tyrell:'Paladín', boyd:'Druida', esdas:'Wizard' };
  const icons = { rac:'🪓', relyo:'🥋', tyrell:'🛡', boyd:'🌿', esdas:'🔥' };
  grid.innerHTML = CHARS.map(c => {
    const present = isCharPresent(c);
    const hp = load('hp_'+c, getHPMax(c));
    const max = getHPMax(c);
    const pct = max > 0 ? Math.round((hp/max)*100) : 0;
    const barColor = pct <= 25 ? 'var(--red-bright)' : pct <= 50 ? '#e07020' : 'var(--green-bright)';
    const level = getCharLevel(c);
    return `<div class="present-card ${present?'is-present':'is-absent'}" onclick="openCharSheetModal('${c}')" title="Click para abrir la hoja de ${c.charAt(0).toUpperCase()+c.slice(1)}">
      <button class="present-toggle dm-only ${present?'on':''}" onclick="event.stopPropagation();togglePresentChar('${c}')" title="${present?'Presente · click para marcar ausente':'Ausente · click para marcar presente'}">${present?'☑':'☐'}</button>
      <div class="present-name">${icons[c]} ${c.charAt(0).toUpperCase()+c.slice(1)}</div>
      <div class="present-class">${labels[c]} · Nv ${level}</div>
      <div class="present-hp-bar"><div class="present-hp-fill" style="width:${pct}%;background:${barColor}"></div></div>
      <div class="present-hp-text">HP ${hp}/${max}</div>
    </div>`;
  }).join('');
}

/* ── CHAR SHEET MODAL ── */
function openCharSheetModal(c){
  if(CHAR_MODAL_STATE) closeCharSheetModal(); // por las dudas
  const node = document.getElementById('char-'+c);
  const body = document.getElementById('charModalBody');
  const modal = document.getElementById('charModal');
  if(!node || !body || !modal){ alert('No se encontró la hoja de '+c); return; }
  CHAR_MODAL_STATE = {
    c,
    originalParent: node.parentNode,
    originalNextSibling: node.nextSibling,
    originalDisplay: node.style.display || ''
  };
  body.appendChild(node);
  node.style.display = 'block';
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  // refrescar abilities por si cambió algo desde el último render
  if(typeof renderCharAbilities === 'function') renderCharAbilities(c);
}

function closeCharSheetModal(){
  const modal = document.getElementById('charModal');
  if(!CHAR_MODAL_STATE){
    if(modal) modal.classList.remove('show');
    document.body.style.overflow = '';
    return;
  }
  const { c, originalParent, originalNextSibling, originalDisplay } = CHAR_MODAL_STATE;
  const node = document.getElementById('char-'+c);
  if(node && originalParent){
    if(originalNextSibling && originalNextSibling.parentNode === originalParent){
      originalParent.insertBefore(node, originalNextSibling);
    } else {
      originalParent.appendChild(node);
    }
    node.style.display = originalDisplay;
  }
  if(modal) modal.classList.remove('show');
  document.body.style.overflow = '';
  CHAR_MODAL_STATE = null;
  // re-render presentes para refrescar HP en las tarjetas si cambió
  renderPresentsGrid();
}

/* ── GROUP ACTIONS ── */
function groupShortRest(){
  if(!confirm('¿Short rest GRUPAL? Restaura los recursos que recargan en short rest (Ki, Wild Shape) en TODOS los personajes.')) return;
  CHARS.forEach(c => {
    const preset = CLASS_PRESETS[c];
    if(!preset) return;
    (preset.resources||[]).forEach(r=>{
      if(r.restoresOn === 'short'){
        if(r.kind === 'pool') save('resource_'+c+'_'+r.key, r.max);
        else save('resource_'+c+'_'+r.key, 0);
      }
    });
    if(typeof renderCharAbilities === 'function') renderCharAbilities(c);
  });
  pushNote({ type:'combat', subtype:'other', notes:'☾ Short rest grupal — recursos de short rest restaurados para todo el grupo.' });
  renderNotesStream();
  renderPresentsGrid();
}

function groupLongRest(){
  if(!confirm('¿Long rest GRUPAL? Restaura HP máximo, slots, Rage/Ki/Lay on Hands/Wild Shape y todos los recursos diarios en TODOS los personajes.')) return;
  CHARS.forEach(c => {
    const preset = CLASS_PRESETS[c];
    if(!preset) return;
    // HP
    const inp = document.getElementById(c+'-hp');
    if(inp){ inp.value = getHPMax(c); updateHP(c); }
    else { save('hp_'+c, getHPMax(c)); }
    // Slots
    if(preset.spellSlots){
      Object.keys(preset.spellSlots).forEach(level=>save('slots_'+c+'_'+level, 0));
    }
    // Resources
    (preset.resources||[]).forEach(r=>{
      if(r.kind === 'pool') save('resource_'+c+'_'+r.key, r.max);
      else save('resource_'+c+'_'+r.key, 0);
    });
    if(typeof renderCharAbilities === 'function') renderCharAbilities(c);
  });
  pushNote({ type:'combat', subtype:'other', notes:'☽ Long rest grupal — HP, slots y recursos restaurados para todo el grupo.' });
  renderNotesStream();
  renderPresentsGrid();
}

function groupLevelUp(){
  // Pre-check: si alguien ya está a Nv 20, avisar
  const levels = CHARS.map(c => ({c, lvl: getCharLevel(c)}));
  const maxed = levels.filter(x => x.lvl >= 20);
  const targets = levels.filter(x => x.lvl < 20);
  if(targets.length === 0){ alert('Todos los personajes ya están a Nivel 20.'); return; }

  const summary = targets.map(x => `• ${x.c.charAt(0).toUpperCase()+x.c.slice(1)}: Nv ${x.lvl} → Nv ${x.lvl+1}`).join('\n');
  const skipped = maxed.length ? `\n\nSe saltean (ya están a Nv 20):\n${maxed.map(x=>`• ${x.c.charAt(0).toUpperCase()+x.c.slice(1)}`).join('\n')}` : '';
  if(!confirm(`¿Subir de nivel a TODOS los personajes?\n\n${summary}${skipped}\n\nHP máximo sube con el promedio del hit die + CON mod. Proficiency bonus se recalcula automáticamente.`)) return;

  const newLevels = [];
  targets.forEach(x => {
    const c = x.c;
    const oldLevel = getCharLevel(c);
    const newLevel = oldLevel + 1;
    const hpGain = hpGainOnLevelUp(c);
    const oldMax = getHPMax(c);
    const newMax = oldMax + hpGain;

    save('char_level_'+c, newLevel);
    save('hp_max_'+c, newMax);
    const curHP = load('hp_'+c, oldMax);
    save('hp_'+c, Math.min(newMax, curHP + hpGain));

    const inp = document.getElementById(c+'-hp');
    const spanMax = document.getElementById(c+'-hp-max');
    if(inp){ inp.max = newMax; inp.value = load('hp_'+c, newMax); }
    if(spanMax) spanMax.textContent = newMax;
    if(typeof updateHP === 'function') updateHP(c);

    const classEl = document.querySelector(`#char-${c} .char-class`);
    if(classEl) classEl.textContent = classEl.textContent.replace(/Nivel \d+/, 'Nivel '+newLevel);

    if(typeof renderCharAbilities === 'function') renderCharAbilities(c);
    newLevels.push(`${c.charAt(0).toUpperCase()+c.slice(1)} → Nv ${newLevel}`);
  });

  pushNote({
    type:'combat', subtype:'other',
    notes:`▲ Subida de nivel grupal\n${newLevels.map(s=>'• '+s).join('\n')}\n\nRevisar features narrativos pendientes (subclases, channel divinity, etc.) en las hojas.`
  });
  renderNotesStream();
  renderPresentsGrid();
  alert(`✓ Grupo subido de nivel.\n\n${newLevels.join('\n')}\n\nRevisá las hojas de personaje para features pendientes (subclases, cantrip damage, etc.).`);
}

/* Renderiza badges de condiciones + concentración de un combatiente */
function renderCombatantResources(charId){
  const lvl = getCharLevel(charId);
  const bits = [];

  // ── Recursos por clase ──
  const RES_META = {
    'rage':         { label:'😠 Furia',      suffix:'' },
    'ki':           { label:'🥋 Ki',          suffix:'' },
    'wild-shape':   { label:'🐺 Formas',      suffix:'' },
    'divine-sense': { label:'✨ Sent. Div.',   suffix:'' },
    'lay-on-hands': { label:'🤲 Manos',       suffix:' HP' }
  };
  const CHAR_RESOURCES = {
    rac:   ['rage'],
    relyo: ['ki'],
    boyd:  ['wild-shape'],
    tyrell:['divine-sense','lay-on-hands'],
    esdas: []
  };

  (CHAR_RESOURCES[charId] || []).forEach(key => {
    const max = getResourceMax(charId, key, lvl);
    if(!max) return;
    const used  = load('resource_'+charId+'_'+key, 0);
    const avail = Math.max(0, max - used);
    const m = RES_META[key] || { label: key, suffix: '' };
    bits.push(`<span class="res-pill${avail===0?' res-pill-empty':''}">${m.label} <strong>${avail}/${max}</strong>${m.suffix}</span>`);
  });

  // ── Spell slots (casters) ──
  const CASTERS = ['tyrell','esdas','relyo','boyd','tyrell'];
  if(['tyrell','esdas'].includes(charId)){
    const slots = getSpellSlotsForLevel(charId);
    Object.keys(slots).sort((a,b)=>+a-+b).forEach(lv => {
      const s = loadSlotState(charId, +lv);
      if(!s.max) return;
      const rem = s.max - s.used;
      const pips = Array.from({length:s.max},(_,i)=>
        `<span class="slot-pip${i<rem?'':' used'}"></span>`
      ).join('');
      bits.push(`<span class="slot-pill${rem===0?' slot-pill-empty':''}">Nv${lv} ${pips}</span>`);
    });
  }

  if(!bits.length) return '';
  return `<div class="combatant-resources">${bits.join('')}</div>`;
}

function renderCombatantConditions(p){
  const conds = p.conditions || [];
  const chips = conds.map(c => {
    const id   = typeof c === 'object' ? c.id   : c.toLowerCase();
    const name = typeof c === 'object' ? c.name : c;
    const nameEs = typeof c === 'object' ? c.nameEs : c;
    const left = typeof c === 'object' && c.turnsLeft != null ? c.turnsLeft : null;
    const meta = getCondition(id);
    const icon  = meta ? meta.icon  : '⚠';
    const color = meta ? meta.color : '#6b7280';
    const label = `${icon} ${name} / ${nameEs}${left != null ? ` (${left}r)` : ''}`;
    const title = meta ? meta.desc : name;
    return `<span class="cond-chip" style="--cond-color:${color}" title="${liveEscape(title)}"
      onclick="removeCondition('${liveEscape(p.id)}','${id}')" title="Click para quitar">${liveEscape(label)}</span>`;
  }).join('');

  // Badge de concentración
  const concBadge = p.concentration ? `<span class="cond-chip cond-concentration"
    title="${liveEscape('Concentración en ' + p.concentration.spellName)}"
    onclick="if(confirm('¿Romper concentración en ${liveEscape(p.concentration.spellName)}?')) breakConcentration('${liveEscape(p.id)}')">
    ◎ ${liveEscape(p.concentration.spellName)} (${p.concentration.turnsLeft}r)
  </span>` : '';

  // Input manual solo para monstruos
  const manualInput = p.kind === 'monster' ? `
    <input class="combatant-cond-input" placeholder="+ condición manual (coma)"
      onchange="setCombatantCondition('${liveEscape(p.id)}', this.value); this.value=''">` : '';

  if(!chips && !concBadge && !manualInput) return '';
  return `<div class="combatant-conditions">${concBadge}${chips}${manualInput}</div>`;
}

function renderCombatTracker(){
  const stateEl = document.getElementById('combat-state');
  const listEl = document.getElementById('combat-list');
  const pickerEl = document.getElementById('monster-picker');
  if(!stateEl || !listEl) return;

  const cmb = LIVE_SESSION.combat;
  const alive = cmb.participants.filter(p => getCombatantHP(p) > 0);
  const pending = alive.filter(p => !p.actedThisRound);
  const acted  = alive.filter(p => p.actedThisRound);

  // ── State header ──
  if(combatStartPending){
    stateEl.innerHTML = `
      <div class="combat-start-form dm-only">
        <div class="form-title" style="margin-bottom:0.5rem">🗡 Describir inicio de combate</div>
        <p class="muted" style="font-size:0.8rem;margin-bottom:0.5rem">Cómo comenzó el encuentro, dónde están, qué provocó el combate...</p>
        <textarea class="form-input form-textarea" style="min-height:60px" placeholder="ej: Los bandidos saltan desde los arbustos, el Comandante da la orden de ataque..."
          oninput="combatStartNotes = this.value"></textarea>
        <div class="form-btns" style="margin-top:0.5rem">
          <button class="btn-cancel" onclick="cancelStartCombat()">Cancelar</button>
          <button class="btn-primary" onclick="confirmStartCombat()">Iniciar combate</button>
        </div>
      </div>`;
  } else if(cmb.active){
    const pendingCount = pending.length;
    const actedCount = acted.length;
    stateEl.innerHTML = `
      <div class="combat-state-active">
        <div class="combat-round-block">
          <span class="combat-round-label">ROUND</span>
          <span class="combat-round-num">${cmb.round}</span>
        </div>
        <div class="combat-turn-status">
          <span class="${pendingCount > 0 ? 'turn-pending' : 'turn-done'}">
            ${pendingCount > 0 ? `${pendingCount} sin actuar` : '✓ Todos actuaron'}
          </span>
          ${actedCount > 0 && pendingCount > 0 ? `<span class="muted" style="font-size:0.75rem">${actedCount} actuaron</span>` : ''}
        </div>
        <div class="combat-state-buttons dm-only">
          <button class="btn-small btn-force-round" onclick="forceNextRound()" title="Forzar inicio del siguiente round">⏭ Forzar round</button>
          <button class="btn-small" onclick="toggleCombatActive()">Terminar combate</button>
        </div>
      </div>`;
  } else {
    stateEl.innerHTML = `
      <div class="combat-state-inactive">
        <span class="muted">Sin combate activo</span>
        <span class="dm-only">
          ${cmb.participants.length > 0
            ? `<button class="btn-primary" onclick="toggleCombatActive()">Iniciar combate</button>`
            : `<span class="muted" style="font-size:0.8rem">Agregá combatientes primero</span>`}
        </span>
      </div>`;
  }

  // ── Lista de combatientes ──
  if(cmb.participants.length === 0){
    listEl.innerHTML = '<div class="muted" style="padding:1rem;font-size:0.85rem">Sin combatientes. Usá los botones de arriba para agregar.</div>';
  } else {
    listEl.innerHTML = cmb.participants.map(p => {
      const hp = getCombatantHP(p);
      const max = getCombatantHPMax(p);
      const dead = hp <= 0;
      const ac = getCombatantAC(p);
      const hpPct = max > 0 ? (hp/max)*100 : 0;
      const hpColor = hpPct <= 25 ? 'var(--red-bright)' : hpPct <= 50 ? '#e07020' : 'var(--green-bright)';
      const acted = !!p.actedThisRound;

      // Botón de acción (solo durante combate activo y no muerto)
      let actionBtn = '';
      if(cmb.active && !dead){
        if(!acted){
          actionBtn = `
            <button class="combatant-act" onclick="actCombatant('${p.id}')" title="Registrar acción de este combatiente">⚔</button>
            <button class="combatant-skip" onclick="skipCombatant('${p.id}')" title="Saltar turno">⏭</button>`;
        } else {
          actionBtn = `<span class="combatant-acted-badge" title="Ya actuó este round">✓</span>`;
        }
      }

      const hasLootPreset = p.kind === 'monster' && p.refId !== 'adhoc' &&
                            MONSTERS.find(x => x.id === p.refId && Array.isArray(x.loot) && x.loot.length);
      const lootBtn = hasLootPreset
        ? `<button class="combatant-loot" onclick="openLiveLootForm('${p.id}')" title="Tirar loot">🎲</button>`
        : '';

      // Wild Shape: mostrar HP bestia + HP originales de Boyd
      const isWild = p.kind==='player' && p.wildShape && p.wildShape.active;
      const wildShapeBlock = isWild ? `
        <div class="wild-shape-hp-block dm-only">
          <span class="ws-label">🐺 ${liveEscape(p.wildShape.beastName)}</span>
          <div class="combatant-hp">
            <button class="vital-btn vital-btn-sm" onclick="changeWildShapeHP('${p.id}',-1)">−</button>
            <input class="combatant-hp-val" type="number" value="${p.wildShape.beastHP}" min="0" max="${p.wildShape.beastHPMax}" onchange="setWildShapeHP('${p.id}', this.value)">
            <span class="combatant-hp-max">/${p.wildShape.beastHPMax} (bestia)</span>
            <button class="vital-btn vital-btn-sm" onclick="changeWildShapeHP('${p.id}',1)">+</button>
          </div>
          <div style="font-size:0.75rem;color:var(--cream-muted);margin-top:0.2rem">HP Boyd (guardados): ${p.wildShape.originalHP}</div>
          <button class="btn-small btn-danger" style="margin-top:0.3rem" onclick="endWildShapeBtn('${p.id}')">Salir de Forma Salvaje</button>
        </div>
      ` : '';
      const rageBadge  = (p.kind==='player' && p.inRage) ? `<span class="rage-badge" title="En Furia (${p.rageTurnsLeft||0} rounds)">😠 FURIA</span>` : '';
      const recklessBadge = (p.kind==='player' && p.recklessThisTurn) ? `<span class="reckless-badge" title="Usó Ataque Imprudente — enemigos con ventaja">⚔ RECKLESS</span>` : '';

      const cardClick = p.kind==='player'
        ? `onclick="combatantCardClick(event,'${p.refId}')"`
        : '';
      return `
        <div class="combatant ${p.kind} ${acted?'has-acted':''} ${dead?'is-dead':''} ${isWild?'is-wild-shape':''}" ${cardClick}>
          <div class="combatant-row1">
            <input class="combatant-init dm-only" type="number" value="${p.initiative||0}" title="Iniciativa" onchange="setCombatantInit('${p.id}', this.value)">
            <span class="combatant-name">${liveEscape(getCombatantName(p))}${p.kind==='player'?' <em>(Pj)</em>':''}${rageBadge}${recklessBadge}</span>
            <div class="combatant-action-btns dm-only">${actionBtn}</div>
            <span class="dm-only">${lootBtn}</span>
            <button class="combatant-del dm-only" onclick="removeCombatant('${p.id}')" title="Sacar del combate">✕</button>
          </div>
          ${wildShapeBlock}
          <div class="combatant-row2 dm-only" ${isWild?'style="display:none"':''}>
            <div class="combatant-hp">
              <button class="vital-btn vital-btn-sm" onclick="changeCombatantHP('${p.id}',-1)">−</button>
              <input class="combatant-hp-val" type="number" value="${hp}" min="0" max="${max}" onchange="setCombatantHP('${p.id}', this.value)">
              <span class="combatant-hp-max">/${max}</span>
              <button class="vital-btn vital-btn-sm" onclick="changeCombatantHP('${p.id}',1)">+</button>
            </div>
            <span class="combatant-ac">CA ${ac}</span>
          </div>
          <div class="combatant-hp-bar"><div class="hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
          ${p.kind==='player' ? renderCombatantResources(p.refId) : ''}
          ${renderCombatantConditions(p)}
        </div>
      `;
    }).join('');
  }

  // Monster picker (si está abierto)
  if(pickerEl){
    if(currentMonsterPickerOpen){
      pickerEl.innerHTML = `
        <div class="monster-picker-box">
          <div class="form-title">Elegir del Bestiario</div>
          ${MONSTERS.map(m=>`
            <div class="monster-pick-row">
              <span class="monster-pick-name">${liveEscape(m.name)} <em class="muted">(${m.size} ${m.type}, CR ${m.cr}, HP ${m.hpMax}, CA ${m.ac})</em></span>
              <label class="monster-pick-count">cant: <input type="number" min="1" max="20" value="1" id="pick-${m.id}-count"></label>
              <button class="btn-small" onclick="addMonsterFromBestiary('${m.id}', document.getElementById('pick-${m.id}-count').value)">+ Agregar</button>
            </div>
          `).join('')}
          <div class="form-btns"><button class="btn-cancel" onclick="closeMonsterPicker()">Cerrar</button></div>
        </div>
      `;
      pickerEl.classList.add('show');
    } else {
      pickerEl.innerHTML = '';
      pickerEl.classList.remove('show');
    }
  }
}

function renderNotesStream(){
  const el = document.getElementById('notes-stream');
  if(!el) return;
  const notes = LIVE_SESSION.notes || [];
  if(notes.length === 0){
    el.innerHTML = '<div class="muted" style="padding:1.5rem;text-align:center">Sin notas todavía. Usá los botones de arriba para empezar a registrar.</div>';
    return;
  }
  el.innerHTML = buildGroupedStream(notes);
}

/* Agrupa el stream en capítulos:
   • Cada narrativa es un "capítulo header".
   • Las notas siguientes (en orden cronológico) se agrupan bajo la narrativa
     que tenían activa cuando se crearon (campo narrativeId).
   • Notas previas a cualquier narrativa → sección "Sin evento narrativo".
   • Narrativa sin hijos → badge "Puramente narrativo".
   Las notas están guardadas newest-first; para agrupar correctamente
   construimos el orden cronológico (reverse), agrupamos, y mostramos newest-first. */
// Lista de narrativas disponibles para el select de "mover a capítulo" — se
// puebla en buildGroupedStream y se consume en renderNoteCard.
let _streamNarratives = [];

function buildGroupedStream(notes){
  // Orden cronológico (oldest first)
  const chrono = notes.slice().reverse();

  // Construir capítulos: un array de { narrative, children[] }
  const chapters = [];
  let preNarrative = [];  // notas antes de la primera narrativa de la sesión

  // Map de id → chapter para lookup rápido
  const chapterMap = {};

  // Pase 1: construir el mapa completo de narrativas (preserva orden cronológico)
  chrono.forEach(n => {
    if(n.type === 'narrative'){
      const ch = { narrative: n, children: [] };
      chapters.push(ch);
      chapterMap[n.id] = ch;
    }
  });

  // Pase 2: asignar hijos — chapterMap ya tiene TODOS los capítulos,
  // incluso los más nuevos que el hijo (fix para reasignación entre eventos)
  chrono.forEach(n => {
    if(n.type !== 'narrative'){
      const navId = n.narrativeId;
      if(navId && chapterMap[navId]){
        chapterMap[navId].children.push(n);
      } else {
        preNarrative.push(n);
      }
    }
  });

  // Exponer narrativas para el select de reasignación
  _streamNarratives = chapters.map(ch => ch.narrative);

  // Renderizar newest-first:
  const parts = [];

  // notas sueltas (pre-narrativa) — newest first
  if(preNarrative.length > 0){
    const preHtml = preNarrative.slice().reverse().map(n => renderNoteCard(n)).join('');
    parts.push(`<div class="narrative-chapter chapter-pre">
      <div class="narrative-chapter-hdr chapter-pre-hdr">
        <span class="chap-icon">·</span>
        <span class="chap-title muted" style="font-style:italic">Sin evento narrativo</span>
      </div>
      <div class="narrative-chapter-body">${preHtml}</div>
    </div>`);
  }

  // capítulos, más reciente primero
  chapters.slice().reverse().forEach(ch => {
    const isPureNarrative = ch.children.length === 0;
    const childrenHtml = ch.children.length > 0
      ? ch.children.slice().reverse().map(n => renderNoteCard(n)).join('')
      : '';
    parts.push(`<div class="narrative-chapter ${isPureNarrative?'chapter-pure':''}">
      ${renderNarrativeChapterHeader(ch.narrative, isPureNarrative)}
      ${childrenHtml ? `<div class="narrative-chapter-body">${childrenHtml}</div>` : ''}
    </div>`);
  });

  return parts.join('');
}

/* ── Reordenar y reasignar notas ─────────────────────────────────────────────
   moveNote(id, 'up'|'down')   — sube/baja dentro del mismo capítulo
   moveChapter(id, 'up'|'down') — sube/baja la narrativa completa
   moveNoteToChapter(noteId, targetNavId) — cambia el capítulo de una nota      */

function moveNote(id, dir){
  const notes = LIVE_SESSION.notes;
  const noteIdx = notes.findIndex(n => n.id === id);
  if(noteIdx < 0) return;
  const grpId = notes[noteIdx].narrativeId || '__pre__';

  // Recopilar los slots del grupo en orden de display (top→bottom).
  // El stream muestra newest-first: índice array más bajo → top.
  // ↑ (arriba en el stream) = más reciente = índice array menor.
  // El array group está en orden ASCENDENTE de slot → group[0] = top.
  const group = [];
  notes.forEach((n, i) => {
    if(n.type !== 'narrative' && (n.narrativeId || '__pre__') === grpId)
      group.push(i);
  });

  const pos = group.indexOf(noteIdx);
  if(pos < 0) return;

  // ↑ = mover hacia arriba en el stream = hacia índice más bajo = pos-1
  // ↓ = mover hacia abajo en el stream = hacia índice más alto = pos+1
  const targetPos = dir === 'up' ? pos - 1 : pos + 1;
  if(targetPos < 0 || targetPos >= group.length) return;

  const slotA = group[pos];
  const slotB = group[targetPos];
  const temp  = notes[slotA];
  notes[slotA] = notes[slotB];
  notes[slotB] = temp;

  saveLiveSession();
  renderNotesStream();
}

function moveChapter(id, dir){
  const notes = LIVE_SESSION.notes;

  // Recopilar los slots de narrativas en orden ASCENDENTE (newest = top)
  const chapSlots = [];
  notes.forEach((n, i) => {
    if(n.type === 'narrative') chapSlots.push(i);
  });

  const pos = chapSlots.findIndex(slot => notes[slot].id === id);
  if(pos < 0) return;

  // ↑ = capítulo más arriba en el stream = más reciente = índice menor = pos-1
  // ↓ = más abajo = más antiguo = índice mayor = pos+1
  const targetPos = dir === 'up' ? pos - 1 : pos + 1;
  if(targetPos < 0 || targetPos >= chapSlots.length) return;

  const slotA = chapSlots[pos];
  const slotB = chapSlots[targetPos];
  const temp  = notes[slotA];
  notes[slotA] = notes[slotB];
  notes[slotB] = temp;

  saveLiveSession();
  renderNotesStream();
}

function moveNoteToChapter(noteId, targetNavId){
  const note = LIVE_SESSION.notes.find(n => n.id === noteId);
  if(!note) return;
  note.narrativeId = targetNavId === '__pre__' ? null : targetNavId;
  saveLiveSession();
  renderNotesStream();
}

function renderNarrativeChapterHeader(n, isPureNarrative){
  const time = n.timeLabel || '';
  const statusLabel = n.eventId ? '📋 planif.' : '✦ libre';
  const pureLabel = isPureNarrative
    ? `<span class="chap-pure-badge">Solo narrativo</span>`
    : '';
  return `<div class="narrative-chapter-hdr" id="chap-${n.id}">
    <span class="chap-icon">✦</span>
    <div class="chap-title-block">
      <span class="chap-title">${liveEscape(n.title||'Evento narrativo')}</span>
      ${n.text ? `<span class="chap-text">${liveEscape(n.text)}</span>` : ''}
    </div>
    <div class="chap-meta">
      <span class="chap-time">${liveEscape(time)}</span>
      <span class="chap-status">${statusLabel}</span>
      ${pureLabel}
    </div>
    <div class="note-reorder-btns dm-only">
      <button class="note-reorder" onclick="moveChapter('${n.id}','up')" title="Subir capítulo">↑</button>
      <button class="note-reorder" onclick="moveChapter('${n.id}','down')" title="Bajar capítulo">↓</button>
    </div>
    <button class="note-del dm-only" onclick="deleteNote('${n.id}')" title="Borrar narrativa">✕</button>
  </div>`;
}

function renderNoteCard(n){
  const time = n.timeLabel || (n.timestamp ? new Date(n.timestamp).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}) : '');
  let icon='', body='';
  if(n.type === 'class-ability'){
    icon = '⚡';
    const charLabel = n.character ? n.character.charAt(0).toUpperCase()+n.character.slice(1) : '—';
    body = `<div class="note-title"><strong>${charLabel}</strong> — ${liveEscape(n.abilityName||'Habilidad')}</div>
      ${n.notes ? `<div class="note-text" style="white-space:pre-line">${liveEscape(n.notes)}</div>` : ''}`;
  } else if(n.type === 'action'){
    icon = '⚔';
    body = renderActionNoteBody(n);
  } else if(n.type === 'npc-action'){
    icon = '👹';
    body = renderNpcActionNoteBody(n);
  } else if(n.type === 'conversation'){
    icon = '💬';
    body = renderConversationNoteBody(n);
  } else if(n.type === 'npc'){
    // legacy notas viejas (modelo previo a Conversación multi-turno)
    icon = '🗣';
    body = `<div class="note-title">${liveEscape(n.npcName||'NPC')}</div>
      <div class="note-text">${liveEscape(n.dialogue||'')}</div>
      ${n.reaction ? `<div class="note-sub"><strong>Reacción del grupo:</strong> ${liveEscape(n.reaction)}</div>` : ''}`;
  } else if(n.type === 'combat'){
    icon = n.subtype === 'loot' ? '🎲' : (n.subtype === 'skip' ? '⏭' : '🛡');
    const subtypeLabels = {'next-round':'PRÓXIMO ROUND','start':'INICIO DE COMBATE','end':'FIN DE COMBATE','summary':'RESUMEN','loot':'LOOT','skip':'TURNO SALTEADO','other':'COMBATE'};
    body = `<div class="note-title">${subtypeLabels[n.subtype]||'Combate'}</div>
      ${n.notes ? `<div class="note-text" style="white-space:pre-line">${liveEscape(n.notes)}</div>` : ''}`;
  } else { // narrative
    icon = '✦';
    body = `${n.title ? `<div class="note-title">${liveEscape(n.title)}</div>` : ''}
      <div class="note-text">${liveEscape(n.text||'')}</div>`;
  }
  // Controles de reordenamiento + reasignación de capítulo (dm-only)
  const navOpts = _streamNarratives.map(nav =>
    `<option value="${nav.id}" ${n.narrativeId===nav.id?'selected':''}>${liveEscape((nav.title||'Narrativa').substring(0,30))}</option>`
  ).join('');
  const chapterCtrl = `
    <select class="note-chapter-sel dm-only" title="Mover a otro capítulo"
      onchange="moveNoteToChapter('${n.id}',this.value)">
      <option value="__pre__" ${!n.narrativeId?'selected':''}>Sin narrativa</option>
      ${navOpts}
    </select>`;

  return `
    <div class="note-card note-${n.type}">
      <div class="note-meta">
        <span class="note-icon">${icon}</span>
        <span class="note-time">${liveEscape(time)}</span>
        <div class="note-reorder-btns dm-only">
          <button class="note-reorder" onclick="moveNote('${n.id}','up')" title="Subir nota">↑</button>
          <button class="note-reorder" onclick="moveNote('${n.id}','down')" title="Bajar nota">↓</button>
        </div>
        ${chapterCtrl}
        <button class="note-del dm-only" onclick="deleteNote('${n.id}')" title="Borrar nota">✕</button>
      </div>
      <div class="note-body">${body}</div>
    </div>
  `;
}

function speakerLabel(ex){
  if(!ex) return '—';
  if(ex.speakerKind === 'npc'){
    if(ex.speaker === 'otro') return ex.speakerOther || 'NPC nuevo';
    return (ex.speaker || '').charAt(0).toUpperCase() + (ex.speaker || '').slice(1);
  }
  if(ex.speakerKind === 'char') return (ex.speaker || '').charAt(0).toUpperCase() + (ex.speaker || '').slice(1);
  if(ex.speakerKind === 'narrator') return 'Narrador';
  if(ex.speakerKind === 'group') return 'El grupo';
  return ex.speaker || '—';
}

function renderConversationNoteBody(n){
  const title = n.title || 'Conversación';
  const ctx = n.context ? `<div class="note-sub conv-context">📍 ${liveEscape(n.context)}</div>` : '';
  const lines = (n.exchanges || []).map(ex => {
    const kind = ex.speakerKind || 'npc';
    return `<div class="conv-bubble bubble-${kind}">
      <div class="conv-bubble-speaker">${liveEscape(speakerLabel(ex))}</div>
      <div class="conv-bubble-text">${liveEscape(ex.text||'')}</div>
    </div>`;
  }).join('');
  return `<div class="note-title">${liveEscape(title)}</div>
    ${ctx}
    <div class="conv-thread">${lines}</div>`;
}

function renderTargetResultsBlock(targetResults, damage, damageType, damageDice){
  if(!targetResults || !targetResults.length) return '';
  const outcomeLabels = { hit:'HIT!', miss:'MISS', pass:'PASS', fail:'FAIL', nat20:'★ NAT 20', nat1:'✗ NAT 1' };
  const diceLabel = damageDice ? `<span class="note-dice">${liveEscape(damageDice)}</span> = ` : '';
  return `<div class="note-target-results">
    ${targetResults.map(r => {
      const cls = r.outcome || '';
      const outcomeTxt = outcomeLabels[r.outcome] || '—';
      // Save throw note: mostrar stat save, tirada y total
      if(r.saveType != null){
        const modLabel = r.saveMod != null ? (r.saveMod >= 0 ? `+${r.saveMod}` : String(r.saveMod)) : '';
        const rollTxt = r.roll != null && r.roll !== '' ? `d20 ${r.roll}${modLabel} = ${r.total}` : '—';
        const dcTxt = `DC ${r.dc}`;
        const hpChange = r.hpAfter !== r.hpBefore ? ` <span class="note-hp-change">${r.hpBefore}→${r.hpAfter} HP</span>` : '';
        const dmgNote = r.hpAfter !== r.hpBefore && damage
          ? ` — ${diceLabel}<strong>${r.outcome==='pass' && r.halfOnSave ? Math.floor(parseInt(damage)/2) : damage}</strong> ${damageType||''}${hpChange}` : '';
        return `<div class="note-target-row">
          <span class="note-target-name">${liveEscape(r.name)}</span>
          <span class="note-target-ca muted">${(r.saveType||'').toUpperCase()} save · ${dcTxt}</span>
          <span class="muted" style="font-size:0.75rem">${rollTxt}</span>
          <span class="outcome-badge ${cls}">${outcomeTxt}</span>${dmgNote}
        </div>`;
      }
      // Attack note
      const hpChange = r.dmgApplied ? ` <span class="note-hp-change">${r.hpBefore}→${r.hpAfter} HP</span>` : '';
      const dmgDisplay = r.damage != null ? r.damage : damage;
      const dmgTxt = r.dmgApplied && dmgDisplay ? ` — ${diceLabel}<strong>${dmgDisplay}</strong> ${damageType||''}${hpChange}` : '';
      return `<div class="note-target-row">
        <span class="note-target-name">${liveEscape(r.name)}</span>
        <span class="note-target-ca muted">CA ${r.threshold}</span>
        <span class="outcome-badge ${cls}">${outcomeTxt}</span>${dmgTxt}
      </div>`;
    }).join('')}
  </div>`;
}

function renderNpcActionNoteBody(n){
  const actionLabels = {'attack-melee':'ataque cuerpo a cuerpo','attack-ranged':'ataque a distancia','ability':'habilidad especial','spell':'hechizo/efecto','other':'acción'};
  const what = actionLabels[n.actionType] || n.actionType || 'acción';
  const weaponLabel = n.weapon ? `<span class="note-weapon-badge">${liveEscape(n.weapon)}</span> ` : '';
  let rollLine = '';
  if(n.roll !== '' && n.roll != null){
    rollLine = `<div class="note-roll">
      d20: <strong>${n.roll}</strong> ${n.modifier ? (parseInt(n.modifier)>=0?'+':'')+n.modifier : ''} = <strong>${n.total}</strong>
    </div>`;
  }
  const targetsBlock = renderTargetResultsBlock(n.targetResults, n.damage, n.damageType, n.damageDice);
  // Legacy: notas viejas con targetName/outcome directo
  const legacyOutcome = !n.targetResults && n.outcome
    ? `<span class="outcome-badge ${n.outcome}">${{hit:'HIT!',miss:'MISS',nat20:'★ NAT 20',nat1:'✗ NAT 1'}[n.outcome]||n.outcome}</span>` : '';
  return `
    <div class="note-title">${weaponLabel}<strong>${liveEscape(n.monsterName||'NPC')}</strong> ${what}</div>
    ${rollLine}${legacyOutcome}
    ${targetsBlock}
    ${n.notes ? `<div class="note-sub">${liveEscape(n.notes)}</div>` : ''}
  `;
}

function renderActionNoteBody(n){
  const charLabel = n.character ? n.character.charAt(0).toUpperCase()+n.character.slice(1) : '—';
  const actionLabels = {
    'attack-melee':'ataque cuerpo a cuerpo',
    'attack-ranged':'ataque a distancia',
    'skill':'skill check',
    'save':'saving throw',
    'spell':'lanza hechizo',
    'cantrip':'lanza cantrip',
    'other':'acción libre'
  };
  let what = actionLabels[n.actionType] || n.actionType;
  if(n.actionType==='skill' && n.skill) what = `skill check (${n.skill})`;
  if(n.actionType==='save' && n.save) what = `saving throw (${n.save.toUpperCase()})`;
  if(n.actionType==='spell' && n.spellName) what = `lanza ${n.spellName} (Nv ${n.spellLevel})`;
  if(n.actionType==='cantrip' && n.cantripName) what = `lanza ${n.cantripName} (cantrip)`;
  if((n.actionType==='attack-melee'||n.actionType==='attack-ranged') && n.weapon) what += ` con ${n.weapon}`;

  let rollLine = '';
  if(n.roll !== '' && n.roll != null){
    rollLine = `<div class="note-roll">
      d20: <strong>${n.roll}</strong> ${n.modifier ? (parseInt(n.modifier)>=0?'+':'')+n.modifier : ''} = <strong>${n.total}</strong>
    </div>`;
  }

  const targetsBlock = renderTargetResultsBlock(n.targetResults, n.damage, n.damageType, n.damageDice);

  // Legacy: notas viejas con targetName/threshold/outcome directo
  let legacyBlock = '';
  if(!n.targetResults && (n.targetName || n.outcome)){
    const outcomeLabels = { hit:'HIT!', miss:'MISS', pass:'PASS', fail:'FAIL', nat20:'★ NAT 20', nat1:'✗ NAT 1' };
    legacyBlock = `<div class="note-target-row">
      ${n.targetName ? `<span class="note-target-name">${liveEscape(n.targetName)}</span>` : ''}
      ${n.threshold != null ? `<span class="note-target-ca muted">${n.thresholdKind==='ca'?'CA':'DC'} ${n.threshold}</span>` : ''}
      ${n.outcome ? `<span class="outcome-badge ${n.outcome}">${outcomeLabels[n.outcome]||n.outcome}</span>` : ''}
      ${n.damageApplied && n.damage ? `— <strong>${n.damage}</strong> ${n.damageType||''} <span class="note-hp-change">${n.targetHpBefore}→${n.targetHpAfter} HP</span>` : ''}
    </div>`;
  }

  return `
    <div class="note-title"><strong>${charLabel}</strong> ${what}</div>
    ${rollLine}
    ${targetsBlock}${legacyBlock}
    ${n.notes ? `<div class="note-sub">${liveEscape(n.notes)}</div>` : ''}
  `;
}

/* ── FINALIZAR ──
   Procesa las notas narrativas de la sesión y empuja todo a Campaña → Eventos:
   • Notas vinculadas a evento planificado → ese evento pasa a "Hecho" (con sus updates)
   • Notas "No planificadas" con título/texto → crear evento nuevo con status "Hecho"
     y session = número de sesión actual
*/
async function finalizeSession(){
  const narrativeNotes = (LIVE_SESSION.notes || []).filter(n => n.type === 'narrative');
  const linkedNotes    = narrativeNotes.filter(n => n.eventId);
  const unlinkedNotes  = narrativeNotes.filter(n => !n.eventId && (n.title || n.text));
  const linkedEventIds = [...new Set(linkedNotes.map(n => n.eventId))];

  const confirmMsg = [
    `¿Finalizar la sesión #${LIVE_SESSION.meta.number}?`,
    ``,
    `Esto va a:`,
    `• Marcar ${linkedEventIds.length} evento(s) vinculado(s) como "Hecho" en Campaña`,
    `• Crear ${unlinkedNotes.length} evento(s) nuevo(s) (no planificados) como "Hecho"`,
    `• Cerrar la sesión live actual (queda inactiva pero los datos persisten)`,
    ``,
    `Las notas y combatientes siguen visibles acá hasta que arranques una nueva sesión.`
  ].join('\n');

  if(!confirm(confirmMsg)) return;

  let eventsUpdated = 0, eventsCreated = 0;

  if(typeof CAMPAIGN !== 'undefined'){
    // Calcular el próximo número de orden: max orden de eventos "done" + 1
    const maxDoneOrder = (CAMPAIGN.events || [])
      .filter(e => e.status === 'done' && typeof e.order === 'number' && e.order < 1000)
      .reduce((max, e) => Math.max(max, e.order), 0);

    // Construir la secuencia de eventos tal como ocurrieron en el stream.
    // Las notas narrativas están ordenadas cronológicamente en LIVE_SESSION.notes;
    // iteramos en ese orden para preservar la secuencia real de la sesión.
    const sessionEventSequence = [];
    const seenEventIds = new Set();
    for(const note of (LIVE_SESSION.notes || [])){
      if(note.type !== 'narrative') continue;
      if(note.eventId && !seenEventIds.has(note.eventId)){
        seenEventIds.add(note.eventId);
        sessionEventSequence.push({ kind: 'linked', eventId: note.eventId });
      } else if(!note.eventId && (note.title || note.text)){
        // Nota no planificada — se identifica por su ts para no duplicar
        if(!seenEventIds.has(note.ts)){
          seenEventIds.add(note.ts);
          sessionEventSequence.push({ kind: 'unlinked', note });
        }
      }
    }

    let nextOrder = maxDoneOrder + 1;
    let unlinkedCounter = 0;

    for(const item of sessionEventSequence){
      if(item.kind === 'linked'){
        const e = CAMPAIGN.events.find(x => x.id === item.eventId);
        if(e){
          e.status = 'done';
          e.order  = nextOrder++;
          eventsUpdated++;
          await fetch(`/api/events/${item.eventId}`, {
            method:'PUT', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ status:'done', order: e.order })
          }).catch(err => console.error('finalizeSession PUT error:', err));
        }
      } else {
        const note = item.note;
        const newEvent = {
          id: `evt-live-${Date.now()}-${unlinkedCounter++}`,
          title: note.title || 'Evento sin título',
          description: note.text || '',
          status: 'done',
          session: String(LIVE_SESSION.meta.number || ''),
          order: nextOrder++
        };
        CAMPAIGN.events.push(newEvent);
        eventsCreated++;
        await fetch('/api/events', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify(newEvent)
        }).catch(err => console.error('finalizeSession POST error:', err));
      }
    }

    if(typeof renderEvents === 'function') renderEvents();
  }

  // ── Guardar sesión completa en MongoDB (colección Sessions) ──────────────
  const sessionPayload = {
    number: Number(LIVE_SESSION.meta.number) || 0,
    date:   LIVE_SESSION.meta.date ? new Date(LIVE_SESSION.meta.date) : new Date(),
    title:  LIVE_SESSION.meta.title || `Sesión ${LIVE_SESSION.meta.number}`,
    notes:  (LIVE_SESSION.notes || []).map(n => ({
      ts:   n.ts   ? new Date(n.ts) : new Date(),
      type: n.type || 'note',
      text: n.title || n.text || '',
      data: n   // nota completa en el campo Mixed para fidelidad total
    }))
  };

  // Intentar crear; si ya existe (sesión finalizada antes), actualizar
  const saveRes = await fetch('/api/sessions', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(sessionPayload)
  }).catch(err => ({ ok:false, _err: err }));

  if(saveRes && !saveRes.ok){
    // Ya existe — actualizar con PUT
    await fetch(`/api/sessions/${sessionPayload.number}`, {
      method:'PUT', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(sessionPayload)
    }).catch(err => console.error('Session archive PUT error:', err));
  }

  LIVE_SESSION.meta.active = false;
  saveLiveSession();
  renderLive();

  alert([
    `✓ Sesión #${LIVE_SESSION.meta.number} finalizada y archivada.`,
    ``,
    `• ${eventsUpdated} evento(s) marcados como "Hecho"`,
    `• ${eventsCreated} evento(s) nuevo(s) creados como "Hecho"`,
    `• Stream completo guardado en la colección Sessions`,
    ``,
    `Mirá la pestaña Campaña → Eventos para ver todo en orden cronológico.`,
    `La sesión live queda visible (inactiva) hasta que arranques una nueva sesión.`
  ].join('\n'));
}

/* ── INIT ── */
function initLive(){
  loadLiveSession();
  renderLive();
  window._liveInitialized = true;
  // Jugadores piden el estado actual al servidor (sobreescribe localStorage con estado del DM)
  if (!window.DM_MODE && window._socket) window._socket.emit('live:request');
}
