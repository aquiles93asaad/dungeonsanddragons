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
