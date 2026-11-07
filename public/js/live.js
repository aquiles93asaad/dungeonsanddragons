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
  relyo: ['martial-arts', 'flurry-of-blows', 'patient-defense', 'step-of-the-wind'],
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
  'martial-arts': {
    name:'Golpe de Artes Marciales', nameEn:'Martial Arts (bonus strike)', action:'Bonus Action', isAction:false,
    cost:0,
    desc:'Después de hacer Attack con Action (golpe sin arma o arma de monje): 1 golpe sin arma extra como Bonus Action, sin gastar ki. No se combina con Lluvia de Golpes en el mismo turno.'
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
  const local  = load('live_session', null);
  const remote = window.SERVER_LIVE_SESSION;
  // Gana la copia más nueva: localStorage (este navegador) o MongoDB (otro dispositivo, storage
  // borrado, bump de STORAGE_VERSION). Copias viejas sin updatedAt cuentan como 0; sin copia, -1.
  const stamp = s => (s && s.meta) ? (s.updatedAt || 0) : -1;
  const stored = stamp(remote) > stamp(local) ? remote : local;
  if(stored && stored.meta){
    LIVE_SESSION = stored;
    // ensure combat object
    if(!LIVE_SESSION.combat) LIVE_SESSION.combat = { active:false, round:1, turn:0, participants:[] };
    // Combates guardados antes del puntero de turno: arrancar en el primero que no actuó
    if(LIVE_SESSION.combat.active && !LIVE_SESSION.combat.currentId){
      const first = getTurnOrder().find(p => !p.actedThisRound);
      if(first) LIVE_SESSION.combat.currentId = first.id;
    }
    migrateNarrativeLinks();
    if(stored === remote) save('live_session', LIVE_SESSION);                          // refrescar este navegador
    else if(window.DM_MODE && stamp(local) > stamp(remote)) scheduleLiveServerSave(); // subir lo que MongoDB no tiene
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
  if (window.DM_MODE) LIVE_SESSION.updatedAt = Date.now();
  save('live_session', LIVE_SESSION);
  if (window.DM_MODE && window._socket) window._socket.emit('live:sync', LIVE_SESSION);
  if (window.DM_MODE) scheduleLiveServerSave();
}

/* Respaldo en MongoDB (CampaignState.liveSession) con debounce: cada acción dispara varios
   saveLiveSession() seguidos y alcanza con mandar el último estado. */
let _liveServerTimer = null;
function scheduleLiveServerSave(){
  clearTimeout(_liveServerTimer);
  _liveServerTimer = setTimeout(() => flushLiveServerSave(false), 1500);
}
function flushLiveServerSave(keepalive){
  clearTimeout(_liveServerTimer);
  _liveServerTimer = null;
  fetch('/api/state', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ liveSession: LIVE_SESSION }),
    keepalive
  }).then(res => { if(!res.ok) console.error('liveSession → MongoDB:', res.status); })
    .catch(err => console.error('liveSession → MongoDB:', err));
}
// Al cerrar/recargar con un guardado pendiente: mandarlo igual (keepalive tiene tope ~64KB;
// si no entra, la copia de localStorage sigue y se sube en la próxima carga).
window.addEventListener('pagehide', () => { if(_liveServerTimer) flushLiveServerSave(true); });

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
function getCombatant(id){
  // 'pc:<charId>' = PJ fuera del combat tracker (curar no requiere combate). Si está en el tracker
  // se usa ese combatiente; si no, un objeto efímero — el HP del PJ vive en hp_<charId>, no en el tracker.
  if(typeof id === 'string' && id.startsWith('pc:')){
    const c = id.slice(3);
    return LIVE_SESSION.combat.participants.find(p=>p.kind==='player' && p.refId===c)
      || (CHARS.includes(c) ? { id, kind:'player', refId:c, conditions:[], concentration: pcState(c).concentration || null } : undefined);
  }
  return LIVE_SESSION.combat.participants.find(p=>p.id===id);
}

/* Objetivos de curación: todos los PJ, estén o no en el combat tracker (incluye caídos en HP 0). */
function getHealTargets(){
  const inTracker = LIVE_SESSION.combat.participants.filter(p=>p.kind==='player');
  const outside = CHARS.filter(c => !inTracker.some(p=>p.refId===c)).map(c => getCombatant('pc:'+c));
  return [...inTracker, ...outside];
}
function getAlivePlayers(){
  return LIVE_SESSION.combat.participants.filter(p=>p.kind==='player' && getCombatantHP(p)>0);
}
/* PJ que pueden ser blanco: incluye a los caídos (HP 0, haciendo death saves); excluye a los muertos */
function getTargetablePlayers(){
  return LIVE_SESSION.combat.participants.filter(p=>p.kind==='player' && !isDead(p));
}
function getAliveMonsters(){
  return LIVE_SESSION.combat.participants.filter(p=>p.kind==='monster' && p.hp>0);
}
function getAliveTargets(){
  return LIVE_SESSION.combat.participants.filter(p=>getCombatantHP(p)>0);
}

/* ── ESTADO VIVO POR PJ ──
   Buffs, HP temporales, death saves, CA manual y smite pendiente viven por personaje (no en el
   combatiente): sobreviven a sacarlo/agregarlo al tracker y funcionan fuera de combate.
   Los monstruos guardan lo mismo en el propio combatiente. */
function pcState(c){
  if(!LIVE_SESSION.pcState) LIVE_SESSION.pcState = {};
  if(!LIVE_SESSION.pcState[c]) LIVE_SESSION.pcState[c] = { buffs:[], tempHP:0, death:null, acOverride:null, pendingSmite:null };
  return LIVE_SESSION.pcState[c];
}
function stateOf(p){ return p.kind === 'player' ? pcState(p.refId) : p; }
function getBuffs(p){ const s = stateOf(p); if(!s.buffs) s.buffs = []; return s.buffs; }
function getTempHP(p){ return stateOf(p).tempHP || 0; }
function setTempHP(p, n){ stateOf(p).tempHP = Math.max(0, parseInt(n)||0); }
function getDeath(p){ return p.kind === 'player' ? pcState(p.refId).death : null; }
function isDead(p){ return p.kind === 'player' ? !!(getDeath(p) && getDeath(p).dead) : p.hp <= 0; }
/* Caído y tirando death saves (HP 0, ni estable ni muerto) */
function isDying(p){
  const d = getDeath(p);
  return p.kind === 'player' && getCombatantHP(p) <= 0 && !(d && (d.dead || d.stable));
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

/* CA base de los PJ: la de su armadura/feature con los atributos actuales (getCharAC en data.js).
   Editable por combatiente desde el tracker. */
function getCombatantBaseAC(p){
  if(p.kind==='player'){
    if(p.wildShape && p.wildShape.active && p.wildShape.ac) return p.wildShape.ac; // CA de la bestia
    const o = pcState(p.refId).acOverride;
    return o != null ? o : getCharAC(p.refId);
  }
  return p.ac;
}
/* CA efectiva: base + buffs (Shield +5, Escudo de Fe +2, Haste +2), con piso de Piel de Corteza (16) */
function getCombatantAC(p){
  const buffs = getBuffs(p);
  const ac = getCombatantBaseAC(p) + buffs.reduce((s,b)=>s+(b.acBonus||0), 0);
  return Math.max(ac, ...buffs.map(b=>b.acMin||0));
}
function setCombatantAC(id, val){
  const p = getCombatant(id); if(!p) return;
  const n = parseInt(val);
  if(p.kind==='player'){
    if(p.wildShape && p.wildShape.active){ if(!isNaN(n)) p.wildShape.ac = n; }
    else pcState(p.refId).acOverride = isNaN(n) ? null : n;
  } else if(!isNaN(n)) p.ac = n;
  saveLiveSession();
  renderCombatTracker();
}
function getCombatantName(p){
  if(p.kind==='player') return p.refId.charAt(0).toUpperCase()+p.refId.slice(1);
  return p.name;
}

/* ── REGLAS: tiempo de lanzamiento, concentración, duración ──
   Campos explícitos del preset primero (castingTime, concentration); si faltan, se infiere del texto
   del hechizo (las descripciones arrancan con "Concentración, …" / "Bonus Action." / "Reaction …"). */
function getSpellCastingTime(sp){
  if(!sp) return 'action';
  if(sp.castingTime) return sp.castingTime;
  const t = (sp.shape||'') + ' ' + (sp.desc||'').slice(0, 30);
  if(/reaction/i.test(t)) return 'reaction';
  if(/bonus action/i.test(t)) return 'bonus';
  return 'action';
}
function spellIsConcentration(sp){
  if(!sp) return false;
  return !!(sp.concentration || (sp.effect && sp.effect.casterCondition === 'concentration')
    || /concentraci/i.test(sp.shape||'') || /^(bonus action\.\s*)?concentraci/i.test(sp.desc||''));
}
/* Duración en rounds según la descripción ("10 rounds", "1 min" = 10, "1 h" = 600). Default 10. */
function spellDurationRounds(sp){
  if(sp && sp.effect && sp.effect.duration) return sp.effect.duration;
  const t = (sp && sp.desc) || '';
  let m;
  if((m = t.match(/(\d+)\s*rounds?/i))) return +m[1];
  if((m = t.match(/(\d+)\s*min/i))) return +m[1] * 10;
  if((m = t.match(/(\d+)\s*h\b/i))) return +m[1] * 600;
  return 10;
}
const CASTING_LABEL = { action:'🔵 Action', bonus:'🟡 Bonus Action', reaction:'🟣 Reaction' };

/* ── ECONOMÍA DE ACCIONES ──
   Nada termina el turno solo: el DM aprieta "Fin de turno". Cada nota registra qué gastó el
   combatiente (acción, bonus, reacción, ataques) para mostrarlo como recordatorio, sin bloquear.
   Una acción o ataque de alguien que ya jugó su turno este round cuenta como reacción (ataque de oportunidad). */
const EXTRA_ATTACK_CHARS = ['rac','relyo','tyrell'];
function getMaxAttacks(p){
  if(p.kind !== 'player' || (p.wildShape && p.wildShape.active)) return 1;
  return (EXTRA_ATTACK_CHARS.includes(p.refId) && getCharLevel(p.refId) >= 5) ? 2 : 1;
}
function recordEconomy(p, kind){
  if(!p || !kind || kind === 'none' || !LIVE_SESSION.combat.active) return;
  if(!p.turnUse) p.turnUse = { action:false, bonus:false, attacks:0 };
  const afterOwnTurn = p.actedThisRound && LIVE_SESSION.combat.currentId !== p.id;
  if(kind === 'reaction' || (afterOwnTurn && (kind === 'action' || kind === 'attack'))){ p.reactionUsed = true; return; }
  if(kind === 'attack'){ p.turnUse.attacks++; p.turnUse.action = true; }
  else p.turnUse[kind] = true;
}
function renderEconomyChips(p){
  if(!p || !LIVE_SESSION.combat.active) return '';
  const u = p.turnUse || { action:false, bonus:false, attacks:0 };
  const chip = (on, label) => `<span class="econ-chip${on?' used':''}">${label} ${on?'✓':'·'}</span>`;
  const maxAtk = getMaxAttacks(p);
  const atk = u.attacks ? `<span class="econ-chip used${u.attacks>maxAtk?' over':''}">Ataques ${u.attacks}/${maxAtk}</span>` : '';
  return `<div class="econ-chips">${chip(u.action,'Acción')}${chip(u.bonus,'Bonus')}${chip(!!p.reactionUsed,'Reacción')}${atk}</div>`;
}

/* ── TURNOS ──
   participants se mantiene ordenado por iniciativa. combat.currentId = de quién es el turno. */
function sortByInitiative(){
  LIVE_SESSION.combat.participants.sort((a,b)=>(b.initiative||0)-(a.initiative||0)); // sort estable: empates por orden de llegada
}
/* Quién tiene turno: monstruos vivos y PJ no muertos (los caídos juegan su turno tirando death saves) */
function canTakeTurn(p){
  if(p.kind === 'monster') return p.hp > 0;
  const d = getDeath(p);
  return !(d && (d.dead || (d.stable && getCombatantHP(p) <= 0)));
}
function getTurnOrder(){ return LIVE_SESSION.combat.participants.filter(canTakeTurn); }
function getCurrentCombatant(){ return getCombatant(LIVE_SESSION.combat.currentId); }

/* Arranca el turno de p: resetea su economía y vence lo que dura "hasta el inicio de tu próximo turno".
   Devuelve mensajes para el stream. */
function startTurn(p){
  LIVE_SESSION.combat.currentId = p ? p.id : null;
  if(!p) return [];
  const msgs = [];
  p.turnUse = { action:false, bonus:false, attacks:0 };
  p.reactionUsed = false;
  p.dodging = false;            // Dodge / Defensa Paciente
  p.recklessThisTurn = false;   // Ataque Imprudente
  const s = stateOf(p);
  const ending = getBuffs(p).filter(b => b.untilNextTurn);
  if(ending.length){
    s.buffs = getBuffs(p).filter(b => !b.untilNextTurn);
    ending.forEach(b => msgs.push(`${b.name} de ${getCombatantName(p)} termina.`));
  }
  // Heroísmo: HP temporales al inicio de cada turno (no se acumulan: queda el mayor)
  getBuffs(p).forEach(b => {
    if(b.tempHPEachTurn && b.tempHPEachTurn > getTempHP(p)){
      setTempHP(p, b.tempHPEachTurn);
      msgs.push(`💪 ${getCombatantName(p)} recibe ${b.tempHPEachTurn} HP temporales (${b.name}).`);
    }
  });
  if(isDying(p)) msgs.push(`💀 Turno de ${getCombatantName(p)}: está caído — tirá su death save en el tracker.`);
  return msgs;
}
function beginTurn(p){
  const msgs = startTurn(p);
  if(msgs.length) pushNote({ type:'combat', subtype:'other', notes: msgs.join('\n') });
}

function endTurn(){
  const cmb = LIVE_SESSION.combat;
  if(!cmb.active) return;
  const cur = getCurrentCombatant();
  if(cur) cur.actedThisRound = true;
  // Siguiente en iniciativa que todavía no jugó este round. Se busca por posición en la lista completa
  // (si el actual murió en su turno ya no está en getTurnOrder); si el DM movió el puntero, vuelve a los salteados.
  const all = cmb.participants;
  const from = cur ? all.indexOf(cur) : -1;
  const pending = p => canTakeTurn(p) && !p.actedThisRound;
  const next = all.slice(from + 1).find(pending) || all.find(pending);
  if(!next){ advanceRound(); return; }
  beginTurn(next);
  saveLiveSession();
  renderLive();
}

/* El DM le da el turno a alguien fuera de orden (acción preparada, demora, etc.) */
function giveTurn(id){
  const p = getCombatant(id); if(!p || !LIVE_SESSION.combat.active) return;
  beginTurn(p);
  saveLiveSession();
  renderLive();
}

function toggleCombatActive(){
  if(LIVE_SESSION.combat.active){
    if(!confirm('¿Terminar combate? El round se resetea pero los combatientes y su HP se mantienen.')) return;
    const msgs = ['Combate terminado.'];
    LIVE_SESSION.combat.active = false;
    LIVE_SESSION.combat.round = 1;
    LIVE_SESSION.combat.turn = 0;
    LIVE_SESSION.combat.currentId = null;
    LIVE_SESSION.combat.participants.forEach(p => {
      p.actedThisRound = false; p.turnUse = null; p.reactionUsed = false; p.dodging = false; p.recklessThisTurn = false;
      if(p.inRage){ p.inRage = false; p.rageTurnsLeft = 0; msgs.push('😠 La Furia de Rac termina con el combate.'); }
    });
    pushNote({ type:'combat', subtype:'end', notes: msgs.join('\n') });
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
  sortByInitiative();
  LIVE_SESSION.combat.active = true;
  LIVE_SESSION.combat.startedAt = nowIso();   // identifica el combate (usos "1 vez por combate", ej. Duro)
  LIVE_SESSION.combat.round = 1;
  LIVE_SESSION.combat.turn = 0;
  LIVE_SESSION.combat.participants.forEach(p => { p.actedThisRound = false; p.turnUse = null; p.reactionUsed = false; });
  pushNote({ type:'combat', subtype:'start', notes: combatStartNotes.trim() || 'Combate iniciado. Round 1.' });
  beginTurn(getTurnOrder()[0]);
  saveLiveSession();
  renderLive();
}

function cancelStartCombat(){
  combatStartPending = false;
  renderCombatTracker();
}

/* ── ACT / SKIP / ROUND ──
   ⚔ abre el form para cualquier combatiente en cualquier momento (su turno, reacción, ataque de
   oportunidad): guardar una nota NO termina el turno — eso lo hace "Fin de turno". */
function actCombatant(id){
  const p = getCombatant(id); if(!p) return;
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
        hitOverride: '',
        applyResistance: true,
        useShield: false,
        deflectRoll: '',
        targetSaveRolls: {}, targetSaveOverrides: {}, saveType: 'dex', saveDC: '', halfOnSave: false,
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

/* Marca que el combatiente ya jugó su turno este round (saltear). Si era su turno, pasa al siguiente. */
function markActed(combatantId){
  const p = getCombatant(combatantId); if(!p) return;
  if(LIVE_SESSION.combat.active && LIVE_SESSION.combat.currentId === p.id){ endTurn(); return; }
  p.actedThisRound = true;
  saveLiveSession();
  renderCombatTracker();
}

function advanceRound(){
  LIVE_SESSION.combat.round++;
  const expiredMsgs = [];
  LIVE_SESSION.combat.participants.forEach(p => {
    p.actedThisRound = false;
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
    // Countdown de buffs con duración (los de concentración se van con la concentración)
    const buffs = getBuffs(p);
    if(buffs.length){
      const kept = [];
      buffs.forEach(b => {
        if(b.turnsLeft == null) return kept.push(b);
        b.turnsLeft--;
        if(b.turnsLeft <= 0) expiredMsgs.push(`${getCombatantName(p)}: ${b.name} terminó.`);
        else kept.push(b);
      });
      stateOf(p).buffs = kept;
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
  const startMsgs = startTurn(getTurnOrder()[0]);
  const notes = 'Round '+LIVE_SESSION.combat.round+' comienza.' + ([...expiredMsgs, ...startMsgs].length ? '\n'+[...expiredMsgs, ...startMsgs].join('\n') : '');
  pushNote({ type:'combat', subtype:'next-round', notes });
  saveLiveSession();
  renderLive();
}

function forceNextRound(){
  if(!confirm('¿Forzar inicio de siguiente round? Los combatientes que no actuaron se saltan.')) return;
  advanceRound();
}

function newPlayerCombatant(c){
  const p = { id: newId('cmb-pj-'+c), kind:'player', refId:c, initiative:0, conditions:[], actedThisRound:false };
  // Concentración iniciada fuera del tracker (ej: Piel de Corteza antes de la pelea) pasa al combatiente
  const s = pcState(c);
  if(s.concentration){ p.concentration = s.concentration; s.concentration = null; }
  return p;
}

function addPlayerToCombat(c){
  if(LIVE_SESSION.combat.participants.find(p=>p.kind==='player' && p.refId===c)) return;
  LIVE_SESSION.combat.participants.push(newPlayerCombatant(c));
  if(LIVE_SESSION.combat.active) sortByInitiative();
  saveLiveSession();
  renderCombatTracker();
}

function addAllPlayersToCombat(){
  const inCombat = LIVE_SESSION.combat.participants.filter(p=>p.kind==='player').map(p=>p.refId);
  const toAdd = (LIVE_SESSION.meta.presentChars || CHARS).filter(c => !inCombat.includes(c));
  if(toAdd.length === 0){ alert('Todos los personajes presentes ya están en combate.'); return; }
  toAdd.forEach(c => LIVE_SESSION.combat.participants.push(newPlayerCombatant(c)));
  if(LIVE_SESSION.combat.active) sortByInitiative();
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
  if(LIVE_SESSION.combat.active) sortByInitiative();
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
  if(LIVE_SESSION.combat.active) sortByInitiative();
  saveLiveSession();
  renderCombatTracker();
}

/* ── WILD SHAPE ── */
function endWildShape(combatantId, fromDamage, overflowDmg){
  const p = getCombatant(combatantId); if(!p || !p.wildShape) return;
  const ws = p.wildShape;
  const beastName = ws.beastName;
  const restoredHP = ws.originalHP;
  p.wildShape = null;
  // Restaurar HP original de Boyd
  setCharHP('boyd', restoredHP);
  pushNote({
    type:'class-ability', character:'boyd', abilityKey:'wild-shape-end',
    abilityName:'Forma Salvaje termina', beastName,
    notes: fromDamage
      ? `🐺 La Forma Salvaje de Boyd (${beastName}) llega a 0 HP. Boyd vuelve a su forma original (HP ${restoredHP}).${overflowDmg>0?` Recibe ${overflowDmg} de daño overflow.`:''}`
      : `🐺 Boyd sale voluntariamente de la Forma Salvaje (${beastName}). Vuelve con ${restoredHP} HP.`
  });
  // El daño sobrante pasa a Boyd por el camino normal (puede dejarlo a 0 → death saves)
  if(fromDamage && overflowDmg > 0) applyPCDamage(p, overflowDmg, {});
  saveLiveSession();
  renderLive();
}
function endWildShapeBtn(combatantId){
  if(!confirm('¿Boyd sale de Forma Salvaje? Vuelve a su forma original con sus HP intactos.')) return;
  endWildShape(combatantId, false, 0);
}
function changeWildShapeHP(id, delta){
  const p = getCombatant(id); if(!p || !p.wildShape || !p.wildShape.active) return;
  changeCombatantHP(id, delta);
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
  const cmb = LIVE_SESSION.combat;
  const wasCurrent = cmb.active && cmb.currentId === id;
  const idx = cmb.participants.findIndex(p=>p.id===id);
  const next = wasCurrent ? cmb.participants.slice(idx+1).find(p=>canTakeTurn(p) && !p.actedThisRound) : null;
  cmb.participants = cmb.participants.filter(p=>p.id!==id);
  if(wasCurrent){
    if(next) beginTurn(next);
    else if(getTurnOrder().length){ advanceRound(); return; }
    else cmb.currentId = null;
  }
  saveLiveSession();
  renderCombatTracker();
}

/* ── DAÑO Y CURACIÓN ──
   Un solo camino para todo daño: HP temporales → Forma Salvaje → PJ a 0 HP (death saves, daño
   masivo) → chequeo de concentración. opts.crit = golpe crítico (a un PJ caído le suma 2 fallos). */
function setCharHP(c, val){
  save('hp_'+c, val);
  const inp = document.getElementById(c+'-hp');
  if(inp){ inp.value = val; updateHP(c); }
  renderPresentsGrid();
}

function applyDamage(p, dmg, opts){
  opts = opts || {};
  dmg = Math.max(0, parseInt(dmg)||0);
  if(!p || dmg <= 0) return;
  const total = dmg;
  // 1) HP temporales primero
  const temp = getTempHP(p);
  if(temp > 0){
    const absorbed = Math.min(temp, dmg);
    setTempHP(p, temp - absorbed);
    dmg -= absorbed;
  }
  if(dmg > 0){
    if(p.kind === 'monster'){
      const before = p.hp;
      p.hp = Math.max(0, p.hp - dmg);
      checkMonsterThresholds(p, before);
    } else if(p.wildShape && p.wildShape.active){
      // 2) Forma Salvaje: la bestia absorbe; el sobrante pasa a Boyd
      const ws = p.wildShape;
      if(dmg < ws.beastHP) ws.beastHP -= dmg;
      else { const overflow = dmg - ws.beastHP; ws.beastHP = 0; endWildShape(p.id, true, overflow); }
    } else {
      applyPCDamage(p, dmg, opts);
    }
  }
  // 3) Concentración: cualquier daño (aunque lo absorban los HP temporales) pide CON save.
  //    Si quedó inconsciente, la pierde directamente.
  if(p.concentration){
    if(isDead(p) || isDying(p)) breakConcentration(p.id);
    else promptConcentrationSave(p, total);
  }
}

function applyPCDamage(p, dmg, opts){
  opts = opts || {};
  const c = p.refId, max = getHPMax(c), name = getCombatantName(p);
  const cur = load('hp_'+c, max);
  if(cur <= 0){
    // Ya caído: cada golpe = 1 fallo de death save (crítico = 2). Daño ≥ HP máx = muerte.
    if(dmg >= max) return killChar(p, `💀 ${name} recibe ${dmg} de daño estando caído (≥ HP máx ${max}): muere.`);
    addDeathFailures(p, opts.crit ? 2 : 1, `${name} recibe daño estando caído${opts.crit ? ' (crítico)' : ''}`);
    return;
  }
  setCharHP(c, Math.max(0, cur - dmg));
  if(cur - dmg <= 0){
    const overflow = dmg - cur;
    if(overflow >= max) return killChar(p, `💀 ${name} cae con ${overflow} de daño sobrante (≥ HP máx ${max}): muerte instantánea.`);
    startDying(p);
  }
}

function applyHealing(p, amt){
  amt = Math.max(0, parseInt(amt)||0);
  if(!p || amt <= 0) return;
  if(p.kind === 'monster'){ p.hp = Math.min(p.hpMax, p.hp + amt); return; }
  if(p.wildShape && p.wildShape.active){ p.wildShape.beastHP = Math.min(p.wildShape.beastHPMax, p.wildShape.beastHP + amt); return; }
  const c = p.refId, s = pcState(c), name = getCombatantName(p);
  if(s.death && s.death.dead && !confirm(`${name} está muerto. ¿Revivirlo con esta curación (Revivify / decisión del DM)?`)) return;
  const max = getHPMax(c);
  const next = Math.min(max, load('hp_'+c, max) + amt);
  setCharHP(c, next);
  if(s.death){
    s.death = null;
    pushNote({ type:'combat', subtype:'other', notes:`✚ ${name} vuelve en sí con ${next} HP.` });
  }
}

/* delta < 0 = daño, > 0 = curación. opts se pasa a applyDamage (ej: { crit:true }). */
function changeCombatantHP(id, delta, opts){
  const p = getCombatant(id); if(!p) return;
  if(delta < 0) applyDamage(p, -delta, opts);
  else applyHealing(p, delta);
  saveLiveSession();
  renderCombatTracker();
}

function setCombatantHP(id, val){
  const p = getCombatant(id); if(!p) return;
  const n = Math.max(0, parseInt(val)||0);
  if(p.kind==='player'){
    const c = p.refId, cur = load('hp_'+c, getHPMax(c));
    const capped = Math.min(getHPMax(c), n);
    setCharHP(c, capped);
    const s = pcState(c);
    if(capped > 0 && s.death) s.death = null;          // corregido a mano: está consciente
    else if(capped === 0 && cur > 0) startDying(p);    // corregido a 0: cae
  } else {
    const before = p.hp;
    p.hp = Math.min(p.hpMax, n);
    checkMonsterThresholds(p, before);
  }
  saveLiveSession();
  renderCombatTracker();
}

/* Input rápido del tracker: "7" o "-7" = daño · "+5" = curación · "t5" = HP temporales (t0 los quita) */
function quickHP(id, raw){
  const s = String(raw||'').trim().toLowerCase();
  const p = getCombatant(id); if(!p || !s) return;
  let m;
  if((m = s.match(/^t\s*\+?(\d+)$/))) setTempHP(p, +m[1]);
  else if((m = s.match(/^\+\s*(\d+)$/))) applyHealing(p, +m[1]);
  else if((m = s.match(/^-?\s*(\d+)$/))) applyDamage(p, +m[1], {});
  else return;
  saveLiveSession();
  renderCombatTracker();
}

/* ── DEATH SAVES ──
   pcState(c).death = { s, f, stable, dead }. 3 éxitos = estable · 3 fallos = muere ·
   nat 20 = vuelve con 1 HP · nat 1 = 2 fallos · curarlo lo despierta. */
function startDying(p){
  const name = getCombatantName(p);
  pcState(p.refId).death = { s:0, f:0, stable:false, dead:false };
  if(p.inRage){ p.inRage = false; p.rageTurnsLeft = 0; }
  pushNote({ type:'combat', subtype:'other', notes:`💀 ${name} cae inconsciente (0 HP). En su turno tira death saves.` });
}
function killChar(p, msg){
  pcState(p.refId).death = { s:0, f:3, stable:false, dead:true };
  setCharHP(p.refId, 0);
  pushNote({ type:'combat', subtype:'other', notes: msg });
}
function addDeathFailures(p, n, why){
  const s = pcState(p.refId);
  if(!s.death) s.death = { s:0, f:0, stable:false, dead:false };
  const d = s.death;
  d.stable = false;
  d.f = Math.min(3, d.f + n);
  if(d.f >= 3){ d.dead = true; pushNote({ type:'combat', subtype:'other', notes:`💀 ${why}: 3 fallos — ${getCombatantName(p)} muere.` }); }
  else pushNote({ type:'combat', subtype:'other', notes:`💀 ${why}: ${n} fallo${n>1?'s':''} de death save (${d.s}✓ / ${d.f}✗).` });
}
function rollDeathSave(id, rollStr){
  const p = getCombatant(id); if(!p || p.kind !== 'player') return;
  const roll = parseInt(rollStr);
  if(!(roll >= 1 && roll <= 20)){ alert('Ingresá el d20 (1-20).'); return; }
  const name = getCombatantName(p);
  const s = pcState(p.refId);
  if(!s.death) s.death = { s:0, f:0, stable:false, dead:false };
  const d = s.death;
  let msg;
  if(roll === 20){
    s.death = null;
    setCharHP(p.refId, 1);
    msg = `★ ${name} saca 20 en su death save: vuelve en sí con 1 HP.`;
  } else if(roll === 1){
    d.f = Math.min(3, d.f + 2);
    msg = `✗ ${name} saca 1 en su death save: 2 fallos (${d.s}✓ / ${d.f}✗).`;
  } else if(roll >= 10){
    d.s++;
    msg = `✓ ${name} saca ${roll} en su death save (${d.s}✓ / ${d.f}✗).`;
  } else {
    d.f++;
    msg = `✗ ${name} saca ${roll} en su death save (${d.s}✓ / ${d.f}✗).`;
  }
  if(d.f >= 3 && s.death){ d.dead = true; msg += ` ${name} muere.`; }
  else if(d.s >= 3 && s.death){ d.stable = true; msg += ` ${name} queda estable (inconsciente, 0 HP).`; }
  pushNote({ type:'combat', subtype:'other', notes: msg });
  // La death save es todo su turno
  if(LIVE_SESSION.combat.active && LIVE_SESSION.combat.currentId === p.id) endTurn();
  else { saveLiveSession(); renderLive(); }
}
function stabilizeChar(id){
  const p = getCombatant(id); if(!p || p.kind !== 'player') return;
  const s = pcState(p.refId);
  if(!s.death) return;
  s.death.stable = true;
  pushNote({ type:'combat', subtype:'other', notes:`✚ ${getCombatantName(p)} queda estable (Spare the Dying / Medicine DC 10). Sigue inconsciente con 0 HP.` });
  saveLiveSession();
  renderLive();
}

/* ── CONCENTRACIÓN: CON save al recibir daño ── */
function promptConcentrationSave(p, dmg){
  if(!p.concentration) return;
  const dc = Math.max(10, Math.floor(dmg / 2));
  const conMod = getCombatantSaveMod(p, 'con') || 0;
  const modLabel = conMod >= 0 ? `+${conMod}` : String(conMod);
  const name = getCombatantName(p);
  const spellName = p.concentration.spellName;
  const bless = getBuffs(p).some(b => b.rollBonus) ? '\n✨ Bendición activa: sumá 1d4 al total.' : '';
  setTimeout(() => {
    if(!p.concentration) return;
    const rollStr = prompt(
      `⚠ ${name} recibió ${dmg} de daño mientras concentrado en ${spellName}.\n\nCON save DC ${dc} (mín. 10, ${dmg}÷2)\nMod CON de ${name}: ${modLabel}${bless}\n\nIngresá la tirada d20 (solo el dado, el mod se suma automáticamente):`
    );
    if(rollStr === null) return; // canceló
    const roll = parseInt(rollStr) || 0;
    const total = roll + conMod;
    if(total >= dc){
      alert(`✓ ${name} mantiene la concentración en ${spellName}. (${roll}${modLabel} = ${total} ≥ DC ${dc})`);
    } else {
      alert(`✗ ${name} pierde la concentración en ${spellName}. (${roll}${modLabel} = ${total} < DC ${dc})`);
      breakConcentration(p.id);
    }
  }, 100);
}

/* ── UMBRALES DE HP DE MONSTRUOS ──
   Las habilidades/fases del bestiario mencionan disparadores ("cuando baja de 30 HP", "A ~12 HP").
   Al cruzar uno, se avisa en el stream con el texto correspondiente. */
function getMonsterPreset(p){
  if(!p || p.kind !== 'monster' || !p.refId || p.refId === 'adhoc') return null;
  return (typeof MONSTERS !== 'undefined' && MONSTERS.find(x=>x.id===p.refId)) || PRESET_MONSTERS.find(x=>x.id===p.refId) || null;
}
function getMonsterHPThresholds(p){
  const m = getMonsterPreset(p); if(!m) return [];
  const lines = [m.abilities||'', ...(m.phases||[]).map(ph => `${ph.name}: ${ph.desc}`)]
    .join('\n').split(/\n|\.\s+/).filter(Boolean);
  const out = [];
  lines.forEach(line => {
    const re = /(\d+)\s*HP/gi; let x;
    while((x = re.exec(line))){
      const hp = +x[1];
      if(hp > 0 && hp < p.hpMax && !out.some(t => t.hp === hp)) out.push({ hp, text: line.trim().slice(0, 200) });
    }
  });
  return out;
}
function checkMonsterThresholds(p, before){
  getMonsterHPThresholds(p).forEach(t => {
    if(before > t.hp && p.hp <= t.hp){
      pushNote({ type:'combat', subtype:'other', notes:`⚠ ${getCombatantName(p)} bajó a ${p.hp} HP (umbral ${t.hp}): ${t.text}` });
    }
  });
}

function setCombatantInit(id, val){
  const p = getCombatant(id); if(!p) return;
  p.initiative = parseInt(val)||0;
  if(LIVE_SESSION.combat.active){ sortByInitiative(); renderCombatTracker(); }
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

/* Concentración: aplica al caster. Solo una a la vez — un hechizo nuevo rompe la anterior.
   PJ fuera del tracker: se guarda en pcState y pasa al combatiente cuando entra al combate. */
function applyConcentration(combatantId, spellName, turnsLeft){
  const p = getCombatant(combatantId); if(!p) return;
  const inTracker = LIVE_SESSION.combat.participants.includes(p);
  const holder = inTracker ? p : pcState(p.refId);
  if(holder.concentration && holder.concentration.spellName !== spellName) breakConcentration(combatantId);
  holder.concentration = { spellName, turnsLeft };
  saveLiveSession();
  renderCombatTracker();
}

/* Clave del caster en los buffs que aplica (estable aunque el PJ salga y entre del tracker) */
function buffCasterKey(p){ return p.kind === 'player' ? 'pc:'+p.refId : p.id; }

/* Rompe la concentración del caster y quita lo que dependía de ella: condiciones, buffs y smite pendiente */
function breakConcentration(combatantId){
  const p = getCombatant(combatantId); if(!p) return;
  const inTracker = LIVE_SESSION.combat.participants.includes(p);
  const holder = inTracker ? p : pcState(p.refId);
  const spell = holder.concentration ? holder.concentration.spellName : null;
  holder.concentration = null;
  if(spell){
    const key = buffCasterKey(p);
    const strip = s => { if(s && s.buffs) s.buffs = s.buffs.filter(b => !(b.sourceSpell === spell && b.casterKey === key)); };
    LIVE_SESSION.combat.participants.forEach(target => {
      target.conditions = (target.conditions||[]).filter(c => !(typeof c==='object' && c.sourceSpell===spell));
      strip(stateOf(target));
    });
    Object.values(LIVE_SESSION.pcState || {}).forEach(strip);
    if(p.kind === 'player'){
      const ps = pcState(p.refId);
      if(ps.pendingSmite && ps.pendingSmite.spell === spell) ps.pendingSmite = null;
    }
    pushNote({ type:'combat', subtype:'other', notes:`◎ Concentración de ${getCombatantName(p)} en ${spell} se rompe. Lo que dependía del hechizo (condiciones, buffs) se quita.` });
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
      weaponPicked: false,
      damageDice: '',
      skill: '',
      save: 'str',
      spellName: '',
      spellLevel: 1,
      cantripName: '',
      roll: '',
      modifier: '',
      hitOverride: '',
      targetIds: [],
      customDC: '',
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
      // riders al pegar con arma (Tyrell)
      divineSmite: false, divineSmiteSlot: 1, divineSmiteUndead: false, divineSmiteDmg: '',
      pendingSmiteDmg: '', pendingSmiteSaveRoll: '',
      // Ice Knife: explosión
      areaTargetIds: [], areaSaveRolls: {}, areaSaveOverrides: {}, areaDamage: '', areaSaveType: '', areaSaveDC: '',
      // Misil Mágico, Rayo Abrasador, Sueño, daño automático, buffs, efecto sostenido
      darts: {}, missileRoll: '', rays: [], sleepRoll: '', sleepTargets: null, autoTargets: [], buffTargets: [], sustained: false,
      // class-ability fields
      abilityKey: '', beastId: '', beastName: '', beastHP: '', beastAC: '', healAmount: '', targetId: '', windOption: '',
      blows: [], targetAC: '',
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
    return { character: CHARS[0], abilityKey:'', beastId:'', beastName:'', beastHP:'', beastAC:'', healAmount:'', targetId:'', slotLevel:1, blows:[], notes:'' };
  }
  return { eventId:'', title:'', text:'' };
}

/* Campos que cambian la estructura del form (selects, toggles) → re-render completo.
   El resto (números que se tipean) solo refresca los resúmenes, para no perder el foco del input. */
const RERENDER_FIELDS = ['character','actionType','spellName','cantripName','skill','save','abilityKey','windOption','targetId',
  'hitOverride','divineSmite','divineSmiteSlot','divineSmiteUndead','spellLevel','sustained',
  'useShield','applyResistance','saveType','halfOnSave','slotLevel','duroOn','rxCustom','rxHalf'];

function updateFormField(field, value){
  if(!currentForm) return;
  const d = currentForm.data;
  d[field] = value;
  // Al cambiar personaje o tipo de acción, limpiar dados/modificador para que el auto-fill funcione limpio
  if(field === 'character' || field === 'actionType'){
    Object.assign(d, { damageDice:'', modifier:'', damageType:'slashing', weaponId:'', weapon:'', weaponPicked:false, spellName:'', cantripName:'' });
    resetResolutionState(d);
  }
  if(field === 'save') d.modifier = '';   // se recalcula con el save elegido
  // Al cambiar personaje en form de clase-habilidad (como type propio o como actionType), limpiar habilidad seleccionada
  const isAbilityContext = currentForm.type === 'class-ability' || d.actionType === 'class-ability';
  if(isAbilityContext && (field === 'character' || field === 'abilityKey')){
    if(field === 'character') d.abilityKey = '';
    d.beastId = ''; d.beastName = ''; d.beastHP = ''; d.beastAC = '';
    d.healAmount = ''; d.targetId = ''; d.blows = [];
  }
  if(RERENDER_FIELDS.includes(field)) renderNoteForm();
  else updateFormAssistance();
}

/* Refresca en el lugar los resúmenes del form abierto (total, resultado del ataque, dardos, rayos, Sueño, golpes) */
function updateFormAssistance(){
  if(!currentForm) return;
  const d = currentForm.data;
  const totalEl = document.getElementById('form-total');
  if(totalEl) totalEl.textContent = (d.roll==='' || d.roll==null) ? '—' : (parseInt(d.roll)||0) + (parseInt(d.modifier)||0);
  const fill = (id, fn) => { const el = document.getElementById(id); if(el) el.innerHTML = fn(d); };
  fill('attack-summary',  renderAttackSummary);
  fill('missile-summary', renderMissileSummary);
  fill('rays-summary',    renderRaysSummary);
  fill('sleep-summary',   renderSleepSummary);
  fill('blows-summary',   renderBlowsSummary);
}

function spellRequiresAttack(spellName, c){
  if(!spellName) return false;
  const s = (CLASS_PRESETS[c]?.spellList||[]).find(x=>x.name===spellName);
  if(!s) return false;
  // Campo explícito tiene prioridad sobre heurística
  if(typeof s.requiresAttack === 'boolean') return s.requiresAttack;
  // Heurística conservadora: solo "spell attack" en shape (no 'toque' — false positive para buffs/heal)
  const sh = (s.shape||'').toLowerCase();
  return sh.includes('spell attack') || sh.includes('melee spell');
}
/* Curación: damageType 'healing' o spell/cantrip con isHeal (los del seed vienen solo con isHeal).
   La usan el form y saveActionNote — si divergen, la nota se guarda pero no cura. */
function isHealForm(d){
  if(d.damageType === 'healing') return true;
  const sp = getFormSpellData(d);
  return !!(sp && (sp.damageType === 'healing' || sp.isHeal));
}
function cantripRequiresAttack(cantripName, c){
  if(!cantripName) return false;
  const cn = (CLASS_PRESETS[c]?.cantripsData||[]).find(x=>x.name===cantripName);
  if(!cn) return false;
  if(typeof cn.requiresAttack === 'boolean') return cn.requiresAttack;
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

      ${meta ? renderAbilityInfoBox(meta) : ''}

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

/* Qué gasta la habilidad: acción, bonus o nada (Castigo Divino se usa al pegar) */
function abilityEconomyKind(meta){
  if(!meta) return 'none';
  if(meta.isAction) return 'action';
  return meta.action.startsWith('Bonus') ? 'bonus' : 'none';
}
function renderAbilityInfoBox(meta){
  const kind = abilityEconomyKind(meta);
  return `<div class="ability-info-box">
    <span class="ability-action-tag ${kind==='action' ? 'is-action' : kind==='bonus' ? 'is-bonus' : 'is-free'}">${kind==='action' ? '🔵 Action' : kind==='bonus' ? '🟡 Bonus Action' : '🟣 '+meta.action}</span>
    ${kind==='action'
      ? `<span class="ability-turn-warning">Usa la Action del turno</span>`
      : kind==='bonus'
        ? `<span class="ability-turn-ok">Puede hacer una Action normal en el mismo turno</span>`
        : `<span class="ability-turn-ok">No consume acción — se usa en el momento en que el ataque pega</span>`}
    <div class="ability-desc" style="margin-top:0.4rem">${meta.desc}</div>
  </div>`;
}

/* ── GOLPES SIN ARMA DEL MONJE (Lluvia de Golpes ×2, Artes Marciales ×1) ──
   Cada golpe es un ataque aparte: su propio objetivo, d20 y daño. La CA sale del objetivo. */
function monkStrikeMod(){ return abilityMod(Math.max((ABILITY_SCORES.relyo||{}).dex||10, (ABILITY_SCORES.relyo||{}).str||10)) + getCharProfBonus('relyo'); }
function monkStrikeDamageBonus(){ return abilityMod(Math.max((ABILITY_SCORES.relyo||{}).dex||10, (ABILITY_SCORES.relyo||{}).str||10)); }
function ensureBlows(d, n){
  if(!Array.isArray(d.blows)) d.blows = [];
  while(d.blows.length < n) d.blows.push({ targetId: (d.blows[d.blows.length-1]||{}).targetId || '', roll:'', damage:'', override:'' });
  d.blows.length = n;
}
function updateBlow(i, field, value, rerender){
  if(!currentForm || !currentForm.data.blows || !currentForm.data.blows[i]) return;
  currentForm.data.blows[i][field] = value;
  if(rerender) renderNoteForm(); else updateFormAssistance();
}
function blowOutcome(b){
  const tp = getCombatant(b.targetId);
  return attackOutcome(b.roll, monkStrikeMod(), tp ? getCombatantAC(tp) : 0, b.override);
}
function blowDamage(b){ return b.damage === '' || b.damage == null ? 0 : (parseInt(b.damage)||0) + monkStrikeDamageBonus(); }
function renderBlowsSummary(d){
  if(!Array.isArray(d.blows) || !d.blows.length) return '';
  const labels = { nat20:'★ CRÍTICO', nat1:'✗ NAT 1', hit:'HIT', miss:'MISS' };
  return d.blows.map((b, i) => {
    const o = blowOutcome(b);
    return `<span class="outcome-badge ${o||''}">Golpe ${i+1}: ${o ? labels[o] : (b.targetId ? '—' : 'elegí objetivo')}${isHitOutcome(o) && b.damage!=='' ? ` · ${blowDamage(b)} daño` : ''}</span>`;
  }).join(' ');
}
function renderBlowsBlock(d, n, lvl){
  ensureBlows(d, n);
  const die = getMartialArtsDie(lvl);
  const mod = monkStrikeMod(), bonus = monkStrikeDamageBonus();
  const rows = d.blows.map((b, i) => `<div class="ray-row">
    <span class="ray-num">Golpe ${i+1}</span>
    <select class="form-input" onchange="updateBlow(${i}, 'targetId', this.value, true)">${targetOptionsHTML(b.targetId, false)}</select>
    <input type="number" class="form-input" min="1" max="20" placeholder="d20" value="${liveEscape(b.roll)}" oninput="updateBlow(${i}, 'roll', this.value)">
    <input type="number" class="form-input" placeholder="1d${die}" value="${liveEscape(b.damage)}" oninput="updateBlow(${i}, 'damage', this.value)">
    ${renderHitOverride(b, 'override', val => `updateBlow(${i}, 'override', '${val}', true)`)}
  </div>`).join('');
  return `<div class="ability-stat-line muted" style="margin-bottom:0.4rem">Ataque +${mod} · Daño 1d${die}${bonus>=0?'+':''}${bonus} contundente (el bonus se suma solo) · cada golpe puede ir a un objetivo distinto.</div>
    <div class="ray-head"><span></span><span>Objetivo</span><span>d20</span><span>Dado</span><span>¿Pega?</span></div>
    ${rows}
    <div id="blows-summary" class="attack-summary">${renderBlowsSummary(d)}</div>`;
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

  if(abilityKey === 'flurry-of-blows' || abilityKey === 'martial-arts'){
    const flurry = abilityKey === 'flurry-of-blows';
    return `<div class="ability-specific-block">
      <div class="ability-stat-line">${flurry ? 'Bonus Action después de Attack: 2 golpes sin arma (1 ki).' : 'Bonus Action después de Attack: 1 golpe sin arma, sin gastar ki.'}</div>
      ${renderBlowsBlock(d, flurry ? 2 : 1, lvl)}
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
      ${renderCombatantsTargetPicker(d, 'Objetivo a curar', 'targetId', true)}
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
      </div>
      <div class="form-row"><label>CA de la bestia</label>
        <input type="number" class="form-input" placeholder="ej: 13" value="${liveEscape(d.beastAC||'')}" oninput="updateFormField('beastAC',this.value)">
      </div>` : ''}
    </div>`;
  }

  return '';
}

function renderCombatantsTargetPicker(d, label, field, includeAllPCs){
  // includeAllPCs: curaciones — suma los PJ que no están en el tracker (no hace falta combate)
  const all = [...((LIVE_SESSION.combat && LIVE_SESSION.combat.participants) || [])];
  if(includeAllPCs) all.push(...getHealTargets().filter(p => !all.includes(p)));
  if(all.length === 0) return '';
  const opts = `<option value="">— elegir objetivo —</option>` +
    all.map(p=>`<option value="${p.id}" ${d[field]===p.id?'selected':''}>${liveEscape(getCombatantName(p))} (HP ${getCombatantHP(p)})</option>`).join('');
  return `<div class="form-row"><label>${label}</label>
    <select class="form-input" onchange="updateFormField('${field}',this.value)">${opts}</select>
  </div>`;
}

function selectWildShapeForm(formId){
  // Funciona en el form de habilidad suelto y en el de acción con tipo "Habilidad de clase" (el que abre ⚔)
  if(!currentForm || (currentForm.type !== 'class-ability' && currentForm.data.actionType !== 'class-ability')) return;
  if(!formId){ currentForm.data.beastId=''; currentForm.data.beastName=''; currentForm.data.beastHP=''; renderNoteForm(); return; }
  const f = ((typeof CAMPAIGN !== 'undefined' && CAMPAIGN.wildShapeForms) || []).find(x=>x.id===formId);
  if(!f) return;
  currentForm.data.beastId   = f.id;
  currentForm.data.beastName = f.name;
  currentForm.data.beastHP   = String(f.hpMax);
  renderNoteForm();
}

/* Resuelve los golpes del monje: cada uno contra su objetivo, aplica daño si pega. Devuelve las líneas de la nota. */
function resolveBlows(d){
  const mod = monkStrikeMod();
  return (d.blows||[]).map((b, i) => {
    const tp = getCombatant(b.targetId);
    const o = blowOutcome(b);
    const dmg = isHitOutcome(o) ? blowDamage(b) : 0;
    if(tp && dmg > 0) changeCombatantHP(b.targetId, -dmg, { crit: o === 'nat20' });
    const rollTxt = b.roll !== '' && b.roll != null ? `d20=${b.roll}+${mod}=${(parseInt(b.roll)||0)+mod}` : 'sin tirada';
    const outTxt = o === 'nat20' ? 'CRÍTICO' : o === 'hit' ? 'HIT' : (o === 'miss' || o === 'nat1') ? 'MISS' : '—';
    return `Golpe ${i+1}${tp ? ` a ${getCombatantName(tp)}` : ''}: ${rollTxt} → ${outTxt}${dmg ? ` (${dmg} daño)` : ''}`;
  });
}

function saveClassAbilityNote(){
  const d = currentForm.data;
  const c = d.character;
  const key = d.abilityKey;
  const lvl = getCharLevel(c);
  const meta = ABILITY_META[key];
  if(!meta){ alert('Elegí una habilidad.'); return; }

  let combatant = LIVE_SESSION.combat && LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===c);
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
    noteText = `😠 Rac entra en Furia. Bonus daño +${bonus} en ataques STR cuerpo a cuerpo. Resistencia a daño físico. Duración: 10 rounds.`;
    if(typeof renderCharAbilities === 'function') renderCharAbilities('rac');
  }

  // ── Golpe de Artes Marciales (sin ki) ──
  else if(key === 'martial-arts'){
    const lines = resolveBlows(d);
    noteText = `👊 Golpe de Artes Marciales (Bonus Action): ${lines.join(' · ') || 'sin tirada'}`;
  }

  // ── Ki abilities ──
  else if(['flurry-of-blows','patient-defense','step-of-the-wind'].includes(key)){
    const used = load('resource_relyo_ki', 0);
    const max  = getResourceMax('relyo', 'ki', lvl);
    const cost = meta.cost || 1;
    if(used + cost > max && !confirm(`Sin ki suficiente (${max-used} disponible, costo ${cost}). ¿Guardar igual?`)) return;
    save('resource_relyo_ki', Math.min(used + cost, max));
    if(key === 'flurry-of-blows'){
      const lines = resolveBlows(d);
      noteText = `👊 Lluvia de Golpes (1 ki): ${lines.join(' · ') || 'sin tiradas'}`;
    } else if(key === 'patient-defense'){
      noteText = `🛡 Defensa Paciente (Patient Defense): Relyo esquiva (Dodge) hasta su próximo turno. Los ataques contra él tienen desventaja; ventaja en sus DEX saves.`;
      if(combatant) combatant.dodging = true;
    } else {
      noteText = `💨 Paso del Viento (Step of the Wind): ${d.windOption==='dash'?'Dash (doble movimiento)':'Disengage (sin AoO)'}. Salto duplicado.`;
    }
    if(typeof renderCharAbilities === 'function') renderCharAbilities('relyo');
  }

  // ── Divine Smite (registro suelto; lo normal es marcarlo en el form de ataque) ──
  else if(key === 'divine-smite'){
    const slotLv = parseInt(d.slotLevel) || 1;
    const ok = consumeSpellSlot('tyrell', slotLv);
    if(!ok && !confirm('Sin slot disponible. ¿Guardar igual?')) return;
    const dice = Math.min(5, 1 + slotLv);
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
    // La transformación vive en el combatiente: si Boyd no está en el tracker (ej: explorando), se lo agrega
    if(!combatant){
      addPlayerToCombat('boyd');
      combatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId==='boyd');
    }
    const form = ((typeof CAMPAIGN !== 'undefined' && CAMPAIGN.wildShapeForms) || []).find(f => f.id === d.beastId);
    const boydCurrentHP = load('hp_boyd', getHPMax('boyd'));
    // CA, ataques y atributos físicos de la bestia: el form de acción y las salvaciones los usan
    combatant.wildShape = {
      active:true, beastId:d.beastId||'', beastName:d.beastName, beastHP:beastHPMax, beastHPMax, originalHP:boydCurrentHP,
      ac: form ? form.ac : (parseInt(d.beastAC) || null),
      attacks: form ? (form.attacks||[]) : [],
      str: form ? form.str : null, dex: form ? form.dex : null, con: form ? form.con : null
    };
    noteText = `🐺 Forma Salvaje (Wild Shape): Boyd se transforma en ${d.beastName} (HP ${beastHPMax}${combatant.wildShape.ac ? ` · CA ${combatant.wildShape.ac}` : ''}). Todo el daño va primero a los HP de la bestia.`;
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

  // No termina el turno: se registra qué gastó (acción / bonus) para el recordatorio del tracker
  recordEconomy(combatant, abilityEconomyKind(meta));
  closeNoteForm();
  saveLiveSession();
  renderLive();
}

/* ── RENDER NOTE FORM ── */
function renderNoteForm(){
  const container = document.getElementById('note-form-container');
  if(!container) return;
  if(!currentForm){ container.innerHTML = ''; return; }
  if(currentForm.type === 'action') container.innerHTML = renderActionForm();
  else if(currentForm.type === 'npc-action') container.innerHTML = renderNpcActionForm();
  else if(currentForm.type === 'skip-turn') container.innerHTML = renderSkipTurnForm();
  else if(currentForm.type === 'conversation') container.innerHTML = renderConversationForm();
  else if(currentForm.type === 'npc') container.innerHTML = renderNpcForm();
  else if(currentForm.type === 'combat') container.innerHTML = renderCombatForm();
  else if(currentForm.type === 'loot') { container.innerHTML = renderLootForm(); return; }
  else if(currentForm.type === 'class-ability') container.innerHTML = renderClassAbilityForm();
  else container.innerHTML = renderNarrativeForm();
  updateFormAssistance();
}

/* ── OBJETIVOS ── */
/* <option>s de objetivo agrupados (enemigos/aliados). Los caídos se pueden elegir; los muertos no.
   playersFirst: el que actúa es un monstruo → los jugadores van primero. */
function targetOptionsHTML(selectedId, playersFirst){
  const ps = LIVE_SESSION.combat.participants;
  const mons = ps.filter(p=>p.kind==='monster' && p.hp>0);
  const pcs  = ps.filter(p=>p.kind==='player' && !isDead(p));
  const opt = p => `<option value="${p.id}" ${p.id===selectedId?'selected':''}>${liveEscape(getCombatantName(p))} — CA ${getCombatantAC(p)} · HP ${getCombatantHP(p)}${getCombatantHP(p)<=0?' · caído':''}</option>`;
  const groups = playersFirst ? [['Jugadores', pcs], ['Otros', mons]] : [['Enemigos', mons], ['Aliados', pcs]];
  return `<option value="">— elegir objetivo —</option>` +
    groups.filter(g => g[1].length).map(([label, arr]) => `<optgroup label="${label}">${arr.map(opt).join('')}</optgroup>`).join('');
}

function setSingleTarget(id){
  if(!currentForm) return;
  currentForm.data.targetIds = id ? [id] : [];
  currentForm.data.targetCA = '';   // la CA sale del objetivo (con buffs); el DM la puede pisar
  renderNoteForm();
}

/* Compat: los inputs viejos lo llaman; ahora el resumen se recalcula en updateFormAssistance */
function syncDamageTotal(){ updateFormAssistance(); }

/* Bloque de curación (healing spells — damageType:'healing' o isHeal)
   Incluye a los caídos (HP 0) y a los PJ fuera del tracker: no hace falta estar en combate. */
function renderHealBlock(d){
  const targets = getHealTargets();
  const currentId = (d.targetIds||[])[0]||'';
  const opts=`<option value="">— elegir objetivo —</option>`+
    targets.map(p=>`<option value="${p.id}" ${p.id===currentId?'selected':''}>${liveEscape(getCombatantName(p))} — HP ${getCombatantHP(p)}/${getCombatantHPMax(p)}${getCombatantHP(p)<=0?' · caído':''}</option>`).join('');
  return `<div class="heal-block">
    <div class="form-row">
      <label>Objetivo (aliado a curar)</label>
      <select class="form-input" onchange="setSingleTarget(this.value)">${opts}</select>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>HP a restaurar${d.damageDice?` (${liveEscape(d.damageDice)} + mod)`:''}</label>
        <input type="number" class="form-input" placeholder="ej: 7" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)">
      </div>
      <div class="form-row form-checkbox-row">
        <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar curación automáticamente</label>
      </div>
    </div>
  </div>`;
}

/* Banners de lo que tiene activo el personaje: concentración, buffs, smite cargado, Forma Salvaje, caído */
function renderCharBuffBanners(c){
  const banners = [];
  const combatant = LIVE_SESSION.combat.participants.find(p => p.kind === 'player' && p.refId === c);
  const ps = pcState(c);
  const conc = (combatant && combatant.concentration) || ps.concentration;
  if(conc && conc.spellName){
    const preset = CLASS_PRESETS[c];
    const spellData = preset && ((preset.spellList||[]).find(s => s.name === conc.spellName) || (preset.cantripsData||[]).find(s => s.name === conc.spellName));
    const turnsLeft = conc.turnsLeft != null ? ` (${conc.turnsLeft}r)` : '';
    banners.push(`<div class="action-buff-banner buff-conc">◎ Concentrado en <strong>${liveEscape(conc.spellName)}</strong>${turnsLeft}${spellData && spellData.buffDesc ? ' — '+liveEscape(spellData.buffDesc) : ''}</div>`);
  }
  (ps.buffs||[]).forEach(b => {
    banners.push(`<div class="action-buff-banner buff-holy">✨ <strong>${liveEscape(b.name)}</strong>${b.desc ? ' — '+liveEscape(b.desc) : ''}${b.rollBonus ? ` <em>(sumá ${liveEscape(b.rollBonus)} al ataque/save)</em>` : ''}</div>`);
  });
  if(ps.pendingSmite){
    banners.push(`<div class="action-buff-banner buff-rage">⚔ <strong>${liveEscape(ps.pendingSmite.spell)}</strong> cargado — el próximo golpe con arma suma +${liveEscape(ps.pendingSmite.damage)} ${liveEscape(ps.pendingSmite.damageType||'')} (se completa abajo, al pegar).</div>`);
  }
  if(combatant && combatant.wildShape && combatant.wildShape.active){
    banners.push(`<div class="action-buff-banner buff-conc">🐺 En Forma Salvaje (${liveEscape(combatant.wildShape.beastName)}): ataca con la bestia y no puede lanzar hechizos.</div>`);
  }
  if(combatant && isDying(combatant)){
    banners.push(`<div class="action-buff-banner buff-warn">💀 ${liveEscape(getCombatantName(combatant))} está caído: en su turno solo tira death saves (en el tracker).</div>`);
  }
  return banners.join('');
}

/* ── MODOS DE RESOLUCIÓN ── */
const DMG_TYPES = ['slashing','piercing','bludgeoning','fire','cold','lightning','thunder','acid','poison','psychic','necrotic','radiant','force'];
const PHYSICAL_DMG = ['slashing','piercing','bludgeoning'];
const DMG_TYPE_ES = {
  'perforante':'piercing','cortante':'slashing','contundente':'bludgeoning',
  'veneno':'poison','fuego':'fire','frío':'cold','rayo':'lightning',
  'trueno':'thunder','ácido':'acid','necrótico':'necrotic','radiante':'radiant',
  'psíquico':'psychic','fuerza':'force'
};
function normalizeDamageType(t){
  const w = String(t||'').toLowerCase().trim();
  return DMG_TYPES.includes(w) ? w : (DMG_TYPE_ES[w] || 'slashing');
}
function dmgTypeOptions(sel){ return DMG_TYPES.map(t=>`<option value="${t}" ${sel===t?'selected':''}>${t}</option>`).join(''); }
/* "1d10+3" → "1d10" (el +N va en "Bonus daño") */
function diceOnly(expr){ return String(expr||'').split(' ')[0].replace(/[+-]\d+$/, ''); }
/* Crítico: se duplican los dados, no el bonus fijo */
function doubleDice(expr){ return String(expr||'').replace(/(\d+)d(\d+)/g, (m, n, f) => (2*n)+'d'+f); }

/* Datos del spell/cantrip elegido en el form (o null) */
function getFormSpellData(d){
  const preset = CLASS_PRESETS[d.character] || {};
  if(d.actionType === 'spell')   return (preset.spellList||[]).find(s=>s.name===d.spellName) || null;
  if(d.actionType === 'cantrip') return (preset.cantripsData||[]).find(cn=>cn.name===d.cantripName) || null;
  return null;
}
/* Cómo se resuelve la acción: ataque, salvación, curación, castigo, dardos, rayos, Sueño, daño automático, buff… */
function getActionMode(d){
  if(d.actionType === 'class-ability') return 'ability';
  if(d.actionType === 'attack-melee' || d.actionType === 'attack-ranged') return 'attack';
  if(d.actionType !== 'spell' && d.actionType !== 'cantrip') return 'roll';
  const sp = getFormSpellData(d);
  if(!sp) return 'roll';
  if(sp.smite) return 'smite';
  if(sp.missiles) return 'missiles';
  if(sp.rays) return 'rays';
  if(sp.sleepPool) return 'sleep';
  if(isHealForm(d)) return 'heal';
  if(d.actionType === 'spell' ? spellRequiresAttack(sp.name, d.character) : cantripRequiresAttack(sp.name, d.character)) return 'attack';
  if(sp.saveType) return 'save';
  if(sp.autoDamage) return 'auto';
  if(sp.buff || sp.weaponRider || sp.buffDesc) return 'buff';
  return 'utility';
}
function upcastLevels(d, sp){
  return (d.actionType === 'spell' && sp) ? Math.max(0, (parseInt(d.spellLevel)||sp.level) - sp.level) : 0;
}
/* Slots desde el nivel del hechizo, según la tabla por nivel de personaje (no el preset estático) */
function getSlotOptions(c, minLevel){
  const slots = getSpellSlotsForLevel(c);
  return Object.keys(slots).map(Number).filter(l => l >= (minLevel||1)).sort((a,b)=>a-b)
    .map(l => Object.assign({ level:l }, loadSlotState(c, l)));
}
/* El slot más bajo con usos disponibles que alcance para el hechizo */
function defaultSlotLevel(c, minLevel){
  const opts = getSlotOptions(c, minLevel);
  const free = opts.find(o => o.max - o.used > 0);
  return (free || opts[0] || { level: minLevel||1 }).level;
}
/* El caster ya está concentrado en este hechizo → re-aplicar el efecto sin gastar slot
   (Moonbeam cada turno, ataques de Flame Blade, Heat Metal…) */
function isSustainingSpell(d, sp){
  if(!sp || !spellIsConcentration(sp)) return false;
  const p = getCombatant('pc:'+d.character);
  return !!(p && p.concentration && p.concentration.spellName === sp.name);
}
function sustainedCastingTime(sp){ return /bonus action c\/turno/i.test(sp.desc||'') ? 'bonus' : 'action'; }
function castingTag(sp){
  if(!sp) return '';
  const ct = getSpellCastingTime(sp);
  return `<span class="ability-action-tag ${ct==='action'?'is-action':ct==='bonus'?'is-bonus':'is-free'}">${CASTING_LABEL[ct]}</span>` +
    (spellIsConcentration(sp) ? ` <span class="conc-tag">◎ Concentración</span>` : '');
}
function spellInfoPreview(sp){
  if(!sp) return '';
  return `<div class="spell-info-preview">
    ${schoolBadge(sp.school)} <span class="spell-shape">${sp.shape||''}</span>
    <div style="font-size:0.82rem;color:var(--cream);margin-top:0.3rem">${sp.desc||''}</div>
  </div>`;
}

/* ── ARMAS ──
   Armas de monje (Artes Marciales): golpe sin arma, espada corta y armas simples cuerpo a cuerpo sin heavy/two-handed. */
const MONK_WEAPON_IDS = ['unarmed-monk','unarmed','quarterstaff','dagger','shortsword','spear','handaxe','mace','sickle','club','javelin','light-hammer'];
function isMonkWeapon(c, item){
  if(c !== 'relyo' || !item) return false;
  const props = item.properties || [];
  return props.includes('monk') || (MONK_WEAPON_IDS.includes(item.id) && !props.includes('heavy') && !props.includes('two-handed'));
}
/* Atributo del arma: el del arma; finesse y armas de monje usan el mayor entre STR y DEX */
function weaponAbility(c, item){
  const s = ABILITY_SCORES[c] || {};
  if((item.properties||[]).includes('finesse') || isMonkWeapon(c, item)) return (s.dex||10) >= (s.str||10) ? 'dex' : 'str';
  return item.atkStat || 'str';
}
/* Suma de un campo numérico de los buffs del PJ (ej: Arma Mágica +1) */
function charBuffBonus(c, key){ return (pcState(c).buffs||[]).reduce((t,b)=>t+(b[key]||0), 0); }

/* Extrae el bonus numérico de una expresión de dados.
   "1d12+3" → 3,  "1d12+3 slashing" → 3,  "2d6-1" → -1,  "1d8" → 0 */
function parseDamageBonus(diceStr){
  if(!diceStr) return 0;
  const m = String(diceStr).match(/\d+d\d+([+-]\d+)/);
  return m ? parseInt(m[1]) : 0;
}

/* Bonus de daño del arma: modificador del atributo del ataque + "+N" escrito en el arma (mágicas)
   + Furia (cuerpo a cuerpo con STR) + Arma Mágica. Las armas del catálogo traen solo el dado ("1d12"):
   antes el modificador nunca se sumaba. */
function calcWeaponDamageBonus(charId, item, actionType){
  if(!item) return 0;
  const s = ABILITY_SCORES[charId] || {};
  const stat = weaponAbility(charId, item);
  let bonus = abilityMod(s[stat] || 10) + parseDamageBonus(item.damage) + charBuffBonus(charId, 'weaponDmgBonus');
  if(charId === 'rac' && stat === 'str' && actionType !== 'attack-ranged'){
    const rac = LIVE_SESSION.combat.participants.find(p=>p.kind==='player' && p.refId==='rac');
    if(rac && rac.inRage) bonus += getRageDamageBonus(getCharLevel('rac'));
  }
  return bonus;
}

/* Calcula el modificador de ataque para un arma dado un personaje */
function calcWeaponAttackMod(charId, item){
  if(!item) return '';
  const scores = ABILITY_SCORES[charId];
  if(!scores) return '';
  const prof = item.proficient ? getCharProfBonus(charId) : 0;
  return abilityMod(scores[weaponAbility(charId, item)] || 10) + prof + charBuffBonus(charId, 'weaponAtkBonus');
}

/* Dado del arma: los monjes usan el dado de Artes Marciales si es mayor */
function weaponDamageDice(charId, item){
  const base = diceOnly(item.damage);
  if(!isMonkWeapon(charId, item)) return base;
  const ma = getMartialArtsDie(getCharLevel(charId));
  const m = base.match(/^(\d+)d(\d+)/);
  return (!m || +m[2] < ma) ? `1d${ma}` : base;
}

/* Warnings tácticos por condiciones activas en el objetivo */
function renderTargetConditionWarnings(targetId){
  if(!targetId) return '';
  const p = getCombatant(targetId);
  if(!p) return '';
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
  if(p.dodging) msgs.push(`🛡 <strong>${liveEscape(getCombatantName(p))} está esquivando (Dodge)</strong> → los ataques contra él tienen <strong class="dis-text">DESVENTAJA</strong>`);
  if(isDying(p)) msgs.push(`💀 <strong>Objetivo caído (inconsciente)</strong> → ataques con <strong class="adv-text">VENTAJA</strong>; a 5 ft todo golpe es crítico (2 fallos de death save)`);
  getBuffs(p).filter(b => b.acBonus || b.acMin).forEach(b => msgs.push(`🛡 <strong>${liveEscape(b.name)}</strong> → CA ${b.acBonus?'+'+b.acBonus:'mín. '+b.acMin} (ya incluida)`));
  if(!msgs.length) return '';
  return `<div class="target-cond-warnings">${msgs.map(t=>`<div class="cond-warn-line">${t}</div>`).join('')}</div>`;
}

/* Modificador de salvación: atributo + competencia si el PJ la tiene (saveProfs del preset).
   En Forma Salvaje, STR/DEX/CON salen de la bestia. Monstruos: modificador del atributo. */
function getCombatantSaveMod(p, stat){
  if(!p || !stat) return null;
  if(p.kind === 'player'){
    const ws = p.wildShape && p.wildShape.active ? p.wildShape : null;
    const scores = ABILITY_SCORES[p.refId];
    if(!scores) return null;
    const score = (ws && ['str','dex','con'].includes(stat) && ws[stat]) ? ws[stat] : scores[stat];
    const profs = (CLASS_PRESETS[p.refId] && CLASS_PRESETS[p.refId].saveProfs) || [];
    return abilityMod(score) + (profs.includes(stat) ? getCharProfBonus(p.refId) : 0);
  }
  const preset = PRESET_MONSTERS.find(m => m.id === p.refId);
  if(preset && preset[stat] != null) return abilityMod(preset[stat]);
  return null;
}

/* ── ATAQUE (arma o spell attack) ── */
function isWeaponAttack(d){ return d.actionType === 'attack-melee' || d.actionType === 'attack-ranged'; }

/* Daño extra al pegar con arma (solo PJ): smite cargado, Castigo Divino, Favor Divino */
function getAttackRiders(d){
  const c = d.character;
  if(!c || !isWeaponAttack(d)) return [];
  const riders = [];
  const ps = pcState(c);
  if(ps.pendingSmite) riders.push({ field:'pendingSmiteDmg', label:`${ps.pendingSmite.spell} (${ps.pendingSmite.damage} ${ps.pendingSmite.damageType||''})`, dice: ps.pendingSmite.damage, damageType: ps.pendingSmite.damageType });
  if(c === 'tyrell' && d.actionType === 'attack-melee' && d.divineSmite){
    const dice = Math.min(5, 1 + (parseInt(d.divineSmiteSlot)||1)) + (d.divineSmiteUndead ? 1 : 0);
    riders.push({ field:'divineSmiteDmg', label:`Castigo Divino Nv ${parseInt(d.divineSmiteSlot)||1} (${dice}d8 radiante)`, dice:`${dice}d8`, damageType:'radiant' });
  }
  (ps.buffs||[]).filter(b => b.weaponRider).forEach(b => riders.push({
    field:'rider_'+b.sourceSpell.replace(/\W+/g,'_'), label:`${b.name} (+${b.weaponRider.dice} ${b.weaponRider.damageType||''})`, dice:b.weaponRider.dice, damageType:b.weaponRider.damageType
  }));
  return riders;
}
function renderAttackRiders(d){
  const c = d.character;
  if(!c || !isWeaponAttack(d)) return '';
  const parts = [];
  if(c === 'tyrell' && d.actionType === 'attack-melee' && getCharLevel(c) >= 2){
    const slotOpts = getSlotOptions('tyrell', 1).map(o =>
      `<option value="${o.level}" ${parseInt(d.divineSmiteSlot)===o.level?'selected':''}>Nv ${o.level} · ${Math.min(5,1+o.level)}d8 (${o.max-o.used}/${o.max})</option>`).join('');
    parts.push(`<div class="rider-toggle">
      <label><input type="checkbox" ${d.divineSmite?'checked':''} onchange="updateFormField('divineSmite', this.checked)"> ✨ Castigo Divino (gasta el slot solo si pega)</label>
      ${d.divineSmite ? `<select class="form-input rider-slot" onchange="updateFormField('divineSmiteSlot', this.value)">${slotOpts}</select>
        <label class="rider-undead"><input type="checkbox" ${d.divineSmiteUndead?'checked':''} onchange="updateFormField('divineSmiteUndead', this.checked)"> no-muerto/infernal (+1d8)</label>` : ''}
    </div>`);
  }
  getAttackRiders(d).forEach(r => parts.push(`<div class="rider-row">
    <span class="rider-label">+ ${liveEscape(r.label)}</span>
    <input type="number" class="form-input rider-input" placeholder="${liveEscape(r.dice)}" value="${liveEscape(d[r.field]||'')}" oninput="updateFormField('${r.field}', this.value)">
  </div>`));
  const ps = pcState(c);
  if(ps.pendingSmite && ps.pendingSmite.saveType){
    const cond = ps.pendingSmite.condition ? getCondition(ps.pendingSmite.condition) : null;
    parts.push(`<div class="rider-row">
      <span class="rider-label">${ps.pendingSmite.saveType.toUpperCase()} save del objetivo (DC ${ps.pendingSmite.dc})${cond?` o queda ${liveEscape(cond.nameEs||cond.name)}`:''}</span>
      <input type="number" class="form-input rider-input" min="1" max="20" placeholder="d20" value="${liveEscape(d.pendingSmiteSaveRoll||'')}" oninput="updateFormField('pendingSmiteSaveRoll', this.value)">
    </div>`);
  }
  return parts.length ? `<div class="attack-riders">${parts.join('')}</div>` : '';
}

function renderHitOverride(d, field, onclickFn){
  field = field || 'hitOverride';
  const v = d[field] || '';
  const fn = onclickFn || (val => `updateFormField('${field}', '${val}')`);
  const b = (val, label, cls) => `<button type="button" class="hit-ovr ${cls}${v===val?' on':''}" title="Decisión del DM" onclick="${fn(v===val?'':val)}">${label}</button>`;
  return `<div class="hit-ovr-row">${b('hit','✓ Pega','hit')}${b('miss','✗ Falla','miss')}</div>`;
}

/* CA contra la que se tira: la escrita por el DM o la del objetivo (con buffs). En el form de
   monstruo, Shield (reacción de Esdas) suma +5 si todavía no está activo. */
function getAttackCA(d){
  const tp = getCombatant((d.targetIds||[])[0]);
  let ac = parseInt(d.targetCA !== '' && d.targetCA != null ? d.targetCA : (tp ? getCombatantAC(tp) : '')) || 0;
  if(d.useShield && shieldAvailable(tp)) ac += 5;   // Shield todavía no aplicado como buff
  if(d.rxCustom) ac += parseInt(d.rxAC) || 0;          // reacción del DM (Parada, etc.)
  return ac;
}
/* nat20 | nat1 | hit | miss | null. El override del DM manda (un 20 forzado a pegar sigue siendo crítico). */
function attackOutcome(roll, modifier, ac, override){
  if(override === 'hit') return isNat20(roll) ? 'nat20' : 'hit';
  if(override === 'miss') return 'miss';
  if(roll === '' || roll == null) return null;
  if(isNat20(roll)) return 'nat20';
  if(isNat1(roll)) return 'nat1';
  if(!ac) return null;
  return (parseInt(roll)||0) + (parseInt(modifier)||0) >= ac ? 'hit' : 'miss';
}
function isHitOutcome(o){ return o === 'hit' || o === 'nat20'; }

/* Daño del ataque. En el form de monstruo: Desviar Proyectiles resta y la resistencia (Furia) divide. */
function attackDamageBreakdown(d){
  const die = parseInt(d.damage);
  const base = (isNaN(die) ? 0 : die) + (d.damage !== '' && d.damage != null ? (parseInt(d.damageBonus)||0) : 0);
  const riders = getAttackRiders(d).map(r => ({ label:r.label, value: parseInt(d[r.field])||0 })).filter(r => r.value);
  let total = base + riders.reduce((s,r)=>s+r.value, 0);
  const notes = [];
  let counter = 0;
  const tp = getCombatant((d.targetIds||[])[0]);
  if(tp){
    // Orden: reducciones (Desviar) → resistencia (÷2, no se acumula) → Duro sobre lo que queda
    const deflect = deflectReduction(d, tp);
    if(deflect){ total = Math.max(0, total - deflect); notes.push(`Desviar Proyectiles −${deflect}`); }
    const halfRage = rageResists(d, tp), halfDM = !!(d.rxCustom && d.rxHalf);
    if(halfRage || halfDM){ total = Math.floor(total / 2); notes.push(halfRage ? 'resistencia (Furia) ÷2' : `${d.rxLabel || 'reacción'} ÷2`); }
    const duro = duroActive(d, tp) ? duroOutcome(d.duroRoll) : null;
    if(duro){
      counter = duro.counter ? Math.floor(total / 2) : 0;
      total = Math.floor(total * duro.mult);
      notes.push(`Duro: ${duro.short}`);
    }
  }
  return { base, riders, total, notes, counter };
}
function rageResists(d, tp){
  return !!(d.applyResistance !== false && tp && tp.inRage && PHYSICAL_DMG.includes(d.damageType));
}
function deflectReduction(d, tp){
  if(!tp || tp.refId !== 'relyo' || d.actionType !== 'attack-ranged' || d.deflectRoll === '' || d.deflectRoll == null) return 0;
  return (parseInt(d.deflectRoll)||0) + abilityMod((ABILITY_SCORES.relyo||{}).dex || 10) + getCharLevel('relyo');
}

function renderAttackSummary(d){
  const ac = getAttackCA(d);
  const out = attackOutcome(d.roll, d.modifier, ac, d.hitOverride);
  const total = (parseInt(d.roll)||0) + (parseInt(d.modifier)||0);
  const labels = {
    nat20: `★ CRÍTICO — NAT 20${d.roll!==''?` (total ${total})`:''}`,
    nat1:  `✗ PIFIA — NAT 1`,
    hit:   d.hitOverride === 'hit' ? '✓ Pega (decisión del DM)' : `HIT — ${total} ≥ CA ${ac}`,
    miss:  d.hitOverride === 'miss' ? '✗ Falla (decisión del DM)' : `MISS — ${total} < CA ${ac}`
  };
  let html = `<div class="result-outcome-main ${out||''}">${out ? labels[out] : (d.roll!==''&&d.roll!=null ? `Total: ${total}${ac?'':' — elegí objetivo o CA'}` : '—')}</div>`;
  const riders = getAttackRiders(d);
  if(out === 'nat20'){
    const dice = [diceOnly(d.damageDice), ...riders.map(r=>r.dice)].filter(Boolean).map(doubleDice);
    html += `<div class="crit-hint">★ Crítico: tirá el doble de dados${dice.length ? ` (${dice.map(liveEscape).join(' + ')})` : ''} — el bonus fijo no se duplica.</div>`;
  }
  const b = attackDamageBreakdown(d);
  const parts = [];
  if(d.damage !== '' && d.damage != null) parts.push(`${parseInt(d.damage)||0}${(parseInt(d.damageBonus)||0) ? ` ${parseInt(d.damageBonus)>=0?'+':'−'} ${Math.abs(parseInt(d.damageBonus))}` : ''}`);
  b.riders.forEach(r => parts.push(`${r.value} (${liveEscape(r.label.split(' (')[0])})`));
  html += `<div class="attack-dmg-total">Daño: <strong>${parts.length ? b.total : '—'}</strong>${parts.length > 1 || b.notes.length ? ` <span class="muted">= ${parts.join(' + ')}${b.notes.length ? ' · '+b.notes.join(' · ') : ''}</span>` : ''}</div>`;
  const tp = getCombatant((d.targetIds||[])[0]);
  if(tp && isHitOutcome(out) && duroActive(d, tp) && !duroOutcome(d.duroRoll)) html += `<div class="crit-hint">💪 ${liveEscape(getCombatantName(tp))} puede amortiguar este golpe con su dote: tirá el d20.</div>`;
  if(isHitOutcome(out) && b.counter > 0) html += `<div class="crit-hint">↩ Contragolpe al atacante: ${b.counter} de daño.</div>`;
  if(tp && d.applyDamage && b.total > 0 && out){
    if(isHitOutcome(out)){
      const cur = getCombatantHP(tp), max = getCombatantHPMax(tp), temp = getTempHP(tp);
      const after = Math.max(0, cur - Math.max(0, b.total - temp));
      html += `<div class="result-hp-preview">${liveEscape(getCombatantName(tp))}: HP ${cur}${temp?` (+${temp} temp)`:''} → <strong class="${after===0?'hp-zero':''}">${after}</strong> / ${max}${cur<=0?' · cuenta como fallo de death save':''}</div>`;
    } else {
      html += `<div class="result-hp-preview"><span class="muted">Falla — sin daño.</span></div>`;
    }
  }
  return html;
}

function renderAttackBlock(d){
  const tid = (d.targetIds||[])[0]||'';
  const tp = tid ? getCombatant(tid) : null;
  const displayCA = (d.targetCA !== '' && d.targetCA != null) ? d.targetCA : (tp ? String(getCombatantAC(tp)) : '');
  return `
    <div class="form-grid-halves">
      <div class="form-row">
        <label>Objetivo</label>
        <select class="form-input" onchange="setSingleTarget(this.value)">${targetOptionsHTML(tid, false)}</select>
      </div>
      <div class="form-row">
        <label>CA</label>
        <input type="number" class="form-input" placeholder="—" value="${liveEscape(displayCA)}" oninput="updateFormField('targetCA', this.value)">
      </div>
    </div>
    ${renderTargetConditionWarnings(tid)}
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
        <label>¿Pega? (opcional)</label>
        ${renderHitOverride(d)}
      </div>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>Dado de daño${d.damageDice ? ` (${liveEscape(diceOnly(d.damageDice))})` : ''}</label>
        <input type="number" class="form-input" placeholder="ej: 10" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)">
      </div>
      <div class="form-row">
        <label>Bonus daño (auto)</label>
        <input type="number" class="form-input" placeholder="+0" value="${liveEscape(d.damageBonus)}" oninput="updateFormField('damageBonus', this.value)">
      </div>
      <div class="form-row">
        <label>Tipo de daño</label>
        <select class="form-input" onchange="updateFormField('damageType', this.value)">${dmgTypeOptions(d.damageType)}</select>
      </div>
    </div>
    ${renderAttackRiders(d)}
    ${renderTargetReactions(d, tp)}
    <div class="form-checkbox-row"><label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño automáticamente</label></div>
    <div id="attack-summary" class="attack-summary">${renderAttackSummary(d)}</div>`;
}

/* ── SALVACIONES ──
   Un mismo bloque para: hechizos de salvación (ns ''), la explosión de Ice Knife (ns 'area')
   y las habilidades de monstruos (ns 'npc'). Lista enemigos y aliados: un área también agarra al grupo. */
const SAVE_NS = {
  '':     { targets:'targetIds',     rolls:'targetSaveRolls', ovr:'targetSaveOverrides', dmg:'damage',     dc:'saveDC',     type:'saveType' },
  'area': { targets:'areaTargetIds', rolls:'areaSaveRolls',   ovr:'areaSaveOverrides',   dmg:'areaDamage', dc:'areaSaveDC', type:'areaSaveType' },
  'npc':  { targets:'saveTargetIds', rolls:'targetSaveRolls', ovr:'targetSaveOverrides', dmg:'damage',     dc:'saveDC',     type:'saveType' }
};

function toggleTarget(id, ns){
  if(!currentForm) return;
  const key = SAVE_NS[ns||''].targets;
  const ids = currentForm.data[key] || [];
  const idx = ids.indexOf(id);
  if(idx === -1) ids.push(id); else ids.splice(idx, 1);
  currentForm.data[key] = ids;
  renderNoteForm();
}

/* cfg: { ns, title, halfOnSave, damageDice, damageType, condName, effDur, playersFirst, showDamage } */
function renderSaveBlock(d, cfg){
  cfg = cfg || {};
  const ns = cfg.ns || '';
  const N = SAVE_NS[ns];
  const saveType = d[N.type] || '';
  const statLabel = saveType.toUpperCase();
  const dc = parseInt(d[N.dc]) || 0;
  const rolls = d[N.rolls] || {}, overrides = d[N.ovr] || {}, selected = d[N.targets] || [];
  const ps = LIVE_SESSION.combat.participants;
  const enemies = ps.filter(p=>p.kind==='monster' && p.hp>0);
  const allies  = ps.filter(p=>p.kind==='player' && !isDead(p));
  const groups = cfg.playersFirst ? [['Jugadores', allies], ['Otros', enemies]] : [['Enemigos', enemies], ['Aliados (si quedan en el área)', allies]];

  const row = p => {
    const saveMod = getCombatantSaveMod(p, saveType);
    const modLabel = saveMod != null ? (saveMod >= 0 ? `+${saveMod}` : String(saveMod)) : '?';
    const roll = rolls[p.id] || '';
    const total = roll !== '' && saveMod != null ? parseInt(roll) + saveMod : null;
    const override = overrides[p.id];
    let outcomeTxt = '—', outcomeCls = '';
    if(override){ outcomeTxt = override === 'pass' ? 'PASS ✎' : 'FAIL ✎'; outcomeCls = override + ' overridden'; }
    else if(total != null){ outcomeTxt = total >= dc ? 'PASS' : 'FAIL'; outcomeCls = total >= dc ? 'pass' : 'fail'; }
    const isSelected = selected.includes(p.id);
    return `<div class="save-target-row${isSelected?' selected':''}">
      <button type="button" class="save-target-toggle${isSelected?' on':''}" onclick="toggleTarget('${p.id}','${ns}')" title="Incluir/excluir objetivo">
        ${liveEscape(getCombatantName(p))} <span class="muted" style="font-size:0.72rem">CA ${getCombatantAC(p)} · HP ${getCombatantHP(p)}</span>
      </button>
      <span class="save-stat-mod" title="${statLabel} save mod">${statLabel} ${modLabel}</span>
      <input type="number" class="form-input save-roll-input" min="1" max="20" placeholder="d20"
        value="${liveEscape(String(roll))}" oninput="updateTargetSaveRoll('${p.id}', this.value, '${ns}')">
      <span id="save-total-${ns}-${p.id}" class="save-total${total==null?' muted':''}">${total != null ? total : '—'}</span>
      <span id="save-outcome-${ns}-${p.id}" class="outcome-badge ${outcomeCls}">${outcomeTxt}</span>
      <button type="button" class="save-override-btn" onclick="overrideTargetSave('${p.id}', '${outcomeCls.includes('pass')?'fail':'pass'}', '${ns}')" title="Invertir resultado">↕</button>
    </div>`;
  };
  const listHTML = groups.filter(g => g[1].length).map(([label, arr]) =>
    `<div class="save-group-label">${label}</div>${arr.map(row).join('')}`).join('');
  const showDamage = cfg.showDamage || !!cfg.damageDice;
  const halfNote = cfg.halfOnSave ? '<span class="muted" style="font-size:0.75rem">· mitad de daño si pasan</span>' : '';

  return `<div class="save-block">
    ${cfg.title ? `<div class="save-block-title">${cfg.title}</div>` : ''}
    <div class="save-block-header">
      <span class="save-dc-label">${statLabel} Save DC</span>
      <input type="number" class="form-input save-dc-input" value="${liveEscape(String(dc||''))}" oninput="updateFormField('${N.dc}', this.value)">
      ${halfNote}
    </div>
    ${cfg.condName ? `<div class="spell-effect-block" style="margin-bottom:0.5rem">
      <div class="spell-effect-line">⚡ Al fallar: <strong>${liveEscape(cfg.condName)}</strong>${cfg.effDur ? ` · ${cfg.effDur}` : ''}</div>
    </div>` : ''}
    <div class="muted" style="font-size:0.75rem;margin-bottom:0.3rem">Marcá quiénes quedan en el área (click en el nombre) y cargá sus d20.</div>
    ${listHTML ? `<div class="save-targets-list">${listHTML}</div>` : '<div class="muted" style="font-size:0.8rem;padding:0.5rem 0">Sin combatientes en el tracker.</div>'}
    ${showDamage ? `<div class="form-grid" style="margin-top:0.75rem">
      <div class="form-row">
        <label>Daño (a los que fallan)${cfg.damageDice ? ` (${liveEscape(cfg.damageDice)})` : ''}</label>
        <input type="number" class="form-input" placeholder="ej: 18" value="${liveEscape(d[N.dmg]||'')}" oninput="updateFormField('${N.dmg}', this.value)">
      </div>
      ${ns !== 'area' ? `<div class="form-row">
        <label>Tipo de daño</label>
        <select class="form-input" onchange="updateFormField('damageType', this.value)">${dmgTypeOptions(d.damageType)}</select>
      </div>` : `<div class="form-row"><label>Tipo</label><div class="form-total-display">${liveEscape(cfg.damageType||'')}</div></div>`}
      <div class="form-row form-checkbox-row">
        <label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño automáticamente</label>
      </div>
    </div>` : ''}
  </div>`;
}

/* Actualiza la tirada de save de un objetivo sin re-renderizar todo el form */
function updateTargetSaveRoll(targetId, roll, ns){
  if(!currentForm) return;
  ns = ns || '';
  const N = SAVE_NS[ns];
  const d = currentForm.data;
  if(!d[N.rolls]) d[N.rolls] = {};
  d[N.rolls][targetId] = roll;
  const dc = parseInt(d[N.dc]) || 0;
  const p = getCombatant(targetId);
  const saveMod = getCombatantSaveMod(p, d[N.type]) || 0;
  const total = (parseInt(roll) || 0) + saveMod;
  const totalEl = document.getElementById(`save-total-${ns}-${targetId}`);
  if(totalEl) totalEl.textContent = roll ? `${total}` : '—';
  const badge = document.getElementById(`save-outcome-${ns}-${targetId}`);
  if(badge && !(d[N.ovr]||{})[targetId]){
    if(!roll){ badge.textContent = '—'; badge.className = 'outcome-badge'; return; }
    const pass = total >= dc;
    badge.textContent = pass ? 'PASS' : 'FAIL';
    badge.className = 'outcome-badge ' + (pass ? 'pass' : 'fail');
  }
}

/* Override manual de pass/fail por el DM */
function overrideTargetSave(targetId, result, ns){
  if(!currentForm) return;
  const N = SAVE_NS[ns||''];
  if(!currentForm.data[N.ovr]) currentForm.data[N.ovr] = {};
  currentForm.data[N.ovr][targetId] = result;
  renderNoteForm();
}

/* Resuelve las salvaciones marcadas de un bloque: aplica daño (mitad si pasan y halfOnSave) y devuelve los resultados */
function resolveSaveTargets(d, ns, damage, halfOnSave){
  const N = SAVE_NS[ns||''];
  const dc = parseInt(d[N.dc]) || 0;
  return (d[N.targets] || []).map(tid => {
    const p = getCombatant(tid); if(!p) return null;
    const saveMod = getCombatantSaveMod(p, d[N.type]) || 0;
    const roll = (d[N.rolls] || {})[tid] || '';
    const total = roll !== '' ? parseInt(roll) + saveMod : null;
    const override = (d[N.ovr] || {})[tid];
    const outcome = override || (total != null ? (total >= dc ? 'pass' : 'fail') : null);
    const hpBefore = getCombatantHP(p);
    let hpAfter = hpBefore, damageDealt = 0;
    const dmg = parseInt(damage) || 0;
    if(d.applyDamage && dmg && outcome){
      damageDealt = outcome === 'fail' ? dmg : (halfOnSave ? Math.floor(dmg/2) : 0);
      if(damageDealt > 0){ changeCombatantHP(tid, -damageDealt); hpAfter = getCombatantHP(p); }
    }
    return { id: tid, name: getCombatantName(p), saveType: d[N.type], saveMod, roll, total, dc, outcome, hpBefore, hpAfter, halfOnSave, damageDealt };
  }).filter(Boolean);
}

/* ── CASTIGOS (smite spells) ── se lanzan como Bonus Action y quedan cargados hasta el próximo golpe */
function renderSmiteBlock(d, sp){
  const name = d.character.charAt(0).toUpperCase() + d.character.slice(1);
  const cond = sp.effect && sp.effect.targetConditionOnFail ? getCondition(sp.effect.targetConditionOnFail) : null;
  return `<div class="spell-effect-block">
    <div class="spell-effect-line">⚔ Queda cargado: el próximo golpe con arma de ${name} suma <strong>+${liveEscape(sp.damage||'')} ${liveEscape(sp.damageType||'')}</strong>. El daño se tira y se aplica en el form de ataque, al pegar.</div>
    ${sp.saveType ? `<div class="spell-effect-line">Al pegar, el objetivo tira <strong>${sp.saveType.toUpperCase()} save DC ${calcSpellSaveDC(d.character)}</strong>${cond ? ` o queda <strong>${liveEscape(cond.nameEs||cond.name)}</strong>` : ''}.</div>` : ''}
    ${spellIsConcentration(sp) ? '<div class="spell-effect-line">◎ Concentración — si se rompe antes de pegar, el castigo se pierde.</div>' : ''}
  </div>`;
}

/* ── MISIL MÁGICO ── dardos que siempre pegan, repartidos entre objetivos */
function missileCount(d, sp){ return sp.missiles.count + (sp.missiles.perLevel||0) * upcastLevels(d, sp); }
function missileDamagePerDart(d, sp){
  const roll = parseInt(d.missileRoll);
  return isNaN(roll) ? null : roll + parseDamageBonus(sp.missiles.dice);
}
function updateDarts(id, value){
  if(!currentForm) return;
  const d = currentForm.data;
  if(!d.darts) d.darts = {};
  d.darts[id] = Math.max(0, parseInt(value)||0);
  updateFormAssistance();
}
function renderMissileSummary(d){
  const sp = getFormSpellData(d); if(!sp || !sp.missiles) return '';
  const n = missileCount(d, sp);
  const used = Object.values(d.darts||{}).reduce((s,v)=>s+(v||0), 0);
  const per = missileDamagePerDart(d, sp);
  const lines = Object.entries(d.darts||{}).filter(([,v]) => v > 0).map(([id, v]) => {
    const p = getCombatant(id); if(!p) return '';
    return `${liveEscape(getCombatantName(p))}: ${v} dardo${v>1?'s':''}${per != null ? ` = <strong>${v*per}</strong>` : ''}`;
  }).filter(Boolean);
  return `<div class="${used > n ? 'form-warn' : 'muted'}">Dardos asignados ${used}/${n}${per != null ? ` · ${per} por dardo` : ''}</div>${lines.length ? `<div>${lines.join(' · ')}</div>` : ''}`;
}
function renderMissilesBlock(d, sp){
  const ps = LIVE_SESSION.combat.participants.filter(p => p.kind === 'monster' ? p.hp > 0 : !isDead(p));
  const rows = ps.map(p => `<div class="dart-row">
    <span>${liveEscape(getCombatantName(p))} <span class="muted" style="font-size:0.72rem">HP ${getCombatantHP(p)}</span></span>
    <input type="number" class="form-input dart-input" min="0" value="${(d.darts||{})[p.id]||0}" oninput="updateDarts('${p.id}', this.value)">
  </div>`).join('');
  return `<div class="spell-effect-block">
    <div class="spell-effect-line">✦ <strong>${missileCount(d, sp)} dardos</strong> de ${liveEscape(sp.missiles.dice)} ${liveEscape(sp.damageType||'force')} — siempre pegan, repartilos entre objetivos.</div>
    <div class="form-row" style="margin-top:0.4rem">
      <label>d4 (una tirada para todos los dardos)</label>
      <input type="number" class="form-input" min="1" max="4" placeholder="1-4" value="${liveEscape(d.missileRoll||'')}" oninput="updateFormField('missileRoll', this.value)">
    </div>
    ${rows || '<div class="muted">Sin combatientes en el tracker.</div>'}
    <div id="missile-summary" class="attack-summary">${renderMissileSummary(d)}</div>
  </div>`;
}

/* ── RAYO ABRASADOR ── una tirada de ataque por rayo, cada uno a cualquier objetivo */
function rayCount(d, sp){ return sp.rays.count + (sp.rays.perLevel||0) * upcastLevels(d, sp); }
function ensureRays(d, sp){
  const n = rayCount(d, sp);
  if(!Array.isArray(d.rays)) d.rays = [];
  while(d.rays.length < n) d.rays.push({ targetId: (d.rays[d.rays.length-1]||{}).targetId || '', roll:'', damage:'', override:'' });
  d.rays.length = n;
}
function updateRay(i, field, value, rerender){
  if(!currentForm || !currentForm.data.rays || !currentForm.data.rays[i]) return;
  currentForm.data.rays[i][field] = value;
  if(rerender) renderNoteForm(); else updateFormAssistance();
}
function rayOutcome(d, r){
  const tp = getCombatant(r.targetId);
  return attackOutcome(r.roll, d.modifier, tp ? getCombatantAC(tp) : 0, r.override);
}
function renderRaysSummary(d){
  const sp = getFormSpellData(d); if(!sp || !sp.rays) return '';
  const labels = { nat20:'★ CRÍTICO', nat1:'✗ NAT 1', hit:'HIT', miss:'MISS' };
  return (d.rays||[]).map((r, i) => {
    const o = rayOutcome(d, r);
    return `<span class="outcome-badge ${o||''}">Rayo ${i+1}: ${o ? labels[o] : '—'}</span>`;
  }).join(' ');
}
function renderRaysBlock(d, sp){
  ensureRays(d, sp);
  const rows = d.rays.map((r, i) => `<div class="ray-row">
    <span class="ray-num">Rayo ${i+1}</span>
    <select class="form-input" onchange="updateRay(${i}, 'targetId', this.value, true)">${targetOptionsHTML(r.targetId, false)}</select>
    <input type="number" class="form-input" min="1" max="20" placeholder="d20" value="${liveEscape(r.roll)}" oninput="updateRay(${i}, 'roll', this.value)">
    <input type="number" class="form-input" placeholder="${liveEscape(sp.damage||'')}" value="${liveEscape(r.damage)}" oninput="updateRay(${i}, 'damage', this.value)">
    ${renderHitOverride(r, 'override', val => `updateRay(${i}, 'override', '${val}', true)`)}
  </div>`).join('');
  return `<div class="spell-effect-block">
    <div class="spell-effect-line">🔥 <strong>${d.rays.length} rayos</strong> — cada uno es un spell attack aparte (${liveEscape(sp.damage||'')} ${liveEscape(sp.damageType||'')}). En crítico, doble de dados.</div>
    <div class="form-row" style="margin-top:0.4rem;max-width:200px">
      <label>Modificador de ataque</label>
      <input type="number" class="form-input" value="${liveEscape(d.modifier)}" oninput="updateFormField('modifier', this.value)">
    </div>
    <div class="ray-head"><span></span><span>Objetivo</span><span>d20</span><span>Daño</span><span>¿Pega?</span></div>
    ${rows}
    <div id="rays-summary" class="attack-summary">${renderRaysSummary(d)}</div>
  </div>`;
}

/* ── SUEÑO ── pool de HP: duermen de menor a mayor HP actual hasta agotarlo */
function sleepPoolLabel(d, sp){
  const up = upcastLevels(d, sp);
  return sp.sleepPool.dice + (up ? ` + ${up}×${sp.sleepPool.perLevel}` : '');
}
function toggleSleepTarget(id){
  if(!currentForm) return;
  const d = currentForm.data;
  const ids = d.sleepTargets || [];
  d.sleepTargets = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  renderNoteForm();
}
/* Quiénes se duermen con el pool tirado (sin no-muertos: el DM los desmarca) */
function computeSleep(d){
  const pool0 = parseInt(d.sleepRoll);
  if(isNaN(pool0)) return null;
  let pool = pool0;
  const res = [];
  (d.sleepTargets||[]).map(getCombatant).filter(Boolean)
    .sort((a,b) => getCombatantHP(a) - getCombatantHP(b))
    .forEach(p => {
      const hp = getCombatantHP(p);
      if(hp <= 0 || hasCondition(p, 'unconscious')) return;
      if(pool >= hp){ pool -= hp; res.push({ p, asleep:true, hp }); }
      else res.push({ p, asleep:false, hp });
    });
  return { res, left: pool };
}
function renderSleepSummary(d){
  const r = computeSleep(d);
  if(!r) return '<span class="muted">Tirá el pool para ver quién se duerme.</span>';
  return r.res.map(x => `<span class="outcome-badge ${x.asleep?'fail':'pass'}">${liveEscape(getCombatantName(x.p))} (${x.hp} HP): ${x.asleep?'💤 duerme':'despierto'}</span>`).join(' ') +
    ` <span class="muted">· sobran ${r.left}</span>`;
}
function renderSleepBlock(d, sp){
  if(!Array.isArray(d.sleepTargets)) d.sleepTargets = getAliveMonsters().map(p => p.id);
  const ps = LIVE_SESSION.combat.participants.filter(p => getCombatantHP(p) > 0);
  const pills = ps.map(p => `<button type="button" class="save-target-toggle${d.sleepTargets.includes(p.id)?' on':''}" onclick="toggleSleepTarget('${p.id}')">${liveEscape(getCombatantName(p))} <span class="muted" style="font-size:0.72rem">HP ${getCombatantHP(p)}</span></button>`).join(' ');
  return `<div class="spell-effect-block">
    <div class="spell-effect-line">💤 Pool de <strong>${sleepPoolLabel(d, sp)}</strong> HP: se duermen (Inconsciente, 1 min) de menor a mayor HP actual hasta agotarlo. Inmunes: no-muertos y quienes no pueden ser hechizados — desmarcalos. Un golpe o una acción para despertarlos los saca.</div>
    <div class="form-row" style="margin-top:0.4rem;max-width:220px">
      <label>Tirada del pool</label>
      <input type="number" class="form-input" min="1" placeholder="ej: 22" value="${liveEscape(d.sleepRoll||'')}" oninput="updateFormField('sleepRoll', this.value)">
    </div>
    <div class="muted" style="font-size:0.75rem;margin:0.3rem 0">Criaturas en el área:</div>
    <div class="buff-target-pills">${pills || '<span class="muted">Sin combatientes.</span>'}</div>
    <div id="sleep-summary" class="attack-summary">${renderSleepSummary(d)}</div>
  </div>`;
}

/* ── DAÑO AUTOMÁTICO ── (Heat Metal, Spike Growth): sin tirada de ataque ni salvación */
function toggleListTarget(field, id){
  if(!currentForm) return;
  const d = currentForm.data;
  const ids = d[field] || [];
  d[field] = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  renderNoteForm();
}
function renderAutoDamageBlock(d, sp){
  const ps = LIVE_SESSION.combat.participants.filter(p => p.kind === 'monster' ? p.hp > 0 : !isDead(p));
  const sel = d.autoTargets || [];
  const pills = ps.map(p => `<button type="button" class="save-target-toggle${sel.includes(p.id)?' on':''}" onclick="toggleListTarget('autoTargets','${p.id}')">${liveEscape(getCombatantName(p))} <span class="muted" style="font-size:0.72rem">HP ${getCombatantHP(p)}</span></button>`).join(' ');
  return `<div class="spell-effect-block">
    <div class="spell-effect-line">⚡ Daño automático (sin ataque ni salvación) a los objetivos marcados.</div>
    <div class="buff-target-pills" style="margin:0.4rem 0">${pills || '<span class="muted">Sin combatientes.</span>'}</div>
    <div class="form-grid">
      <div class="form-row"><label>Daño${sp.damage ? ` (${liveEscape(sp.damage)})` : ''}</label>
        <input type="number" class="form-input" placeholder="ej: 9" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)"></div>
      <div class="form-row"><label>Tipo de daño</label>
        <select class="form-input" onchange="updateFormField('damageType', this.value)">${dmgTypeOptions(d.damageType)}</select></div>
      <div class="form-row form-checkbox-row"><label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño automáticamente</label></div>
    </div>
  </div>`;
}

/* ── BUFFS ── (Bendición, Aid, Escudo de Fe, Piel de Corteza, Haste, Favor Divino, Arma Mágica, Heroísmo…) */
function isSelfSpell(sp){ return /^self/i.test(sp.shape||''); }
function buffMaxTargets(d, sp){ return (sp.maxTargets||1) + (sp.targetsPerLevel||0) * upcastLevels(d, sp); }
function renderBuffBlock(d, sp){
  const name = d.character.charAt(0).toUpperCase() + d.character.slice(1);
  const lines = [];
  if(spellIsConcentration(sp)) lines.push(`◎ <strong>Concentración</strong> — reemplaza cualquier concentración activa de ${name}.`);
  if(sp.buffDesc) lines.push(liveEscape(sp.buffDesc));
  const tempHP = sp.buff && sp.buff.tempHP ? sp.buff.tempHP + (sp.buff.tempHPPerLevel||0) * upcastLevels(d, sp) : 0;
  if(tempHP) lines.push(`+${tempHP} HP a cada objetivo — la app los registra como HP temporales (absorben daño igual; no se recuperan curando).`);
  let targetsHTML;
  if(isSelfSpell(sp)){
    targetsHTML = `<div class="muted" style="font-size:0.8rem">Objetivo: ${name} (self)</div>`;
  } else {
    const max = buffMaxTargets(d, sp);
    const sel = d.buffTargets || [];
    const cands = [...getHealTargets(), ...getAliveMonsters()];
    const pills = cands.map(p => `<button type="button" class="save-target-toggle${sel.includes(p.id)?' on':''}" onclick="toggleListTarget('buffTargets','${p.id}')">${liveEscape(getCombatantName(p))}</button>`).join(' ');
    targetsHTML = `<div class="muted" style="font-size:0.75rem;margin:0.3rem 0">Objetivos <span class="${sel.length>max?'form-warn':''}">(${sel.length}/${max})</span>:</div><div class="buff-target-pills">${pills}</div>`;
  }
  return `<div class="spell-effect-block">
    ${lines.map(l => `<div class="spell-effect-line">${l}</div>`).join('')}
    ${targetsHTML}
  </div>`;
}

function renderUtilityBlock(d, sp){
  return `<div class="spell-effect-block">
    ${spellIsConcentration(sp) ? `<div class="spell-effect-line">◎ <strong>Concentración</strong> — se registra en el tracker y reemplaza la anterior.</div>` : ''}
    <div class="spell-effect-line muted">Sin daño ni objetivo mecánico — se registra la nota (y el slot).</div>
  </div>`;
}

/* Tirada simple: skill check, saving throw propio, acción libre */
function renderRollBlock(d){
  return `
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
    </div>
    ${d.actionType === 'skill' || d.actionType === 'save' ? '<div class="muted" style="font-size:0.75rem">No gasta la acción del turno (las salvaciones y checks reactivos no son acciones).</div>' : ''}`;
}

function renderActionForm(){
  const d = currentForm.data;
  const c = d.character;
  const preset = CLASS_PRESETS[c] || {};
  const combatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId===c);
  const wild = !!(combatant && combatant.wildShape && combatant.wildShape.active);
  // En Forma Salvaje no se lanzan hechizos
  if(wild && (d.actionType === 'spell' || d.actionType === 'cantrip')){ d.actionType = 'attack-melee'; d.spellName = ''; d.cantripName = ''; }
  const sp = getFormSpellData(d);
  const mode = getActionMode(d);

  // Spell options (solo preparados)
  const preparedSpells = (preset.spellList||[]).filter(s=>isSpellPrepared(c, s.name));
  const ownSchool = getCommittedSchool(c);
  const spellOpts = preparedSpells.map(s=>
    `<option value="${liveEscape(s.name)}" ${d.spellName===s.name?'selected':''}>${s.school===ownSchool?'★ ':''}${s.name} / ${s.nameEs} (Nv ${s.level})</option>`
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
    // El modificador del save sale solo (atributo + competencia)
    if(d.modifier === '' || d.modifier == null){ const m = getCombatantSaveMod(getCombatant('pc:'+c), d.save); if(m != null) d.modifier = String(m); }
    conditionalHTML = `
      <div class="form-row">
        <label>Saving Throw</label>
        <select class="form-input" onchange="updateFormField('save', this.value)">
          ${['str','dex','con','int','wis','cha'].map(ab=>`<option value="${ab}" ${d.save===ab?'selected':''}>${ab.toUpperCase()}</option>`).join('')}
        </select>
      </div>`;
  } else if(d.actionType === 'spell'){
    const levelOpts = sp ? getSlotOptions(c, sp.level).map(o =>
      `<option value="${o.level}" ${parseInt(d.spellLevel)===o.level?'selected':''}>Nivel ${o.level} (${o.max-o.used}/${o.max} disponibles)</option>`).join('') : '';
    const sustaining = isSustainingSpell(d, sp);
    conditionalHTML = `
      <div class="form-row">
        <label>Hechizo (solo preparados)</label>
        <select class="form-input" onchange="selectSpell(this.value, '${liveEscape(c)}')">
          <option value="">— elegir hechizo —</option>
          ${spellOpts}
        </select>
        ${preparedSpells.length === 0 ? '<div class="form-warn">⚠ ningún hechizo preparado. Andá a la hoja del personaje y marcá con ✓ los hechizos a preparar.</div>' : ''}
      </div>
      ${sp ? `<div class="form-grid-halves">
        <div class="form-row">
          <label>Nivel del slot a gastar</label>
          <select class="form-input" onchange="updateFormField('spellLevel', this.value)" ${d.sustained?'disabled':''}>${levelOpts || `<option value="${sp.level}">Sin slots de Nv ${sp.level}+</option>`}</select>
        </div>
        <div class="form-row"><label>Lanzamiento</label><div>${castingTag(sp)}</div></div>
      </div>` : ''}
      ${renderOwnSchoolBanner(c, sp, d)}
      ${sustaining ? `<div class="form-checkbox-row"><label><input type="checkbox" ${d.sustained?'checked':''} onchange="updateFormField('sustained', this.checked)"> ◎ Efecto sostenido — ${liveEscape(sp.name)} ya está activo: no gasta slot (${sustainedCastingTime(sp)==='bonus'?'Bonus Action':'Action'})</label></div>` : ''}
      ${spellInfoPreview(sp)}`;
  } else if(d.actionType === 'cantrip'){
    conditionalHTML = `
      <div class="form-grid-halves">
        <div class="form-row">
          <label>Cantrip (solo activos)</label>
          <select class="form-input" onchange="selectCantrip(this.value, '${liveEscape(c)}')">
            <option value="">— elegir cantrip —</option>
            ${cantripOpts}
          </select>
          ${activeCantrips.length === 0 ? '<div class="form-warn">⚠ ningún cantrip activo.</div>' : ''}
        </div>
        ${sp ? `<div class="form-row"><label>Lanzamiento</label><div>${castingTag(sp)}</div></div>` : ''}
      </div>
      ${spellInfoPreview(sp)}`;
  } else if(isWeaponAttack(d)){
    let weaponOpts;
    if(wild){
      const attacks = combatant.wildShape.attacks || [];
      if(!d.weaponId && attacks.length) selectWeaponData(d, 'beast:0');
      weaponOpts = `<option value="">— libre —</option>` + attacks.map((a,i) =>
        `<option value="beast:${i}" ${d.weaponId==='beast:'+i?'selected':''}>🐺 ${liveEscape(a.name)} (+${parseInt(a.bonus)||0} · ${liveEscape(a.dmg)})</option>`).join('');
    } else {
      const equippedWeapons = getEquippedWeapons(c);
      // Pre-elegir la primera arma (no el golpe sin arma) para ahorrar un click
      if(!d.weaponId && !d.weaponPicked){
        const first = equippedWeapons.find(w => !w.id.startsWith('unarmed')) || equippedWeapons[0];
        if(first) selectWeaponData(d, first.id);
      }
      weaponOpts = `<option value="">— libre / sin arma —</option>` +
        equippedWeapons.map(w=>`<option value="${w.id}" ${d.weaponId===w.id?'selected':''}>${w.nameEs||w.name} (${weaponDamageDice(c, w)} ${w.damageType})</option>`).join('');
    }
    conditionalHTML = `
      <div class="form-row">
        <label>${wild ? 'Ataque de la bestia' : 'Arma'}</label>
        <select class="form-input" onchange="selectWeapon(this.value)">${weaponOpts}</select>
      </div>`;
  } else if(d.actionType === 'class-ability'){
    const abilities = CHAR_CLASS_ABILITIES[c] || [];
    const lvl = getCharLevel(c);
    let abilityOpts = '<option value="">— elegir habilidad —</option>';
    abilities.forEach(key => {
      const abMeta = ABILITY_META[key]; if(!abMeta) return;
      if(abMeta.minLevel && lvl < abMeta.minLevel) return;
      const rs = getAbilityResourceStatus(c, key);
      const tag = rs.label ? ` · ${rs.label}` : '';
      abilityOpts += `<option value="${key}" ${d.abilityKey===key?'selected':''}>${abMeta.name} / ${abMeta.nameEn}${tag}</option>`;
    });
    const abMeta = d.abilityKey ? ABILITY_META[d.abilityKey] : null;
    const rs     = d.abilityKey ? getAbilityResourceStatus(c, d.abilityKey) : null;
    const warnHTML = (rs && rs.warn) ? `<div class="form-warn">⚠ Sin recursos disponibles para esta habilidad. Podés guardar la nota igual.</div>` : '';
    const specificHTML = (d.abilityKey && abMeta) ? renderAbilitySpecificFields(c, d.abilityKey, d, lvl, combatant) : '';
    conditionalHTML = `
      <div class="form-row">
        <label>Habilidad</label>
        <select class="form-input" onchange="updateFormField('abilityKey', this.value)">${abilityOpts}</select>
      </div>
      ${abMeta ? renderAbilityInfoBox(abMeta) : ''}
      ${warnHTML}
      ${specificHTML}`;
  }

  // Sección inferior: cómo se resuelve
  let bottomHTML = '';
  if(mode === 'attack'){
    bottomHTML = renderAttackBlock(d);
    if(sp && sp.areaSave) bottomHTML += renderSaveBlock(d, { ns:'area', title:`❄ Explosión (pegue o falle): criaturas a 5 ft del objetivo — ${sp.areaSave.damage} ${sp.areaSave.damageType}`, damageDice: sp.areaSave.damage, damageType: sp.areaSave.damageType, showDamage:true });
  }
  else if(mode === 'save'){
    const eff = sp && sp.effect;
    const cond = eff && eff.targetConditionOnFail ? getCondition(eff.targetConditionOnFail) : null;
    bottomHTML = renderSaveBlock(d, { ns:'', halfOnSave: d.halfOnSave, damageDice: d.damageDice,
      condName: cond ? `${cond.name} / ${cond.nameEs}` : (eff && eff.targetConditionOnFail) || '', effDur: eff && eff.duration ? `${eff.duration} rounds` : '' });
  }
  else if(mode === 'heal')     bottomHTML = renderHealBlock(d);
  else if(mode === 'smite')    bottomHTML = renderSmiteBlock(d, sp);
  else if(mode === 'missiles') bottomHTML = renderMissilesBlock(d, sp);
  else if(mode === 'rays')     bottomHTML = renderRaysBlock(d, sp);
  else if(mode === 'sleep')    bottomHTML = renderSleepBlock(d, sp);
  else if(mode === 'auto')     bottomHTML = renderAutoDamageBlock(d, sp);
  else if(mode === 'buff')     bottomHTML = renderBuffBlock(d, sp);
  else if(mode === 'utility')  bottomHTML = renderUtilityBlock(d, sp);
  else if(mode === 'roll')     bottomHTML = renderRollBlock(d);

  // ── Rac: Furia y Ataque Imprudente ──
  const racCombatant = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId==='rac');
  const racInRage = c === 'rac' && racCombatant && racCombatant.inRage;
  const racReckless = c === 'rac' && racCombatant && racCombatant.recklessThisTurn;
  const rageBonus = getRageDamageBonus(getCharLevel('rac'));
  const rageBannerHTML = (c === 'rac') ? `
    ${racInRage ? `<div class="action-buff-banner buff-rage">😠 <strong>Furia activa</strong> — daño STR cuerpo a cuerpo +${rageBonus} (ya sumado al bonus), resistencia a daño físico (B/P/S), ventaja en STR checks/saves.</div>` : ''}
    ${racReckless ? `<div class="action-buff-banner buff-warn">⚔ <strong>Ataque Imprudente</strong> activo — los atacantes tienen ventaja contra Rac hasta su próximo turno.</div>` : ''}
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

  const extraAttack = combatant && isWeaponAttack(d) && getMaxAttacks(combatant) > 1
    ? `<div class="muted" style="font-size:0.75rem">Ataque Extra: ${getMaxAttacks(combatant)} ataques con la acción Attack — usá "Guardar + otro ataque".</div>` : '';
  const canRepeat = mode === 'attack';

  return `
    <div class="note-form action-form">
      <div class="form-title">+ Acción jugador ${combatant ? renderEconomyChips(combatant) : ''}</div>

      <div class="form-grid">
        <div class="form-row">
          <label>Personaje</label>
          <select class="form-input" onchange="updateFormField('character', this.value)">
            ${CHARS.map(ch=>`<option value="${ch}" ${c===ch?'selected':''}>${ch.charAt(0).toUpperCase()+ch.slice(1)} (${(CLASS_PRESETS[ch]||{}).className||''})</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Tipo de acción</label>
          <select class="form-input" onchange="updateFormField('actionType', this.value)">
            <option value="attack-melee" ${d.actionType==='attack-melee'?'selected':''}>${wild?'🐺 Ataque de la bestia':'Ataque cuerpo a cuerpo'}</option>
            ${wild ? '' : `<option value="attack-ranged" ${d.actionType==='attack-ranged'?'selected':''}>Ataque a distancia</option>`}
            <option value="skill" ${d.actionType==='skill'?'selected':''}>Skill check</option>
            <option value="save" ${d.actionType==='save'?'selected':''}>Saving throw</option>
            ${wild ? '' : `<option value="spell" ${d.actionType==='spell'?'selected':''}>Lanzar hechizo</option>
            <option value="cantrip" ${d.actionType==='cantrip'?'selected':''}>Lanzar cantrip</option>`}
            <option value="class-ability" ${d.actionType==='class-ability'?'selected':''}>⚡ Habilidad de clase</option>
            <option value="other" ${d.actionType==='other'?'selected':''}>Acción libre / narrativa</option>
          </select>
        </div>
      </div>

      ${rageBannerHTML}
      ${renderCharBuffBanners(c)}
      ${recklessHTML}
      ${conditionalHTML}
      ${extraAttack}

      ${bottomHTML}

      <div class="form-row">
        <label>Notas libres</label>
        <textarea class="form-input form-textarea" placeholder="Lo que pasó en la mesa..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        ${canRepeat ? `<button class="btn-secondary" onclick="saveActionNote(true)" title="Guarda y deja el form listo para el siguiente ataque (Ataque Extra, Multiattack)">Guardar + otro ataque</button>` : ''}
        <button class="btn-primary" onclick="saveActionNote()">Guardar nota</button>
      </div>
    </div>
  `;
}

/* Aviso para el DM cuando el hechizo es de la escuela del personaje (Esdas: Adivinación).
   Desde Nv 6, Adivinación Experta: lanzarlo con slot de Nv 2+ devuelve un slot gastado de nivel menor. */
const SCHOOL_ES = { abjuration:'Abjuración', conjuration:'Conjuración', divination:'Adivinación', enchantment:'Encantamiento',
  evocation:'Evocación', illusion:'Ilusión', necromancy:'Nigromancia', transmutation:'Transmutación' };
function renderOwnSchoolBanner(c, sp, d){
  const school = getCommittedSchool(c);
  if(!sp || !school || sp.school !== school) return '';
  const expert = school === 'divination' && getCharLevel(c) >= 6 && (parseInt(d.spellLevel) || sp.level) >= 2 && !d.sustained;
  return `<div class="action-buff-banner buff-holy">★ <strong>Hechizo de su escuela (${SCHOOL_ES[school] || school})</strong>${expert
    ? ` — Adivinación Experta: al lanzarlo recupera un slot gastado de nivel menor a ${parseInt(d.spellLevel) || sp.level} (máx. Nv 5). Marcalo en la hoja.`
    : ''}</div>`;
}

/* Limpia lo que depende del hechizo/arma elegido (para no arrastrar tiradas de otra selección) */
function resetResolutionState(d){
  Object.assign(d, {
    targetIds:[], targetCA:'', roll:'', hitOverride:'', damage:'', damageBonus:'',
    targetSaveRolls:{}, targetSaveOverrides:{}, areaTargetIds:[], areaSaveRolls:{}, areaSaveOverrides:{}, areaDamage:'',
    darts:{}, missileRoll:'', rays:[], sleepRoll:'', sleepTargets:null, buffTargets:[], autoTargets:[], sustained:false,
    divineSmite:false, divineSmiteDmg:'', pendingSmiteDmg:'', pendingSmiteSaveRoll:'',
    useShield:false, deflectRoll:'', duroOn:undefined, duroRoll:'', rxCustom:false, rxLabel:'', rxAC:'', rxHalf:false
  });
}

/* Auto-fill al elegir un spell: slot = el más bajo disponible ≥ nivel del hechizo */
function selectSpell(spellName, charId){
  if(!currentForm) return;
  const d = currentForm.data;
  d.spellName = spellName;
  resetResolutionState(d);
  const sp = getFormSpellData(d);
  if(!sp){ renderNoteForm(); return; }
  d.spellLevel = defaultSlotLevel(charId, sp.level);
  d.damageDice = sp.damage || '';
  d.damageType = sp.damageType || 'slashing';
  d.saveType = sp.saveType || '';
  d.halfOnSave = !!sp.halfOnSave;
  d.saveDC = String(calcSpellSaveDC(charId));
  if(sp.areaSave){ d.areaSaveType = sp.areaSave.saveType; d.areaSaveDC = String(calcSpellSaveDC(charId)); }
  const mode = getActionMode(d);
  d.modifier = (mode === 'attack' || mode === 'rays') ? String(calcSpellAttackMod(charId)) : '';
  d.sustained = isSustainingSpell(d, sp);
  if(isSelfSpell(sp)) d.buffTargets = ['pc:'+charId];
  renderNoteForm();
}

/* Auto-fill al elegir un cantrip */
function selectCantrip(cantripName, charId){
  if(!currentForm) return;
  const d = currentForm.data;
  d.cantripName = cantripName;
  resetResolutionState(d);
  const cn = getFormSpellData(d);
  if(!cn){ renderNoteForm(); return; }
  const dice = getCantripDamageDice(cn, getCharLevel(charId), charId);
  d.damageDice = dice || '';
  d.damageType = cn.damageType || 'slashing';
  d.saveType = cn.saveType || '';
  d.halfOnSave = !!cn.halfOnSave;
  d.saveDC = String(calcSpellSaveDC(charId));
  d.modifier = getActionMode(d) === 'attack' ? String(calcSpellAttackMod(charId)) : '';
  renderNoteForm();
}

/* Rellena modificador/dado/tipo/bonus para un arma (o un ataque de la bestia, 'beast:<i>') sin re-renderizar */
function selectWeaponData(d, itemId){
  if(itemId && itemId.startsWith('beast:')){
    const p = LIVE_SESSION.combat.participants.find(x=>x.kind==='player' && x.refId===d.character);
    const a = p && p.wildShape && (p.wildShape.attacks||[])[parseInt(itemId.slice(6))];
    if(!a) return;
    d.weaponId = itemId;
    d.weapon = a.name;
    d.damageDice = diceOnly(a.dmg);
    d.damageBonus = String(parseDamageBonus(String(a.dmg||'').split(' ')[0]));
    d.damageType = normalizeDamageType(a.dmgType || String(a.dmg||'').split(' ')[1]);
    d.modifier = String(parseInt(a.bonus)||0);
    return;
  }
  const item = getItem(itemId);
  if(!item) return;
  d.weaponId = itemId;
  d.weapon = item.nameEs || item.name;
  d.damageDice = weaponDamageDice(d.character, item);
  d.damageType = item.damageType || 'slashing';
  const atkMod = calcWeaponAttackMod(d.character, item);
  if(atkMod !== '') d.modifier = String(atkMod);
  d.damageBonus = String(calcWeaponDamageBonus(d.character, item, d.actionType));
}

/* Cuando el usuario elige un arma en el form, rellena modificador/daño/tipo/bonus */
function selectWeapon(itemId){
  const d = currentForm.data;
  d.weaponPicked = true;
  d.damage = '';
  if(!itemId){ d.weaponId = ''; d.weapon = ''; d.damageBonus = ''; d.damageDice = ''; renderNoteForm(); return; }
  selectWeaponData(d, itemId);
  renderNoteForm();
}

/* Cuando el usuario elige un ataque de monstruo */
function selectMonsterAttack(attackIdx){
  const d = currentForm.data;
  const monster = PRESET_MONSTERS.find(m=>m.id === d.monsterPresetId);
  if(!monster || !monster.attacks) return;
  const atk = monster.attacks[parseInt(attackIdx)];
  if(!atk) return;
  d.selectedAttackIdx = parseInt(attackIdx);
  d.weapon = atk.name;
  // Parsear bonus "+5" → 5 (guardar como entero, no string con +)
  const parsedBonus = parseInt(atk.bonus||0);
  if(!isNaN(parsedBonus)) d.modifier = String(parsedBonus);
  // Parsear daño "1d8+3 perforante" → dado "1d8", bonus 3, tipo "piercing"
  if(atk.dmg){
    const dmgParts = atk.dmg.split(' ');
    d.damageDice = diceOnly(dmgParts[0]);
    d.damageBonus = String(parseDamageBonus(dmgParts[0]||''));
    d.damage = '';
    d.damageType = normalizeDamageType(dmgParts[1]);
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
/* Compat: el resumen del ataque se recalcula en updateFormAssistance */
function updateNpcActionAssistance(){ updateFormAssistance(); }

/* Habilidad especial / hechizo de monstruo = salvación (ej: aura que pide CON DC 11 a los cercanos) */
function isNpcSaveMode(d){ return d.actionType === 'ability' || d.actionType === 'spell'; }

/* ── REACCIONES Y DEFENSAS DEL OBJETIVO ──
   Al resolver un ataque se ofrecen las del objetivo y se aplican solas al guardar: gastan reacción,
   slot o uso por combate, cambian CA o daño y quedan en la misma nota del ataque (no se pierde el hilo).
   · Shield (PJ que lo tenga preparado): +5 CA en este ataque y hasta su próximo turno, gasta el slot más bajo libre.
   · Desviar Proyectiles (Relyo, Nv 3+): resta 1d10 + DEX + nivel a un ataque a distancia.
   · Duro (dote marcada con reaction:'duro', regla de la casa): 1 vez por combate, el primer golpe físico:
     d20 → 1 daño completo · 2–10 mitad · 11–19 nada · 20 nada + contragolpe al atacante con la mitad.
   · Furia: resistencia a daño físico.
   · Otra reacción (cualquiera, ej. Parada de un monstruo): nombre + CA extra y/o mitad de daño, a criterio del DM. */
function lowestFreeSlot(c, minLevel){
  const o = getSlotOptions(c, minLevel).find(x => x.max - x.used > 0);
  return o ? o.level : null;
}
function shieldAvailable(tp){
  if(!tp || tp.kind !== 'player') return false;
  const knows = (CLASS_PRESETS[tp.refId] && (CLASS_PRESETS[tp.refId].spellList||[]).some(s => s.name === 'Shield'));
  return !!(knows && isSpellPrepared(tp.refId, 'Shield') && !getBuffs(tp).some(b => b.sourceSpell === 'Shield'));
}
function combatKey(){ return LIVE_SESSION.combat.active ? (LIVE_SESSION.combat.startedAt || 'combate') : null; }
/* La dote con reacción automática 'duro' del PJ, si todavía no la usó en este combate */
function duroAvailable(tp){
  if(!tp || tp.kind !== 'player' || typeof getASIState !== 'function') return null;
  const feat = getASIState(tp.refId).history.find(h => h.kind === 'feat' && h.reaction === 'duro');
  if(!feat) return null;
  const key = combatKey();
  return (key && pcState(tp.refId).duroUsed === key) ? null : feat;
}
function duroActive(d, tp){ return !!(duroAvailable(tp) && PHYSICAL_DMG.includes(d.damageType) && d.duroOn !== false); }
function duroOutcome(roll){
  const r = parseInt(roll);
  if(!(r >= 1 && r <= 20)) return null;
  if(r === 1)  return { mult:1,   counter:false, short:'1 natural, daño completo', label:'1 natural: recibe el daño completo' };
  if(r <= 10)  return { mult:0.5, counter:false, short:`${r}, mitad`,             label:`${r}: recibe la mitad del daño` };
  if(r <= 19)  return { mult:0,   counter:false, short:`${r}, sin daño`,          label:`${r}: no recibe daño` };
  return { mult:0, counter:true, short:'20 natural, sin daño + contragolpe', label:'20 natural: no recibe daño y contragolpea con la mitad' };
}
function rxToggle(field, on, label){
  return `<label class="rider-toggle"><input type="checkbox" ${on?'checked':''} onchange="updateFormField('${field}', this.checked)"> ${label}</label>`;
}
function renderTargetReactions(d, tp){
  if(!tp) return '';
  const parts = [];
  const rxWarn = tp.reactionUsed ? ' <span class="form-warn">· ya usó su reacción este round</span>' : '';
  if(shieldAvailable(tp)){
    const lv = lowestFreeSlot(tp.refId, 1);
    parts.push(rxToggle('useShield', !!d.useShield, `🛡 <strong>Shield</strong> (reacción) — +5 CA en este ataque y hasta su próximo turno · gasta ${lv ? 'slot Nv ' + lv : 'un slot (no le quedan)'}${rxWarn}`));
  }
  if(tp.kind === 'player' && tp.refId === 'relyo' && d.actionType === 'attack-ranged' && getCharLevel('relyo') >= 3){
    const red = abilityMod((ABILITY_SCORES.relyo||{}).dex || 10) + getCharLevel('relyo');
    parts.push(`<div class="rider-row"><span class="rider-label">🤚 <strong>Desviar Proyectiles</strong> (reacción) — reduce 1d10 + ${red}${rxWarn}</span>
      <input type="number" class="form-input rider-input" min="1" max="10" placeholder="d10" value="${liveEscape(d.deflectRoll||'')}" oninput="updateFormField('deflectRoll', this.value)"></div>`);
  }
  const duro = duroAvailable(tp);
  if(duro && PHYSICAL_DMG.includes(d.damageType)){
    parts.push(`<div class="rider-row">${rxToggle('duroOn', d.duroOn !== false, `💪 <strong>${liveEscape(duro.feat)}</strong> (dote, 1 vez por combate) — si el golpe pega, tirá el d20`)}
      ${d.duroOn !== false ? `<input type="number" class="form-input rider-input" min="1" max="20" placeholder="d20" value="${liveEscape(d.duroRoll||'')}" oninput="updateFormField('duroRoll', this.value)">` : ''}</div>`);
  }
  if(tp.inRage) parts.push(rxToggle('applyResistance', d.applyResistance !== false, '😠 Resistencia de Furia: daño físico (B/P/S) ÷2'));
  parts.push(`<div class="rider-row">${rxToggle('rxCustom', !!d.rxCustom, `⟲ Otra reacción${tp.kind === 'monster' ? ' del monstruo' : ''}`)}
    ${d.rxCustom ? `<input class="form-input rx-name" placeholder="Nombre (ej: Parada)" value="${liveEscape(d.rxLabel||'')}" oninput="updateFormField('rxLabel', this.value)">
      <input type="number" class="form-input rider-input" placeholder="+CA" value="${liveEscape(d.rxAC||'')}" oninput="updateFormField('rxAC', this.value)">
      <label class="rx-half"><input type="checkbox" ${d.rxHalf?'checked':''} onchange="updateFormField('rxHalf', this.checked)"> mitad de daño</label>` : ''}</div>`);
  return `<div class="attack-riders reactions-block"><div class="rx-title">Reacciones y defensas de ${liveEscape(getCombatantName(tp))}</div>${parts.join('')}</div>`;
}
/* Antes de resolver el golpe: lo que cambia la CA (Shield, reacción del DM). Devuelve líneas para la nota. */
function applyPreHitReactions(d, tp){
  const lines = [];
  if(!tp) return lines;
  if(d.useShield && shieldAvailable(tp)){
    const lv = lowestFreeSlot(tp.refId, 1);
    if(lv) consumeSpellSlot(tp.refId, lv);
    addBuff(tp, { name:'Shield', sourceSpell:'Shield', casterKey: buffCasterKey(tp), acBonus:5, untilNextTurn:true, desc:'+5 CA hasta su próximo turno' });
    recordEconomy(tp, 'reaction');
    lines.push(`🛡 ${getCombatantName(tp)} lanza Shield (reacción${lv ? `, slot Nv ${lv}` : ', sin slot disponible'}): +5 CA hasta su próximo turno.`);
  }
  if(d.rxCustom){
    recordEconomy(tp, 'reaction');
    lines.push(`⟲ ${getCombatantName(tp)} reacciona: ${d.rxLabel || 'reacción'}${parseInt(d.rxAC) ? ` (+${parseInt(d.rxAC)} CA)` : ''}${d.rxHalf ? ' (mitad de daño)' : ''}.`);
  }
  return lines;
}
/* Después de saber si pegó: Desviar Proyectiles, Furia, Duro y su contragolpe al atacante. */
function applyPostHitReactions(d, tp, hit, b, attacker){
  const lines = [];
  if(!tp) return lines;
  const deflect = deflectReduction(d, tp);
  if(deflect){
    recordEconomy(tp, 'reaction');
    lines.push(`🤚 ${getCombatantName(tp)} desvía el proyectil: −${deflect} de daño${hit && b.total === 0 ? ' — lo atrapa (puede lanzarlo gastando 1 ki)' : ''}.`);
  }
  if(hit && rageResists(d, tp)) lines.push('😠 Resistencia de Furia: daño físico a la mitad.');
  if(hit && duroActive(d, tp)){
    const feat = duroAvailable(tp);
    const o = duroOutcome(d.duroRoll);
    if(o){
      pcState(tp.refId).duroUsed = combatKey() || 'fuera de combate';
      lines.push(`💪 ${feat.feat}: ${o.label}.`);
      if(o.counter && b.counter > 0 && attacker && attacker.id !== tp.id){
        changeCombatantHP(attacker.id, -b.counter);
        lines.push(`↩ Contragolpe: ${b.counter} de daño a ${getCombatantName(attacker)}.`);
      }
    }
  }
  return lines;
}

function renderNpcActionForm(){
  const d = currentForm.data;
  const monster = PRESET_MONSTERS.find(m=>m.id === d.monsterPresetId);
  const actor = getCombatant(d.combatantId);
  const saveMode = isNpcSaveMode(d);
  const attackMode = d.actionType === 'attack-melee' || d.actionType === 'attack-ranged';

  const attacksHTML = attackMode && monster && monster.attacks && monster.attacks.length > 0 ? `
      <div class="form-row">
        <label>Ataque predefinido</label>
        <select class="form-input" onchange="selectMonsterAttack(this.value)">
          <option value="">— elegir ataque —</option>
          ${monster.attacks.map((a,i)=>`<option value="${i}" ${d.selectedAttackIdx===i?'selected':''}>${liveEscape(a.name)} · ${liveEscape(a.bonus||'—')} · ${liveEscape(a.dmg||'—')}</option>`).join('')}
        </select>
      </div>` : '';

  let bodyHTML = '';
  if(attackMode){
    const tid = (d.targetIds||[])[0]||'';
    const tp = tid ? getCombatant(tid) : null;
    const displayCA = (d.targetCA !== '' && d.targetCA != null) ? d.targetCA : (tp ? String(getCombatantAC(tp)) : '');
    let warn = '';
    if(tp && tp.kind === 'player'){
      if(tp.recklessThisTurn) warn += `<div class="advantage-warning">⚔ ¡${liveEscape(getCombatantName(tp))} usó <strong>Ataque Imprudente</strong>! Este ataque tiene <strong>ventaja</strong>.<br><span class="disclaimer-box" style="display:inline-block;margin-top:0.3rem">🎲 Tirá 2d20 físicos y elegí el mayor.</span></div>`;
    }
    bodyHTML = `
      <div class="form-grid-halves">
        <div class="form-row">
          <label>Objetivo</label>
          <select class="form-input" onchange="setSingleTarget(this.value)">${targetOptionsHTML(tid, true)}</select>
        </div>
        <div class="form-row">
          <label>CA</label>
          <input type="number" class="form-input" placeholder="—" value="${liveEscape(displayCA)}" oninput="updateFormField('targetCA', this.value)">
        </div>
      </div>
      ${renderTargetConditionWarnings(tid)}
      ${warn}
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
          <label>¿Pega? (opcional)</label>
          ${renderHitOverride(d)}
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Dado de daño${d.damageDice ? ` (${liveEscape(diceOnly(d.damageDice))})` : ''}</label>
          <input type="number" class="form-input" placeholder="ej: 7" value="${liveEscape(d.damage)}" oninput="updateFormField('damage', this.value)">
        </div>
        <div class="form-row">
          <label>Bonus daño (auto)</label>
          <input type="number" class="form-input" placeholder="+0" value="${liveEscape(d.damageBonus)}" oninput="updateFormField('damageBonus', this.value)">
        </div>
        <div class="form-row">
          <label>Tipo de daño</label>
          <select class="form-input" onchange="updateFormField('damageType', this.value)">${dmgTypeOptions(d.damageType)}</select>
        </div>
      </div>
      ${renderTargetReactions(d, tp)}
      <div class="form-checkbox-row"><label><input type="checkbox" ${d.applyDamage?'checked':''} onchange="updateFormField('applyDamage', this.checked)"> Aplicar daño al objetivo</label></div>
      <div id="attack-summary" class="attack-summary">${renderAttackSummary(d)}</div>`;
  } else if(saveMode){
    bodyHTML = `
      <div class="form-grid">
        <div class="form-row">
          <label>Salvación</label>
          <select class="form-input" onchange="updateFormField('saveType', this.value)">
            ${['str','dex','con','int','wis','cha'].map(ab=>`<option value="${ab}" ${d.saveType===ab?'selected':''}>${ab.toUpperCase()}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Dado de daño (opcional)</label>
          <input class="form-input" placeholder="ej: 1d4 necrótico" value="${liveEscape(d.damageDice||'')}" oninput="updateFormField('damageDice', this.value)">
        </div>
        <div class="form-row form-checkbox-row">
          <label><input type="checkbox" ${d.halfOnSave?'checked':''} onchange="updateFormField('halfOnSave', this.checked)"> Mitad de daño si pasan</label>
        </div>
      </div>
      ${renderSaveBlock(d, { ns:'npc', playersFirst:true, halfOnSave:d.halfOnSave, showDamage:true })}`;
  }

  return `
    <div class="note-form npc-action-form">
      <div class="form-title">⚔ Acción — ${liveEscape(d.monsterName)} ${actor ? renderEconomyChips(actor) : ''}</div>
      ${actor ? renderMonsterStatBlock(actor) : ''}

      <div class="form-row">
        <label>Tipo de acción</label>
        <select class="form-input" onchange="updateFormField('actionType', this.value)">
          <option value="attack-melee" ${d.actionType==='attack-melee'?'selected':''}>Ataque cuerpo a cuerpo</option>
          <option value="attack-ranged" ${d.actionType==='attack-ranged'?'selected':''}>Ataque a distancia</option>
          <option value="ability" ${d.actionType==='ability'?'selected':''}>Habilidad especial (salvación)</option>
          <option value="spell" ${d.actionType==='spell'?'selected':''}>Hechizo / efecto mágico (salvación)</option>
          <option value="other" ${d.actionType==='other'?'selected':''}>Otra acción / narrativa</option>
        </select>
      </div>

      ${attacksHTML}
      ${bodyHTML}

      <div class="form-row">
        <label>Notas / descripción</label>
        <textarea class="form-input form-textarea" placeholder="Qué hace el monstruo, cómo lo hace..." oninput="updateFormField('notes', this.value)">${liveEscape(d.notes)}</textarea>
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        ${attackMode ? `<button class="btn-secondary" onclick="saveNpcActionNote(true)" title="Guarda y deja el form listo para el siguiente ataque (Multiattack)">Guardar + otro ataque</button>` : ''}
        <button class="btn-primary" onclick="saveNpcActionNote()">Guardar acción</button>
      </div>
    </div>
  `;
}

/* Agrega un buff a un combatiente (reemplaza uno anterior del mismo hechizo) */
function addBuff(p, buff){
  const s = stateOf(p);
  s.buffs = getBuffs(p).filter(b => b.sourceSpell !== buff.sourceSpell);
  s.buffs.push(buff);
}

function saveNpcActionNote(repeat){
  const d = currentForm.data;
  const actor = getCombatant(d.combatantId);
  let targetResults = [];
  let outcomeGlobal = null;
  const reactions = [];
  const attackMode = d.actionType === 'attack-melee' || d.actionType === 'attack-ranged';

  if(isNpcSaveMode(d)){
    targetResults = resolveSaveTargets(d, 'npc', d.damage, d.halfOnSave);
  } else if(attackMode){
    const tid = (d.targetIds||[])[0];
    const tp = tid ? getCombatant(tid) : null;
    // Reacciones del objetivo: primero las que cambian la CA (Shield), después las del daño (Desviar, Furia, Duro)
    reactions.push(...applyPreHitReactions(d, tp));
    const ac = getAttackCA(d);
    const out = attackOutcome(d.roll, d.modifier, ac, d.hitOverride);
    const b = attackDamageBreakdown(d);
    reactions.push(...applyPostHitReactions(d, tp, isHitOutcome(out), b, actor));
    if(tp){
      const hpBefore = getCombatantHP(tp);
      const dmgApplied = !!(d.applyDamage && b.total > 0 && isHitOutcome(out));
      // Golpe a 5 ft contra alguien inconsciente = crítico (2 fallos de death save)
      if(dmgApplied) changeCombatantHP(tid, -b.total, { crit: out === 'nat20' || (isDying(tp) && d.actionType === 'attack-melee') });
      targetResults = [{ id: tid, name: getCombatantName(tp), threshold: ac, outcome: out, hpBefore, hpAfter: getCombatantHP(tp), dmgApplied, damage: b.total }];
    } else {
      if(isNat20(d.roll)) outcomeGlobal = 'nat20';
      else if(isNat1(d.roll)) outcomeGlobal = 'nat1';
    }
  }

  const total = (parseInt(d.roll)||0) + (parseInt(d.modifier)||0);
  pushNote({
    type: 'npc-action',
    monsterName: d.monsterName,
    combatantId: d.combatantId,
    actionType: d.actionType,
    weapon: d.weapon,
    roll: attackMode ? d.roll : '',
    modifier: d.modifier,
    total: attackMode && d.roll !== '' ? total : null,
    targetResults,
    outcome: outcomeGlobal,
    damageDice: d.damageDice,
    damage: isNpcSaveMode(d) ? (parseInt(d.damage)||0) : (targetResults[0] ? targetResults[0].damage : 0),
    damageType: d.damageType,
    reactions,
    notes: d.notes
  });
  recordEconomy(actor, attackMode ? 'attack' : isNpcSaveMode(d) ? 'action' : 'none');

  if(repeat && attackMode){
    // Multiattack: mismo monstruo, ataque y objetivo; se limpian tiradas y reacciones
    Object.assign(d, { roll:'', damage:'', hitOverride:'', targetCA:'', notes:'',
      useShield:false, deflectRoll:'', duroOn:undefined, duroRoll:'', rxCustom:false, rxLabel:'', rxAC:'', rxHalf:false });
    saveLiveSession();
    renderLive();
    return;
  }
  closeNoteForm();
  saveLiveSession();
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
function saveActionNote(repeat){
  const d = currentForm.data;

  // Delegar a saveClassAbilityNote cuando el tipo de acción es habilidad de clase
  if(d.actionType === 'class-ability'){
    saveClassAbilityNote();
    return;
  }

  const c = d.character;
  const mode = getActionMode(d);
  const sp = getFormSpellData(d);
  const caster = getCombatant('pc:'+c);
  const inTracker = LIVE_SESSION.combat.participants.includes(caster);
  const sustained = !!(sp && d.sustained && isSustainingSpell(d, sp));
  const extra = [];

  // Side effect 1: slot del hechizo (no para cantrips ni para un efecto sostenido)
  if(d.actionType === 'spell' && sp && !sustained){
    const lv = parseInt(d.spellLevel) || sp.level;
    const ok = consumeSpellSlot(c, lv);
    if(!ok && !confirm(`No quedan slots de nivel ${lv}. ¿Guardar la nota igual?`)) return;
  }
  // Side effect 2: concentración al lanzar (rompe la anterior). Sostener no la renueva.
  if(sp && spellIsConcentration(sp) && !sustained){
    applyConcentration(caster.id, sp.name, spellDurationRounds(sp));
  }

  let targetResults = [];
  let outcomeGlobal = null;
  let riders = [];
  const reactions = [];
  const casterKey = buffCasterKey(caster);

  if(mode === 'attack'){
    const tid = (d.targetIds||[])[0];
    const tp = tid ? getCombatant(tid) : null;
    reactions.push(...applyPreHitReactions(d, tp));
    const ac = getAttackCA(d);
    const out = attackOutcome(d.roll, d.modifier, ac, d.hitOverride);
    const hit = isHitOutcome(out);
    const b = attackDamageBreakdown(d);
    riders = b.riders;
    reactions.push(...applyPostHitReactions(d, tp, hit, b, caster));
    // Castigo Divino: el slot se gasta solo si pega
    if(hit && d.divineSmite && c === 'tyrell' && isWeaponAttack(d)){
      const lv = parseInt(d.divineSmiteSlot) || 1;
      if(!consumeSpellSlot('tyrell', lv)) extra.push(`⚠ Castigo Divino sin slot de Nv ${lv} disponible (aplicado igual).`);
    }
    // Smite cargado: se consume al pegar; su salvación puede dejar una condición
    const ps = pcState(c);
    if(hit && isWeaponAttack(d) && ps.pendingSmite){
      const sm = ps.pendingSmite;
      ps.pendingSmite = null;
      if(sm.saveType && tp && d.pendingSmiteSaveRoll !== '' && d.pendingSmiteSaveRoll != null){
        const total = (parseInt(d.pendingSmiteSaveRoll)||0) + (getCombatantSaveMod(tp, sm.saveType)||0);
        const failed = total < sm.dc;
        const cond = sm.condition ? getCondition(sm.condition) : null;
        extra.push(`${sm.spell}: ${sm.saveType.toUpperCase()} save ${total} vs DC ${sm.dc} → ${failed?'FALLA':'PASA'}${failed && cond ? ` — queda ${cond.nameEs||cond.name}` : ''}.`);
        if(failed && sm.condition) applyCondition(tid, sm.condition, sm.duration || 10, sm.spell, casterKey);
      } else if(sm.saveType){
        extra.push(`${sm.spell}: el objetivo tiene que tirar ${sm.saveType.toUpperCase()} save DC ${sm.dc}.`);
      }
    }
    if(tp){
      const hpBefore = getCombatantHP(tp);
      const dmgApplied = !!(d.applyDamage && hit && b.total > 0);
      if(dmgApplied) changeCombatantHP(tid, -b.total, { crit: out === 'nat20' });
      targetResults = [{ id: tid, name: getCombatantName(tp), threshold: ac, outcome: out, hpBefore, hpAfter: getCombatantHP(tp), dmgApplied, damage: b.total }];
    } else {
      if(isNat20(d.roll)) outcomeGlobal = 'nat20';
      else if(isNat1(d.roll)) outcomeGlobal = 'nat1';
    }
    // Ice Knife: la explosión pega o falle el ataque
    if(sp && sp.areaSave){
      targetResults = targetResults.concat(resolveSaveTargets(d, 'area', d.areaDamage, false).map(r => Object.assign(r, { label:'explosión' })));
    }
    // Ataque Imprudente de Rac
    if(c === 'rac' && d.recklessAttack){
      const racC = LIVE_SESSION.combat.participants.find(p=>p.kind==='player'&&p.refId==='rac');
      if(racC) racC.recklessThisTurn = true;
    }
  }
  else if(mode === 'save'){
    targetResults = resolveSaveTargets(d, '', d.damage, d.halfOnSave);
    const eff = sp && sp.effect;
    if(eff && eff.targetConditionOnFail){
      targetResults.filter(r => r.outcome === 'fail').forEach(r =>
        applyCondition(r.id, eff.targetConditionOnFail, eff.duration || spellDurationRounds(sp), sp.name, casterKey));
    }
  }
  else if(mode === 'heal'){
    targetResults = (d.targetIds||[]).map(tid => {
      const p = getCombatant(tid); if(!p) return null;
      const hpBefore = getCombatantHP(p);
      if(d.applyDamage && d.damage) changeCombatantHP(tid, +(parseInt(d.damage)||0));
      return { id: tid, name: getCombatantName(p), outcome: 'heal', hpBefore, hpAfter: getCombatantHP(p), dmgApplied: d.applyDamage && !!d.damage };
    }).filter(Boolean);
  }
  else if(mode === 'smite'){
    pcState(c).pendingSmite = {
      spell: sp.name, damage: sp.damage, damageType: sp.damageType,
      saveType: sp.saveType || null, dc: calcSpellSaveDC(c),
      condition: (sp.effect && sp.effect.targetConditionOnFail) || null,
      duration: (sp.effect && sp.effect.duration) || 10
    };
    extra.push(`⚔ ${sp.name} cargado: el próximo golpe con arma suma +${sp.damage} ${sp.damageType}.`);
  }
  else if(mode === 'missiles'){
    const per = missileDamagePerDart(d, sp);
    targetResults = Object.entries(d.darts||{}).filter(([, n]) => n > 0).map(([tid, n]) => {
      const p = getCombatant(tid); if(!p) return null;
      const hpBefore = getCombatantHP(p);
      const dmg = per != null ? n * per : 0;
      if(d.applyDamage && dmg > 0) changeCombatantHP(tid, -dmg);
      return { id: tid, name: getCombatantName(p), outcome: 'hit', hpBefore, hpAfter: getCombatantHP(p), dmgApplied: d.applyDamage && dmg > 0, damage: dmg, label: `${n} dardo${n>1?'s':''}` };
    }).filter(Boolean);
  }
  else if(mode === 'rays'){
    targetResults = (d.rays||[]).map((r, i) => {
      const p = getCombatant(r.targetId); if(!p) return null;
      const out = rayOutcome(d, r);
      const hpBefore = getCombatantHP(p);
      const dmg = isHitOutcome(out) ? (parseInt(r.damage)||0) : 0;
      if(d.applyDamage && dmg > 0) changeCombatantHP(r.targetId, -dmg, { crit: out === 'nat20' });
      return { id: r.targetId, name: getCombatantName(p), threshold: getCombatantAC(p), outcome: out, hpBefore, hpAfter: getCombatantHP(p), dmgApplied: d.applyDamage && dmg > 0, damage: dmg, label: `rayo ${i+1}` };
    }).filter(Boolean);
  }
  else if(mode === 'sleep'){
    const r = computeSleep(d);
    (r ? r.res : []).forEach(x => { if(x.asleep) applyCondition(x.p.id, 'unconscious', 10, 'Sleep', casterKey); });
    targetResults = (r ? r.res : []).map(x => ({ id: x.p.id, name: getCombatantName(x.p), outcome: x.asleep ? 'fail' : 'pass', hpBefore: x.hp, hpAfter: x.hp, label: x.asleep ? '💤 duerme' : 'despierto' }));
    if(r) extra.push(`💤 Pool de Sueño: ${d.sleepRoll} HP (sobran ${r.left}).`);
  }
  else if(mode === 'auto'){
    const dmg = parseInt(d.damage) || 0;
    targetResults = (d.autoTargets||[]).map(tid => {
      const p = getCombatant(tid); if(!p) return null;
      const hpBefore = getCombatantHP(p);
      if(d.applyDamage && dmg > 0) changeCombatantHP(tid, -dmg);
      return { id: tid, name: getCombatantName(p), outcome: 'hit', hpBefore, hpAfter: getCombatantHP(p), dmgApplied: d.applyDamage && dmg > 0, damage: dmg };
    }).filter(Boolean);
  }
  else if(mode === 'buff'){
    const targets = isSelfSpell(sp) ? [caster] : (d.buffTargets||[]).map(getCombatant).filter(Boolean);
    const conc = spellIsConcentration(sp);
    const bf = sp.buff || {};
    const up = upcastLevels(d, sp);
    const spellMod = Math.max(0, abilityMod(((ABILITY_SCORES[c]||{})[SPELLCASTING_STAT[c]]) || 10));
    targets.forEach(t => {
      const tempHP = bf.tempHP ? bf.tempHP + (bf.tempHPPerLevel||0) * up : 0;
      if(tempHP > getTempHP(t)) setTempHP(t, tempHP);
      addBuff(t, {
        name: sp.nameEs || sp.name, sourceSpell: sp.name, casterKey, desc: sp.buffDesc || '',
        acBonus: bf.acBonus || 0, acMin: bf.acMin || 0, rollBonus: bf.rollBonus || null,
        weaponAtkBonus: bf.weaponAtkBonus || 0, weaponDmgBonus: bf.weaponDmgBonus || 0,
        weaponRider: sp.weaponRider || null,
        tempHPEachTurn: bf.tempHPEachTurn ? spellMod : 0,
        untilNextTurn: !!bf.untilNextTurn,
        turnsLeft: (conc || bf.untilNextTurn) ? null : spellDurationRounds(sp)
      });
    });
    targetResults = targets.map(t => ({ id: t.id, name: getCombatantName(t), outcome: 'buff', hpBefore: getCombatantHP(t), hpAfter: getCombatantHP(t) }));
  }

  const total = (parseInt(d.roll)||0) + (parseInt(d.modifier)||0);
  const usesRoll = mode === 'attack' || mode === 'roll';
  pushNote({
    type:'action',
    character: c,
    actionType: d.actionType,
    weapon: isWeaponAttack(d) ? d.weapon : '',
    skill: d.skill,
    save: d.save,
    spellName: d.spellName,
    spellLevel: d.actionType === 'spell' && sp ? (parseInt(d.spellLevel) || sp.level) : d.spellLevel,
    cantripName: d.cantripName,
    sustained,
    roll: usesRoll ? d.roll : '',
    modifier: d.modifier,
    total: usesRoll && d.roll !== '' ? total : null,
    targetResults,
    outcome: outcomeGlobal,
    thresholdKind: mode === 'attack' ? 'ca' : 'dc',
    isSaveSpell: mode === 'save',
    saveType: d.saveType, saveDC: parseInt(d.saveDC) || null, halfOnSave: d.halfOnSave,
    damage: mode === 'heal' ? (parseInt(d.damage)||0) : mode === 'attack' ? attackDamageBreakdown(d).total : (parseInt(d.damage)||0),
    damageType: mode === 'heal' ? 'healing' : d.damageType,
    damageDice: d.damageDice,
    riders,
    reactions,
    notes: [...extra, d.notes].filter(Boolean).join('\n')
  });

  // No termina el turno: registra qué gastó (ataque / acción / bonus / reacción). Saves y checks no gastan nada.
  const kind = isWeaponAttack(d) ? 'attack'
    : (d.actionType === 'spell' || d.actionType === 'cantrip') ? (sustained ? sustainedCastingTime(sp) : getSpellCastingTime(sp))
    : 'none';
  if(inTracker) recordEconomy(caster, kind);

  if(repeat && mode === 'attack'){
    // Ataque Extra / segundo ataque: mismo personaje, arma y objetivo; se limpian las tiradas
    Object.assign(d, { roll:'', damage:'', hitOverride:'', targetCA:'', divineSmite:false, divineSmiteDmg:'', pendingSmiteDmg:'', pendingSmiteSaveRoll:'',
      areaTargetIds:[], areaSaveRolls:{}, areaSaveOverrides:{}, areaDamage:'', notes:'',
      useShield:false, deflectRoll:'', duroOn:undefined, duroRoll:'', rxCustom:false, rxLabel:'', rxAC:'', rxHalf:false });
    d.sustained = isSustainingSpell(d, sp);
    saveLiveSession();
    renderLive();
    return;
  }
  closeNoteForm();
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
  const presentChars = LIVE_SESSION.meta.presentChars || CHARS;
  const defaultLooter = presentChars[0] || CHARS[0];
  currentForm = {
    type:'loot',
    data:{
      combatId,
      monsterPresetId: preset.id,
      monsterName: getCombatantName(p),
      looter: defaultLooter,
      numRolls: 1,
      rolls: [{ value:'', drops:[] }],
      assignments: {}   // key `${rollIdx}_${itemIdx}` → charId
    }
  };
  renderNoteForm();
  setTimeout(()=>{
    const el = document.getElementById('note-form-container');
    if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }, 50);
}

/* Devuelve true si el patrón de qty requiere tirada (ej: '1d4', '2d6 pies') */
function _lootQtyIsDice(qty){
  return /^\d+d\d+/.test(String(qty||'1').trim());
}

/* Formatea el label de un drop para inventario */
function _lootDropLabel(itemName, qtyVal, monsterName){
  return `${itemName} ×${qtyVal} (loot de ${monsterName})`;
}

function renderLootForm(){
  const d = currentForm.data;
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  if(!preset) return '<div class="note-form"><div class="form-title">Error: monstruo no encontrado.</div></div>';

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
    </table>`;

  const looterName = d.looter ? d.looter.charAt(0).toUpperCase()+d.looter.slice(1) : '—';

  return `
    <div class="note-form loot-form">
      <div class="form-title">🎲 Loot — ${liveEscape(d.monsterName)}</div>
      <p class="muted" style="font-size:0.82rem;margin-bottom:0.6rem">Tirá el d20 físico e ingresá el resultado. Para cantidades con dados (ej: 1d4), también ingresá el resultado de esa tirada.</p>

      ${lootTableHTML}

      <div class="form-grid loot-config-grid" style="margin-top:0.9rem">
        <div class="form-row">
          <label>Looter</label>
          <select class="form-input" onchange="updateLootLooter(this.value)">
            ${CHARS.map(c=>`<option value="${c}" ${d.looter===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label>Cantidad de tiradas</label>
          <input type="number" min="1" max="10" class="form-input" style="width:80px"
            value="${d.numRolls}" oninput="updateLootNumRolls(parseInt(this.value)||1)">
        </div>
      </div>

      <div id="loot-rolls-section" class="loot-rolls-section">
        ${d.rolls.map((r,i)=>renderLootRollRow(i,r,preset)).join('')}
      </div>

      <div class="form-btns">
        <button class="btn-cancel" onclick="closeNoteForm()">Cancelar</button>
        <button class="btn-primary" id="loot-assign-all-btn" onclick="assignAllLootToLooter()">✓ Asignar todo a ${looterName}</button>
        <button class="btn-secondary" onclick="saveLootNote()">Guardar en stream</button>
      </div>
    </div>`;
}

function renderLootRollRow(rollIdx, r, preset){
  const d = currentForm.data;
  const roll = parseInt(r.value);
  const isNat1 = roll === 1;
  const isNat20 = roll === 20;
  const hasRoll = !isNaN(roll) && roll >= 1 && roll <= 20;

  let dropsHTML = '';
  if(hasRoll && !isNat1){
    if(r.drops.length === 0){
      dropsHTML = `<div class="loot-empty" style="font-size:0.82rem;padding:0.4rem 0">No cae nada con esta tirada.</div>`;
    } else {
      dropsHTML = r.drops.map(drop=>{
        const assignKey = `${rollIdx}_${drop.idx}`;
        const assignedTo = d.assignments[assignKey];
        const isDice = _lootQtyIsDice(drop.item.qty);
        const qtyDisplay = isDice
          ? `<span class="loot-qty-label">${liveEscape(drop.item.qty)}</span> = <input type="number" min="0" class="loot-qty-input" value="${drop.qtyVal!==''?drop.qtyVal:''}" placeholder="?" oninput="updateLootQtyValue(${rollIdx},${drop.idx},this.value)" style="width:60px">`
          : `<span class="loot-qty-label">${liveEscape(drop.item.qty||'1')}</span>`;
        return `<div class="loot-drop ${assignedTo?'loot-drop-assigned':''}">
          <span class="loot-drop-name">✓ ${liveEscape(drop.item.name)}</span>
          <span class="loot-drop-qty">${qtyDisplay}</span>
          ${assignedTo
            ? `<span class="loot-drop-who">→ ${assignedTo.charAt(0).toUpperCase()+assignedTo.slice(1)} ✓</span>`
            : `<select class="loot-indiv-sel" id="loot-sel-${rollIdx}-${drop.idx}">
                ${CHARS.map(c=>`<option value="${c}" ${d.looter===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
               </select>
               <button class="btn-small" onclick="assignSingleLoot(${rollIdx},${drop.idx})">+ Asignar</button>`}
        </div>`;
      }).join('');
    }
  } else if(isNat1){
    dropsHTML = `<div class="loot-nat loot-nat1" style="font-size:0.82rem;margin:0.3rem 0">✗ NAT 1 — Pifia. No se salva nada.</div>`;
  }

  return `<div class="loot-roll-row">
    <div class="loot-roll-header">
      <label class="loot-roll-label">Tirada ${rollIdx+1}</label>
      <input type="number" min="1" max="20" class="form-input loot-roll-input"
        value="${liveEscape(r.value)}" placeholder="d20"
        oninput="updateLootRollValue(${rollIdx},this.value)">
      ${hasRoll ? `<span class="loot-roll-badge ${isNat1?'loot-nat1':''} ${isNat20?'loot-nat20':''}">${isNat1?'NAT 1':isNat20?'★ NAT 20':roll}</span>` : ''}
    </div>
    ${dropsHTML ? `<div class="loot-roll-drops">${dropsHTML}</div>` : ''}
  </div>`;
}

function updateLootLooter(charId){
  if(!currentForm || currentForm.type !== 'loot') return;
  currentForm.data.looter = charId;
  const btn = document.getElementById('loot-assign-all-btn');
  if(btn) btn.textContent = `✓ Asignar todo a ${charId.charAt(0).toUpperCase()+charId.slice(1)}`;
  // Actualizar selects individuales para pre-seleccionar el nuevo looter
  const preset = MONSTERS.find(x => x.id === currentForm.data.monsterPresetId);
  const section = document.getElementById('loot-rolls-section');
  if(section && preset){
    section.innerHTML = currentForm.data.rolls.map((r,i)=>renderLootRollRow(i,r,preset)).join('');
  }
}

function updateLootNumRolls(n){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  n = Math.max(1, Math.min(10, n||1));
  d.numRolls = n;
  while(d.rolls.length < n) d.rolls.push({ value:'', drops:[] });
  d.rolls = d.rolls.slice(0, n);
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  const section = document.getElementById('loot-rolls-section');
  if(section && preset) section.innerHTML = d.rolls.map((r,i)=>renderLootRollRow(i,r,preset)).join('');
}

function updateLootRollValue(rollIdx, value){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const r = d.rolls[rollIdx];
  if(!r) return;
  r.value = value;
  const roll = parseInt(value);
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  if(!preset) return;
  if(!isNaN(roll) && roll >= 2 && roll <= 20){
    const newDrops = [];
    preset.loot.forEach((it, idx)=>{
      const isNat20Item = it.minRoll >= 20;
      const isGuaranteed = it.minRoll === 0;
      let passes;
      if(isGuaranteed) passes = true;
      else if(isNat20Item) passes = (roll === 20);
      else passes = (roll >= it.minRoll);
      if(passes){
        const prev = r.drops.find(x => x.idx === idx);
        const isDice = _lootQtyIsDice(it.qty);
        const qtyVal = prev ? prev.qtyVal : (isDice ? '' : (it.qty || '1'));
        newDrops.push({ idx, item: it, qtyVal, qtyIsDice: isDice });
      }
    });
    r.drops = newDrops;
  } else {
    r.drops = [];
  }
  const section = document.getElementById('loot-rolls-section');
  if(section && preset) section.innerHTML = d.rolls.map((ro,i)=>renderLootRollRow(i,ro,preset)).join('');
}

function updateLootQtyValue(rollIdx, itemIdx, value){
  if(!currentForm || currentForm.type !== 'loot') return;
  const r = currentForm.data.rolls[rollIdx];
  if(!r) return;
  const drop = r.drops.find(x => x.idx === itemIdx);
  if(drop) drop.qtyVal = value;
}

function assignSingleLoot(rollIdx, itemIdx){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const r = d.rolls[rollIdx];
  if(!r) return;
  const drop = r.drops.find(x => x.idx === itemIdx);
  if(!drop) return;
  const sel = document.getElementById(`loot-sel-${rollIdx}-${itemIdx}`);
  const dest = sel ? sel.value : d.looter;
  const qtyDisplay = drop.qtyIsDice ? (drop.qtyVal || '?') : (drop.item.qty || '1');
  const label = _lootDropLabel(drop.item.name, qtyDisplay, d.monsterName);
  const list = _getInventory(dest);
  list.push(label);
  _setInventory(dest, list);
  renderInventory(dest);
  d.assignments[`${rollIdx}_${itemIdx}`] = dest;
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  const section = document.getElementById('loot-rolls-section');
  if(section && preset) section.innerHTML = d.rolls.map((ro,i)=>renderLootRollRow(i,ro,preset)).join('');
}

function assignAllLootToLooter(){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const dest = d.looter;
  let assigned = 0;
  d.rolls.forEach((r, rollIdx)=>{
    r.drops.forEach(drop=>{
      const key = `${rollIdx}_${drop.idx}`;
      if(d.assignments[key]) return;
      const qtyDisplay = drop.qtyIsDice ? (drop.qtyVal || '?') : (drop.item.qty || '1');
      const label = _lootDropLabel(drop.item.name, qtyDisplay, d.monsterName);
      const list = _getInventory(dest);
      list.push(label);
      _setInventory(dest, list);
      renderInventory(dest);
      d.assignments[key] = dest;
      assigned++;
    });
  });
  if(assigned === 0) return;
  const preset = MONSTERS.find(x => x.id === d.monsterPresetId);
  const section = document.getElementById('loot-rolls-section');
  if(section && preset) section.innerHTML = d.rolls.map((r,i)=>renderLootRollRow(i,r,preset)).join('');
}

function saveLootNote(){
  if(!currentForm || currentForm.type !== 'loot') return;
  const d = currentForm.data;
  const rollLines = d.rolls.map((r, i)=>{
    const roll = parseInt(r.value);
    if(isNaN(roll)) return `Tirada ${i+1}: sin registrar`;
    if(roll === 1) return `Tirada ${i+1}: NAT 1 — pifia`;
    if(r.drops.length === 0) return `Tirada ${i+1}: ${roll} — nada`;
    const items = r.drops.map(drop=>{
      const who = d.assignments[`${i}_${drop.idx}`];
      const qty = drop.qtyIsDice ? (drop.qtyVal||'?') : (drop.item.qty||'1');
      return `  • ${drop.item.name} ×${qty}${who?` → ${who.charAt(0).toUpperCase()+who.slice(1)}`:''}`;
    }).join('\n');
    return `Tirada ${i+1}: ${roll}${roll===20?' ★ NAT 20':''}\n${items}`;
  }).join('\n');

  pushNote({
    type:'combat',
    subtype:'loot',
    notes:`Loot de ${d.monsterName} (looter: ${d.looter})\n${rollLines}`
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
      <input type="number" min="1" value="${liveEscape(m.number)}" oninput="onSessionNumberInput(this.value)">
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
    <div id="live-archived-warning" class="dm-only" style="display:contents"></div>
    <button class="btn-finalize dm-only" onclick="finalizeSession()">Finalizar sesión ↗</button>
    <button class="btn-reset-session dm-only" onclick="resetLiveSession()" title="Borrar todas las notas y el combate, empezar de cero">↺ Resetear</button>

    <div class="live-group-actions dm-only">
      <div class="live-group-actions-label">Acciones del grupo:</div>
      <button class="btn-group-action" onclick="groupShortRest()" title="Short rest para todos los personajes">☾ Short rest grupal</button>
      <button class="btn-group-action" onclick="groupLongRest()" title="Long rest para todos los personajes">☽ Long rest grupal</button>
      <button class="btn-group-action btn-group-levelup" onclick="groupLevelUp()" title="Subir de nivel a todos los personajes">▲ Subir nivel grupal</button>
    </div>
  `;

  renderPresentsGrid();
  renderArchivedWarning();
}

/* ── AVISO: el número del header ya está archivado ──
   Evita jugar la #9 con el header en #8 y pisar el archivo de la #8 al finalizar. */
let LIVE_ARCHIVED_INFO = null;   // sesión archivada con el número del header (o null)
let _archivedCheckTimer = null;

async function fetchArchivedSession(n){
  try{
    const r = await fetch(`/api/sessions/${n}`);
    return r.ok ? await r.json() : null;
  } catch(e){ return null; }
}

function archivedSessionLabel(s){
  // timeZone UTC: las fechas se guardan como medianoche UTC — en es-AR mostrarían el día anterior
  const date = s.date ? new Date(s.date).toLocaleDateString('es-AR', { timeZone:'UTC' }) : 'sin fecha';
  return `${date} · ${(s.notes||[]).length} notas`;
}

async function checkArchivedSessionNumber(){
  if(!window.DM_MODE) return;
  const n = Number(LIVE_SESSION.meta.number) || 0;
  const info = await fetchArchivedSession(n);
  if((Number(LIVE_SESSION.meta.number) || 0) !== n) return; // el número cambió mientras tanto
  LIVE_ARCHIVED_INFO = info;
  renderArchivedWarning();
}

function onSessionNumberInput(value){
  updateLiveMeta('number', parseInt(value)||1);
  renderArchivedWarning();
  clearTimeout(_archivedCheckTimer);
  _archivedCheckTimer = setTimeout(checkArchivedSessionNumber, 400);
}

function renderArchivedWarning(){
  const el = document.getElementById('live-archived-warning');
  if(!el) return;
  const n = Number(LIVE_SESSION.meta.number) || 0;
  // archivedNumber: este mismo LIVE_SESSION ya la archivó en un Finalizar que falló a medias → no es un error
  const show = LIVE_ARCHIVED_INFO && LIVE_ARCHIVED_INFO.number === n && LIVE_SESSION.meta.archivedNumber !== n;
  el.innerHTML = show ? `<div class="live-archived-warning">
      <span>⚠ La Sesión #${n} ya está archivada (${liveEscape(archivedSessionLabel(LIVE_ARCHIVED_INFO))}). Si esta es una sesión nueva, cambiá el número — finalizar con #${n} sobrescribe ese archivo.</span>
      <button class="btn-small" onclick="useNextSessionNumber()">Usar #${n+1}</button>
    </div>` : '';
}

function useNextSessionNumber(){
  updateLiveMeta('number', (Number(LIVE_SESSION.meta.number) || 0) + 1);
  renderLiveHeader();
  checkArchivedSessionNumber();
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
    // Slots: todos los niveles que tiene según su nivel de personaje (el preset solo trae los de Nv 1)
    Object.keys(getSpellSlotsForLevel(c)).forEach(level=>save('slots_'+c+'_'+level, 0));
    // Estado de combate que no sobrevive a un descanso largo (los muertos siguen muertos)
    const ps = pcState(c);
    ps.tempHP = 0; ps.buffs = []; ps.pendingSmite = null; ps.concentration = null;
    if(ps.death && !ps.death.dead) ps.death = null;
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

  const label = c => c.charAt(0).toUpperCase()+c.slice(1);
  const summary = targets.map(x => `• ${label(x.c)}: Nv ${x.lvl} → Nv ${x.lvl+1}${ASI_LEVELS.includes(x.lvl+1) ? ' (⬆ mejora de característica)' : ''}`).join('\n');
  const skipped = maxed.length ? `\n\nSe saltean (ya están a Nv 20):\n${maxed.map(x=>`• ${label(x.c)}`).join('\n')}` : '';
  if(!confirm(`¿Subir de nivel a TODOS los personajes?\n\n${summary}${skipped}\n\nHP máximo sube con el promedio del hit die + CON mod. Proficiency bonus se recalcula automáticamente.`)) return;

  // Mismo camino que el botón de la hoja (applyLevelUp en abilities.js)
  const results = targets.map(x => Object.assign({ c: x.c }, applyLevelUp(x.c)));
  const newLevels = results.map(r => `${label(r.c)} → Nv ${r.newLevel} (HP máx ${r.newMax})` +
    (r.spellLevelAfter > r.spellLevelBefore ? ` · ✨ hechizos de Nv ${r.spellLevelAfter}` : '') +
    (r.prepAfter != null && r.prepAfter > r.prepBefore ? ` · prepara ${r.prepAfter} (antes ${r.prepBefore})` : ''));
  const withASI = results.filter(r => r.asi).map(r => label(r.c));
  const asiLine = withASI.length ? `\n\n⬆ Mejora de característica pendiente: ${withASI.join(', ')} — +2 a uno, +1 a dos o una dote. Se elige en cada hoja, debajo de los atributos.` : '';

  pushNote({
    type:'combat', subtype:'other',
    notes:`▲ Subida de nivel grupal\n${newLevels.map(s=>'• '+s).join('\n')}${asiLine}\n\nRevisar features narrativos pendientes (subclases, channel divinity, etc.) en las hojas.`
  });
  renderNotesStream();
  renderPresentsGrid();
  alert(`✓ Grupo subido de nivel.\n\n${newLevels.join('\n')}${asiLine}\n\nRevisá las hojas de personaje para features pendientes (subclases, cantrip damage, etc.).`);
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
    const title = (meta ? meta.desc + ' — ' : '') + 'click para quitar';
    return `<span class="cond-chip" style="--cond-color:${color}" title="${liveEscape(title)}"
      onclick="removeCondition('${liveEscape(p.id)}','${id}')">${liveEscape(label)}</span>`;
  }).join('');

  // Badge de concentración (PJ fuera del tracker la guardan en pcState)
  const conc = p.concentration;
  const concBadge = conc ? `<span class="cond-chip cond-concentration"
    title="${liveEscape('Concentración en ' + conc.spellName)}"
    onclick="if(confirm('¿Romper concentración en ${liveEscape(conc.spellName)}?')) breakConcentration('${liveEscape(p.id)}')">
    ◎ ${liveEscape(conc.spellName)} (${conc.turnsLeft}r)
  </span>` : '';

  // Buffs (Bendición, Escudo de Fe, Shield…): click para quitar
  const buffChips = getBuffs(p).map(b => `<span class="cond-chip buff-chip" title="${liveEscape((b.desc||b.name)+' — click para quitar')}"
    onclick="removeBuff('${liveEscape(p.id)}','${liveEscape(b.sourceSpell)}')">✨ ${liveEscape(b.name)}${b.acBonus?` +${b.acBonus} CA`:''}${b.acMin?` CA mín ${b.acMin}`:''}${b.turnsLeft!=null && b.turnsLeft < 600 ? ` (${b.turnsLeft}r)` : ''}${b.untilNextTurn?' (hasta su turno)':''}</span>`).join('');
  const temp = getTempHP(p);
  const tempChip = temp ? `<span class="cond-chip temp-chip" title="HP temporales: absorben daño primero. 't0' en el input rápido los quita.">🛡 +${temp} HP temp</span>` : '';
  const dodgeChip = p.dodging ? `<span class="cond-chip" title="Dodge: ataques contra él con desventaja hasta su próximo turno — click para quitar" onclick="clearDodge('${liveEscape(p.id)}')">🛡 Esquivando</span>` : '';
  const downChip = isDying(p) ? `<span class="cond-chip cond-down" title="Inconsciente: ataques con ventaja; a 5 ft todo golpe es crítico">💤 Inconsciente</span>` : '';
  const smite = p.kind === 'player' ? pcState(p.refId).pendingSmite : null;
  const smiteChip = smite ? `<span class="cond-chip buff-chip" title="Se suma al próximo golpe con arma">⚔ ${liveEscape(smite.spell)} cargado</span>` : '';

  // Input manual de condiciones (monstruos y PJ)
  const manualInput = `
    <input class="combatant-cond-input dm-only" placeholder="+ condición (coma)"
      onchange="setCombatantCondition('${liveEscape(p.id)}', this.value); this.value=''">`;

  return `<div class="combatant-conditions">${downChip}${concBadge}${smiteChip}${buffChips}${tempChip}${dodgeChip}${chips}${manualInput}</div>`;
}

function removeBuff(combatantId, sourceSpell){
  const p = getCombatant(combatantId); if(!p) return;
  stateOf(p).buffs = getBuffs(p).filter(b => b.sourceSpell !== sourceSpell);
  saveLiveSession();
  renderCombatTracker();
}
function clearDodge(combatantId){
  const p = getCombatant(combatantId); if(!p) return;
  p.dodging = false;
  saveLiveSession();
  renderCombatTracker();
}

/* Death saves de un PJ caído: pips + d20 / Estabilizar (los controles son del DM) */
function renderDeathSaves(p){
  if(p.kind !== 'player') return '';
  const d = getDeath(p);
  if(d && d.dead) return `<div class="death-saves dead">💀 Muerto (3 fallos)${''}</div>`;
  if(getCombatantHP(p) > 0) return '';
  if(d && d.stable) return `<div class="death-saves stable">✚ Estable — inconsciente con 0 HP (despierta en 1d4 horas o al curarlo)</div>`;
  const s = d ? d.s : 0, f = d ? d.f : 0;
  const pips = (n, on, off) => Array.from({length:3}, (_, i) => i < n ? on : off).join('');
  return `<div class="death-saves">
    <span>💀 Death saves</span>
    <span class="ds-pips ds-ok" title="Éxitos">${pips(s, '●', '○')}</span>
    <span class="ds-pips ds-fail" title="Fallos">${pips(f, '✖', '○')}</span>
    <span class="dm-only ds-controls">
      <input type="number" class="form-input ds-input" min="1" max="20" placeholder="d20" onkeydown="if(event.key==='Enter') rollDeathSave('${p.id}', this.value)">
      <button class="btn-small" onclick="rollDeathSave('${p.id}', this.previousElementSibling.value)">Tirar</button>
      <button class="btn-small" onclick="stabilizeChar('${p.id}')" title="Spare the Dying / Medicine DC 10">Estabilizar</button>
    </span>
  </div>`;
}

/* Stat block del monstruo (del bestiario) desplegable en el tracker y en su form de acción */
const STATBLOCK_OPEN = new Set();
function toggleStatBlock(id, open){ if(open) STATBLOCK_OPEN.add(id); else STATBLOCK_OPEN.delete(id); }
function renderMonsterStatBlock(p){
  const m = getMonsterPreset(p);
  if(!m) return '';
  const attacks = (m.attacks||[]).map(a => `<div>⚔ <strong>${liveEscape(a.name)}</strong> ${liveEscape(a.bonus||'')} · ${liveEscape(a.dmg||'')}${a.note ? ` <em class="muted">(${liveEscape(a.note)})</em>` : ''}</div>`).join('');
  const phases = (m.phases||[]).map(ph => `<div><strong>${liveEscape(ph.name)}</strong>: ${liveEscape(ph.desc)}</div>`).join('');
  const thresholds = getMonsterHPThresholds(p).map(t => `<span class="cond-chip" title="${liveEscape(t.text)}">⚠ ${t.hp} HP</span>`).join(' ');
  const scores = ['str','dex','con','int','wis','cha'].filter(k => m[k] != null)
    .map(k => `${k.toUpperCase()} ${m[k]} (${abilityMod(m[k])>=0?'+':''}${abilityMod(m[k])})`).join(' · ');
  return `<details class="monster-statblock dm-only" ${STATBLOCK_OPEN.has(p.id)?'open':''} ontoggle="toggleStatBlock('${p.id}', this.open)">
    <summary>📜 ${liveEscape([m.size, m.type].filter(Boolean).join(' '))} · CR ${liveEscape(m.cr||'?')} · ${liveEscape(m.speed||'')}</summary>
    ${scores ? `<div class="ms-section muted">${scores}</div>` : ''}
    ${attacks ? `<div class="ms-section">${attacks}</div>` : ''}
    ${m.abilities ? `<div class="ms-section"><strong>Habilidades:</strong> <span style="white-space:pre-line">${liveEscape(m.abilities)}</span></div>` : ''}
    ${phases ? `<div class="ms-section">${phases}</div>` : ''}
    ${thresholds ? `<div class="ms-section">Avisos al bajar de: ${thresholds}</div>` : ''}
    ${m.notes ? `<div class="ms-section muted">${liveEscape(m.notes)}</div>` : ''}
  </details>`;
}

function renderCombatTracker(){
  const stateEl = document.getElementById('combat-state');
  const listEl = document.getElementById('combat-list');
  const pickerEl = document.getElementById('monster-picker');
  if(!stateEl || !listEl) return;

  const cmb = LIVE_SESSION.combat;
  const order = getTurnOrder();
  const pending = order.filter(p => !p.actedThisRound);
  const current = cmb.active ? getCurrentCombatant() : null;

  // ── State header ──
  if(combatStartPending){
    stateEl.innerHTML = `
      <div class="combat-start-form dm-only">
        <div class="form-title" style="margin-bottom:0.5rem">🗡 Describir inicio de combate</div>
        <p class="muted" style="font-size:0.8rem;margin-bottom:0.5rem">Cómo comenzó el encuentro, dónde están, qué provocó el combate... Cargá la iniciativa de cada uno antes de empezar.</p>
        <textarea class="form-input form-textarea" style="min-height:60px" placeholder="ej: Los bandidos saltan desde los arbustos, el Comandante da la orden de ataque..."
          oninput="combatStartNotes = this.value"></textarea>
        <div class="form-btns" style="margin-top:0.5rem">
          <button class="btn-cancel" onclick="cancelStartCombat()">Cancelar</button>
          <button class="btn-primary" onclick="confirmStartCombat()">Iniciar combate</button>
        </div>
      </div>`;
  } else if(cmb.active){
    stateEl.innerHTML = `
      <div class="combat-state-active">
        <div class="combat-round-block">
          <span class="combat-round-label">ROUND</span>
          <span class="combat-round-num">${cmb.round}</span>
        </div>
        <div class="combat-turn-status">
          ${current ? `<span class="turn-current">▶ Turno de <strong>${liveEscape(getCombatantName(current))}</strong></span>` : '<span class="muted">Sin turno activo</span>'}
          <span class="muted" style="font-size:0.75rem">${pending.length} sin jugar este round</span>
        </div>
        <div class="combat-state-buttons dm-only">
          ${current ? `<button class="btn-primary btn-end-turn" onclick="endTurn()" title="Pasa al siguiente en iniciativa">Fin de turno ▶</button>` : ''}
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
      const dead = isDead(p);
      const down = !dead && hp <= 0;
      const ac = getCombatantAC(p);
      const baseAC = getCombatantBaseAC(p);
      const hpPct = max > 0 ? (hp/max)*100 : 0;
      const hpColor = hpPct <= 25 ? 'var(--red-bright)' : hpPct <= 50 ? '#e07020' : 'var(--green-bright)';
      const acted = !!p.actedThisRound;
      const isCurrent = !!(current && current.id === p.id);

      // Botones: ⚔ registrar acción (cualquier momento: turno, reacción, ataque de oportunidad),
      // ⏭ saltear su turno, ▶ darle el turno fuera de orden
      let actionBtn = '';
      if(cmb.active && !dead){
        actionBtn = `<button class="combatant-act" onclick="actCombatant('${p.id}')" title="Registrar acción (también reacciones / ataques de oportunidad)">⚔</button>`;
        if(!acted && canTakeTurn(p)){
          actionBtn += `<button class="combatant-skip" onclick="skipCombatant('${p.id}')" title="Saltar turno">⏭</button>`;
          if(!isCurrent) actionBtn += `<button class="combatant-skip" onclick="giveTurn('${p.id}')" title="Darle el turno ahora (acción preparada, demora)">▶</button>`;
        }
        if(acted) actionBtn += `<span class="combatant-acted-badge" title="Ya jugó este round">✓</span>`;
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
        <div class="combatant ${p.kind} ${acted?'has-acted':''} ${dead?'is-dead':''} ${down?'is-down':''} ${isWild?'is-wild-shape':''} ${isCurrent?'is-current':''}" ${cardClick}>
          <div class="combatant-row1">
            <input class="combatant-init dm-only" type="number" value="${p.initiative||0}" title="Iniciativa" onchange="setCombatantInit('${p.id}', this.value)">
            <span class="combatant-name">${isCurrent?'▶ ':''}${liveEscape(getCombatantName(p))}${p.kind==='player'?' <em>(Pj)</em>':''}${rageBadge}${recklessBadge}</span>
            <div class="combatant-action-btns dm-only">${actionBtn}</div>
            <span class="dm-only">${lootBtn}</span>
            <button class="combatant-del dm-only" onclick="removeCombatant('${p.id}')" title="Sacar del combate">✕</button>
          </div>
          ${isCurrent ? `<div class="combatant-turn-bar dm-only">${renderEconomyChips(p)}<button class="btn-small btn-end-turn" onclick="endTurn()">Fin de turno ▶</button></div>` : ''}
          ${!isCurrent && p.reactionUsed && cmb.active ? `<div class="combatant-turn-bar dm-only"><span class="econ-chip used">Reacción ✓</span></div>` : ''}
          ${wildShapeBlock}
          <div class="combatant-row2 dm-only" ${isWild?'style="display:none"':''}>
            <div class="combatant-hp">
              <button class="vital-btn vital-btn-sm" onclick="changeCombatantHP('${p.id}',-1)">−</button>
              <input class="combatant-hp-val" type="number" value="${hp}" min="0" max="${max}" onchange="setCombatantHP('${p.id}', this.value)">
              <span class="combatant-hp-max">/${max}</span>
              <button class="vital-btn vital-btn-sm" onclick="changeCombatantHP('${p.id}',1)">+</button>
            </div>
            <input class="combatant-quick-hp" placeholder="−7 · +5 · t5" title="Enter: 7 o -7 = daño · +5 = curación · t5 = HP temporales (t0 los quita)"
              onkeydown="if(event.key==='Enter'){ quickHP('${p.id}', this.value); this.value=''; }">
            <label class="combatant-ac" title="CA base (editable). Si hay buffs, la efectiva va al lado.">CA
              <input class="combatant-ac-input" type="number" value="${baseAC}" onchange="setCombatantAC('${p.id}', this.value)">${ac !== baseAC ? ` → <strong>${ac}</strong>` : ''}
            </label>
          </div>
          <div class="combatant-hp-bar"><div class="hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
          ${renderDeathSaves(p)}
          ${p.kind==='player' ? renderCombatantResources(p.refId) : ''}
          ${renderCombatantConditions(p)}
          ${p.kind==='monster' ? renderMonsterStatBlock(p) : ''}
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
          ${MONSTERS.filter(m=>m.showInLive!==false).map(m=>`
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
    parts.push(`<div class="narrative-chapter chapter-pre open">
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
    parts.push(`<div class="narrative-chapter open ${isPureNarrative?'chapter-pure':''}">
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
  return `<div class="narrative-chapter-hdr" id="chap-${n.id}" onclick="event.target.closest('button')||this.closest('.narrative-chapter').classList.toggle('open')">
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
    <span class="chap-chevron">▾</span>
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
  const outcomeLabels = { hit:'HIT!', miss:'MISS', pass:'PASS', fail:'FAIL', nat20:'★ NAT 20', nat1:'✗ NAT 1', heal:'✚ CURA', buff:'✨ BUFF' };
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
        const dealt = r.damageDealt != null ? r.damageDealt : (r.outcome==='pass' && r.halfOnSave ? Math.floor(parseInt(damage)/2) : damage);
        const dmgNote = r.hpAfter !== r.hpBefore && dealt
          ? ` — <strong>${dealt}</strong> ${r.label==='explosión' ? '' : (damageType||'')}${hpChange}` : '';
        return `<div class="note-target-row">
          <span class="note-target-name">${liveEscape(r.name)}${r.label ? ` <span class="muted">(${liveEscape(r.label)})</span>` : ''}</span>
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
        <span class="note-target-name">${liveEscape(r.name)}${r.label ? ` <span class="muted">(${liveEscape(r.label)})</span>` : ''}</span>
        ${r.threshold != null ? `<span class="note-target-ca muted">CA ${r.threshold}</span>` : ''}
        <span class="outcome-badge ${cls}">${outcomeTxt}</span>${dmgTxt}
      </div>`;
    }).join('')}
  </div>`;
}

/* Reacciones que se resolvieron dentro de un ataque (Shield, Desviar, Duro, contragolpe…) */
function renderNoteReactions(n){
  if(!Array.isArray(n.reactions) || !n.reactions.length) return '';
  return `<div class="note-reactions">${n.reactions.map(r => `<div>${liveEscape(r)}</div>`).join('')}</div>`;
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
  const reactionsLine = renderNoteReactions(n);
  // Legacy: notas viejas con targetName/outcome directo
  const legacyOutcome = !n.targetResults && n.outcome
    ? `<span class="outcome-badge ${n.outcome}">${{hit:'HIT!',miss:'MISS',nat20:'★ NAT 20',nat1:'✗ NAT 1'}[n.outcome]||n.outcome}</span>` : '';
  return `
    <div class="note-title">${weaponLabel}<strong>${liveEscape(n.monsterName||'NPC')}</strong> ${what}</div>
    ${rollLine}${legacyOutcome}
    ${reactionsLine}
    ${targetsBlock}
    ${n.notes ? `<div class="note-sub" style="white-space:pre-line">${liveEscape(n.notes)}</div>` : ''}
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
  if(n.actionType==='spell' && n.spellName) what = n.sustained ? `sostiene ${n.spellName} (sin slot)` : `lanza ${n.spellName} (Nv ${n.spellLevel})`;
  if(n.actionType==='cantrip' && n.cantripName) what = `lanza ${n.cantripName} (cantrip)`;
  if((n.actionType==='attack-melee'||n.actionType==='attack-ranged') && n.weapon) what += ` con ${n.weapon}`;

  let rollLine = '';
  if(n.roll !== '' && n.roll != null){
    rollLine = `<div class="note-roll">
      d20: <strong>${n.roll}</strong> ${n.modifier ? (parseInt(n.modifier)>=0?'+':'')+n.modifier : ''} = <strong>${n.total}</strong>
    </div>`;
  }

  const targetsBlock = renderTargetResultsBlock(n.targetResults, n.damage, n.damageType, n.damageDice);
  const ridersLine = (n.riders||[]).length ? `<div class="note-sub">Incluye: ${n.riders.map(r => `${liveEscape(r.label)} = ${r.value}`).join(' · ')}</div>` : '';

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
    ${renderNoteReactions(n)}
    ${targetsBlock}${legacyBlock}
    ${ridersLine}
    ${n.notes ? `<div class="note-sub" style="white-space:pre-line">${liveEscape(n.notes)}</div>` : ''}
  `;
}

/* ── FINALIZAR ──
   Procesa las notas narrativas de la sesión y empuja todo a Campaña → Eventos:
   • Notas vinculadas a evento planificado → ese evento pasa a "Hecho" (con sus updates)
   • Notas "No planificadas" con título/texto → crear evento nuevo con status "Hecho"
     y session = número de sesión actual
*/
async function finalizeSession(){
  // ── Guard: no pisar en silencio una sesión ya archivada (ej: el header quedó en #8 y se jugó la #9).
  // Si este mismo LIVE_SESSION ya la archivó en un intento anterior que falló a medias, es un reintento.
  const sessionNumber = Number(LIVE_SESSION.meta.number) || 0;
  const existingSession = await fetchArchivedSession(sessionNumber);
  const isRetry = LIVE_SESSION.meta.archivedNumber === sessionNumber;
  if(existingSession && !isRetry){
    if(!confirm([
      `⚠ La Sesión #${sessionNumber} ya está archivada (${archivedSessionLabel(existingSession)}).`,
      ``,
      `Si finalizás con este número la vas a SOBRESCRIBIR con el stream actual.`,
      `Si esta es una sesión nueva, cancelá y cambiá el número en el header.`,
      ``,
      `¿Sobrescribir la Sesión #${sessionNumber}?`
    ].join('\n'))) return;
  }

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
  const saveErrors = []; // { label, status } — cualquier guardado que no haya confirmado ok

  // safeFetch: como fetch, pero nunca "falla en silencio" — devuelve {ok:false} tanto
  // si hubo un error de red como si el servidor respondió con un status no-2xx (401, 500, etc).
  async function safeFetch(url, opts, label){
    try{
      const res = await fetch(url, opts);
      if(!res.ok) saveErrors.push({ label, status: res.status });
      return res;
    } catch(err){
      saveErrors.push({ label, status: 'network: ' + err.message });
      return { ok:false };
    }
  }

  if(typeof CAMPAIGN !== 'undefined'){
    // Calcular el próximo número de orden: max orden de eventos "done" + 1
    const maxDoneOrder = (CAMPAIGN.events || [])
      .filter(e => e.status === 'done' && typeof e.order === 'number' && e.order < 1000)
      .reduce((max, e) => Math.max(max, e.order), 0);

    // Construir la secuencia de eventos tal como ocurrieron en el stream.
    // Las notas narrativas están ordenadas cronológicamente en LIVE_SESSION.notes;
    // iteramos en ese orden para preservar la secuencia real de la sesión.
    // Saltamos las que ya se sincronizaron con éxito en un intento anterior (note._synced),
    // así un reintento después de un fallo no duplica nada.
    const sessionEventSequence = [];
    const seenEventIds = new Set();
    for(const note of (LIVE_SESSION.notes || [])){
      if(note.type !== 'narrative' || note._synced) continue;
      if(note.eventId && !seenEventIds.has(note.eventId)){
        seenEventIds.add(note.eventId);
        sessionEventSequence.push({ kind: 'linked', eventId: note.eventId, note });
      } else if(!note.eventId && (note.title || note.text)){
        // Nota no planificada — se identifica por su id para no duplicar
        if(!seenEventIds.has(note.id)){
          seenEventIds.add(note.id);
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
          const order = nextOrder++;
          const res = await safeFetch(`/api/events/${item.eventId}`, {
            method:'PUT', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ status:'done', order })
          }, `Marcar evento "${e.title}" como Hecho`);
          if(res.ok){
            e.status = 'done';
            e.order  = order;
            eventsUpdated++;
            item.note._synced = true;
          }
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
        const res = await safeFetch('/api/events', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify(newEvent)
        }, `Crear evento nuevo "${newEvent.title}"`);
        if(res.ok){
          CAMPAIGN.events.push(newEvent);
          eventsCreated++;
          note._synced = true;
        }
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
      // las notas live guardan `timestamp` (pushNote); `ts` queda por compatibilidad
      ts:   n.timestamp ? new Date(n.timestamp) : (n.ts ? new Date(n.ts) : new Date()),
      type: n.type || 'note',
      text: n.title || n.text || '',
      data: n   // nota completa en el campo Mixed para fidelidad total
    }))
  };

  // Crear, o actualizar si ya existía (el DM lo confirmó arriba, o es un reintento).
  // Ya no se hace "POST y si da 400, PUT": eso sobrescribía sesiones viejas sin avisar.
  const saveRes = existingSession
    ? await safeFetch(`/api/sessions/${sessionPayload.number}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(sessionPayload)
      }, 'Actualizar la sesión ya archivada')
    : await safeFetch('/api/sessions', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(sessionPayload)
      }, 'Archivar la sesión en Sessions');

  const sessionArchived = saveRes.ok;
  // Recordar que este LIVE_SESSION ya archivó ese número: si otra cosa falló, el reintento no vuelve a preguntar
  if(sessionArchived) LIVE_SESSION.meta.archivedNumber = sessionPayload.number;

  // ── Si algo no se guardó, frenamos ACÁ. No se toca LIVE_SESSION ni se resetea nada. ──
  if(!sessionArchived || saveErrors.length > 0){
    saveLiveSession(); // persiste los note._synced que sí funcionaron, para no reintentarlos
    renderLive();
    alert([
      `⚠ No se pudo finalizar la sesión #${LIVE_SESSION.meta.number} — algunos guardados fallaron.`,
      ``,
      ...saveErrors.map(e => `• ${e.label}: ${e.status}`),
      !sessionArchived ? `• El archivo de la sesión completa (colección Sessions) no se guardó.` : '',
      ``,
      `Nada se borró — la sesión live sigue activa con todas sus notas. Si el problema fue "Sesión expirada" (401), volvé a ingresar tu token de DM y tocá "Finalizar sesión" de nuevo — lo que ya se guardó no se va a duplicar.`
    ].filter(Boolean).join('\n'));
    return;
  }

  // ── Resetear LIVE_SESSION para la próxima sesión (solo si TODO se guardó bien) ──
  const nextNumber = (Number(LIVE_SESSION.meta.number) || 0) + 1;
  LIVE_SESSION = {
    meta: {
      number: nextNumber,
      title:  '',
      date:   new Date().toISOString().slice(0, 10),
      active: false,
      presentChars: [...CHARS],
      present: CHARS.join(', '),
      locationId:     null,
      locationDetail: ''
    },
    notes:  [],
    combat: { active: false, round: 1, turn: 0, participants: [] }
  };
  saveLiveSession();
  LIVE_ARCHIVED_INFO = null;
  renderLive();
  checkArchivedSessionNumber();

  alert([
    `✓ Sesión #${nextNumber - 1} finalizada y archivada.`,
    ``,
    `• ${eventsUpdated} evento(s) marcados como "Hecho"`,
    `• ${eventsCreated} evento(s) nuevo(s) creados como "Hecho"`,
    `• Stream completo guardado en la colección Sessions`,
    ``,
    `La sesión live fue reseteada. Lista para la Sesión #${nextNumber}.`
  ].join('\n'));
}

function resetLiveSession(){
  if(!confirm(
    `¿Resetear la sesión live?\n\nEsto borra TODAS las notas, el stream y el combate actual.\nEl número de sesión (#${LIVE_SESSION.meta.number}) y los datos de personajes NO se tocan.\n\nEsta acción no se puede deshacer.`
  )) return;
  LIVE_SESSION.notes  = [];
  LIVE_SESSION.combat = { active: false, round: 1, turn: 0, participants: [] };
  currentForm = null;
  saveLiveSession();
  renderLive();
}

/* ── INIT ── */
function initLive(){
  loadLiveSession();
  renderLive();
  checkArchivedSessionNumber();
  window._liveInitialized = true;
  // Jugadores piden el estado actual al servidor (sobreescribe localStorage con estado del DM)
  if (!window.DM_MODE && window._socket) window._socket.emit('live:request');
}
