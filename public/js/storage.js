/* ── STORAGE: localStorage helpers + auto-sync a MongoDB ── */

// Se activa desde init.js después de cargar el estado inicial (para no sincronizar durante el arranque)
var _apiSyncEnabled = false;

// Limpiar localStorage obsoleto al arrancar (excepto el token de acceso)
(function clearStaleStorage(){
  const STORAGE_VERSION = '5';
  const token = localStorage.getItem('ard_access_token');
  if(localStorage.getItem('ard_storage_version') !== STORAGE_VERSION){
    Object.keys(localStorage)
      .filter(k => k.startsWith('ard_'))
      .forEach(k => localStorage.removeItem(k));
    if(token) localStorage.setItem('ard_access_token', token);
    localStorage.setItem('ard_storage_version', STORAGE_VERSION);
  }
})();

function save(key, val){
  try{ localStorage.setItem('ard_'+key, JSON.stringify(val)); showSaved(); } catch(e){}
  if(_apiSyncEnabled) _maybeSyncToAPI(key);
}

function load(key, def){
  try{ const v = localStorage.getItem('ard_'+key); return v ? JSON.parse(v) : def; } catch(e){ return def; }
}

function showSaved(){
  const el = document.getElementById('saveIndicator');
  if(!el) return;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 1500);
}

// ── Auto-sync a MongoDB ────────────────────────────────────────────────────
// Prefijos que corresponden a estado de personaje (excluye portrait_, npc_*, etc.)
const _CHAR_SYNC_PREFIXES = [
  'hp_', 'char_level_', 'cond_', 'inv_', 'notes_',
  'prepared_', 'active_cantrips_', 'committed_school_', 'slots_', 'resource_'
];

function _charFromStateKey(key){
  // 'hp_rac' → 'rac' | 'slots_rac_1' → 'rac' | 'char_level_rac' → 'rac'
  const parts = key.split('_');
  for(let i = 1; i <= 2; i++){
    if(parts[i] && typeof CHARS !== 'undefined' && CHARS.includes(parts[i])) return parts[i];
  }
  return null;
}

function _maybeSyncToAPI(key){
  if(!window.DM_MODE) return;
  if(_CHAR_SYNC_PREFIXES.some(p => key.startsWith(p))){
    const c = _charFromStateKey(key);
    if(c) syncCharState(c);
  } else if(key.startsWith('money_')){
    syncMoney();
  }
}

// ── syncCharState: lee todo el estado del personaje y lo manda a la API ──
const _charSyncTimers = {};
function syncCharState(c){
  if(!window.DM_MODE) return;
  clearTimeout(_charSyncTimers[c]);
  _charSyncTimers[c] = setTimeout(() => {
    const preset = (typeof CLASS_PRESETS !== 'undefined') ? CLASS_PRESETS[c] : null;
    const cs = (window.CHAR_STATE && window.CHAR_STATE[c]) || {};
    const data = {
      level:          (typeof getCharLevel  !== 'undefined') ? getCharLevel(c)  : (cs.level || 2),
      hpMax:          (typeof getHPMax      !== 'undefined') ? getHPMax(c)      : (cs.hpMax || 10),
      hp:             cs.hp !== undefined ? cs.hp : (cs.hpMax || 10),
      conditions:     cs.conditions     || [],
      inventory:      cs.inventory      || [],
      notes:          cs.notes          || '',
      prepared:       cs.prepared       || [],
      activeCantrips: cs.activeCantrips || [],
      committedSchool:cs.committedSchool || null,
      abilityScores:  (typeof getAbilityScores !== 'undefined') ? getAbilityScores(c) : (cs.abilityScores || null),
      slots:          {},
      resources:      {}
    };
    // Spell slots
    if(typeof getSpellSlotsForLevel !== 'undefined'){
      const slotTable = getSpellSlotsForLevel(c);
      Object.keys(slotTable).forEach(lvl => { data.slots[lvl] = (cs.slots && cs.slots[lvl] !== undefined) ? cs.slots[lvl] : 0; });
    }
    // Resources
    if(preset && preset.resources){
      preset.resources.forEach(r => { data.resources[r.key] = (cs.resources && cs.resources[r.key] !== undefined) ? cs.resources[r.key] : 0; });
    }
    // Actualizar CHAR_STATE en memoria inmediatamente (sin esperar respuesta API)
    if(!window.CHAR_STATE) window.CHAR_STATE = {};
    window.CHAR_STATE[c] = Object.assign(window.CHAR_STATE[c] || {}, data);

    fetch(`/api/state/character/${c}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    }).then(() => {
      if(window._socket) window._socket.emit('char:update', { charId: c, data });
    }).catch(e => console.error('syncCharState error:', e));
  }, 400);
}

// ── syncMoney: manda dinero de todos los owners a la API ──
var _moneySyncTimer;
function syncMoney(){
  if(!window.DM_MODE) return;
  clearTimeout(_moneySyncTimer);
  _moneySyncTimer = setTimeout(() => {
    const moneyData = {};
    if(typeof CHARS !== 'undefined'){
      ['group', ...CHARS].forEach(owner => {
        moneyData[owner] = load('money_'+owner, {cp:0, sp:0, gp:0, pp:0});
      });
    }
    fetch('/api/state', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({money: moneyData})
    }).catch(e => console.error('syncMoney error:', e));
  }, 400);
}
