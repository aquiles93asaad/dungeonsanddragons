/* ── STORAGE: localStorage helpers + auto-sync a MongoDB ── */

// Se activa desde init.js después de cargar el estado inicial (para no sincronizar durante el arranque)
var _apiSyncEnabled = false;

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
    const data = {
      level:          (typeof getCharLevel  !== 'undefined') ? getCharLevel(c)  : load('char_level_'+c, 2),
      hpMax:          (typeof getHPMax      !== 'undefined') ? getHPMax(c)      : load('hp_max_'+c, 10),
      hp:             load('hp_'+c, 10),
      conditions:     load('cond_'+c, []),
      inventory:      load('inv_'+c, []),
      notes:          load('notes_'+c, ''),
      prepared:       load('prepared_'+c, []),
      activeCantrips: load('active_cantrips_'+c, []),
      committedSchool:load('committed_school_'+c, null),
      slots:          {},
      resources:      {}
    };
    // Spell slots
    if(typeof getSpellSlotsForLevel !== 'undefined'){
      const slotTable = getSpellSlotsForLevel(c);
      Object.keys(slotTable).forEach(lvl => { data.slots[lvl] = load('slots_'+c+'_'+lvl, 0); });
    }
    // Resources
    if(preset && preset.resources){
      preset.resources.forEach(r => { data.resources[r.key] = load('resource_'+c+'_'+r.key, 0); });
    }
    fetch(`/api/state/character/${c}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
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
