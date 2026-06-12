/* ── SOCKET CLIENT: sincronización en tiempo real de la sesión live ──────────
   Flujo:
   - DM emite 'live:sync' (saveLiveSession) y 'hp:update' (updateHP)
   - Servidor relay retransmite a todos los demás clientes
   - Jugadores reciben y re-renderizan sin interacción
   ─────────────────────────────────────────────────────────────────────────── */

const _socket = io();
window._socket = _socket;
window._liveInitialized = false; // seteado en initLive() para saber cuándo pedir estado

_socket.on('connect', () => {
  // Reconexión después de init: pedir estado actual al servidor
  if (!window.DM_MODE && window._liveInitialized) {
    _socket.emit('live:request');
  }
});

// ── Estado completo de la sesión live (retransmitido por el DM) ───────────
_socket.on('live:sync', data => {
  if (window.DM_MODE) return;
  applySessionSync(data);
});

// ── Bienvenida al reconectar: sesión + HPs actuales ───────────────────────
_socket.on('live:welcome', ({ session, hp }) => {
  if (window.DM_MODE) return;
  if (session) applySessionSync(session);
  if (hp) applyHPSync(hp);
});

// ── Estado completo de un personaje (level up, slots, recursos, spells, etc.) ──
// ── Estado completo de un personaje (level up, slots, recursos, spells, etc.) ──
_socket.on('char:update', ({ charId, data }) => {
  if(window.DM_MODE) return;
  if(!data || !charId) return;

  // Actualizar CHAR_STATE en memoria (fuente de verdad para renders)
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  window.CHAR_STATE[charId] = Object.assign(window.CHAR_STATE[charId] || {}, data);

  // Escribir en localStorage sin pasar por save() para no disparar otro syncCharState
  const _ls = (key, val) => { try{ localStorage.setItem('ard_'+key, JSON.stringify(val)); } catch(e){} };
  if(data.hp              !== undefined) _ls('hp_'+charId,               data.hp);
  if(data.hpMax           !== undefined) _ls('hp_max_'+charId,           data.hpMax);
  if(data.level           !== undefined) _ls('char_level_'+charId,       data.level);
  if(data.conditions)                    _ls('cond_'+charId,             data.conditions);
  if(data.inventory)                     _ls('inv_'+charId,              data.inventory);
  if(data.notes           !== undefined) _ls('notes_'+charId,            data.notes);
  if(data.prepared)                      _ls('prepared_'+charId,         data.prepared);
  if(data.activeCantrips)                _ls('active_cantrips_'+charId,  data.activeCantrips);
  if(data.committedSchool !== undefined) _ls('committed_school_'+charId, data.committedSchool);
  if(data.abilityScores)                _ls('ability_scores_'+charId,   data.abilityScores);
  if(data.slots)     Object.entries(data.slots).forEach(([lvl, v]) => _ls('slots_'+charId+'_'+lvl, v));
  if(data.resources) Object.entries(data.resources).forEach(([k, v])  => _ls('resource_'+charId+'_'+k, v));

  const inp = document.getElementById(charId+'-hp');
  if(inp && data.hp !== undefined){ inp.value = data.hp; if(typeof updateHP === 'function') updateHP(charId); }
  if(typeof renderCharAbilities === 'function') renderCharAbilities(charId);
  if(typeof updateOverview       === 'function') updateOverview();
});

// ── HP de un personaje (cambio individual, más frecuente en combate) ──────
_socket.on('hp:update', ({ charId, hp }) => {
  if (window.DM_MODE) return;
  if (typeof save === 'function') save('hp_' + charId, hp);
  const inp = document.getElementById(charId + '-hp');
  if (inp && inp.value != hp) {
    inp.value = hp;
    if (typeof updateHP === 'function') updateHP(charId);
  }
  // Re-renderiza el tracker de combate si la página live está activa
  if (isLivePageActive() && typeof renderCombatTracker === 'function') {
    renderCombatTracker();
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────
function applySessionSync(data) {
  if (!data || typeof LIVE_SESSION === 'undefined') return;
  LIVE_SESSION = data;
  if (isLivePageActive() && typeof renderLive === 'function') renderLive();
}

function applyHPSync(hp) {
  Object.entries(hp).forEach(([charId, val]) => {
    if (typeof save === 'function') save('hp_' + charId, val);
    const inp = document.getElementById(charId + '-hp');
    if (inp && inp.value != val) {
      inp.value = val;
      if (typeof updateHP === 'function') updateHP(charId);
    }
  });
  if (isLivePageActive() && typeof renderCombatTracker === 'function') {
    renderCombatTracker();
  }
}

function isLivePageActive() {
  const el = document.getElementById('page-live');
  return el && el.classList.contains('active');
}
