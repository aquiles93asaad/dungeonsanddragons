/* ── PLAYERS: login de jugadores + notas privadas + panel DM ─────────────────
   - window.PLAYER_SESSION = { username, characterId } cuando hay sesión activa
   - Notas privadas: solo visibles para el propio jugador (no DM)
   - Panel DM: crear/listar/borrar jugadores en sub-tab Campaña
   ─────────────────────────────────────────────────────────────────────────── */

window.PLAYER_SESSION = null;

const CHAR_NAMES = { rac:'Rac', relyo:'Relyo', tyrell:'Tyrell', boyd:'Boyd', esdas:'Esdas' };

// ── Sesión de jugador ────────────────────────────────────────────────────────
function setPlayerSession(player) {
  window.PLAYER_SESSION = player;

  // Indicador en el nav
  if (typeof setSessionIndicator === 'function') {
    if (player) setSessionIndicator('⚔ ' + (CHAR_NAMES[player.characterId] || player.username), '#7dd3fc');
    else        setSessionIndicator('');
  }

  // Mostrar/ocultar secciones de notas privadas
  CHARS.forEach(c => {
    const el = document.getElementById('private-notes-' + c);
    if (el) el.style.display = (player && player.characterId === c) ? 'block' : 'none';
  });
  if (player) loadPrivateNotes(player.characterId);
}

async function loadPrivateNotes(charId) {
  try {
    const res  = await fetch('/api/players/me/notes');
    if (!res.ok) return;
    const data = await res.json();
    const ta   = document.getElementById('private-notes-ta-' + charId);
    if (ta) ta.value = data.notes || '';
  } catch (_) {}
}

// Debounce para auto-guardar notas privadas
let _privateNoteTimer = null;
function onPrivateNoteInput(charId) {
  clearTimeout(_privateNoteTimer);
  _privateNoteTimer = setTimeout(() => savePrivateNotes(charId), 1200);
}

async function savePrivateNotes(charId) {
  if (!window.PLAYER_SESSION || window.PLAYER_SESSION.characterId !== charId) return;
  const ta = document.getElementById('private-notes-ta-' + charId);
  if (!ta) return;
  try {
    await fetch('/api/players/me/notes', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ notes: ta.value }),
    });
  } catch (_) {}
}

// ── Modal de login de jugador (accesible si el jugador quiere cambiar de cuenta) ──
function openPlayerLogin() {
  if (window.PLAYER_SESSION) { playerLogout(); return; }
  const modal = document.getElementById('player-login-modal');
  if (!modal) return;
  document.getElementById('player-token-input').value = '';
  document.getElementById('player-login-error').textContent = '';
  modal.classList.add('open');
  document.getElementById('player-token-input').focus();
}

function closePlayerLogin() {
  const modal = document.getElementById('player-login-modal');
  if (modal) modal.classList.remove('open');
}

async function submitPlayerLogin() {
  const input   = document.getElementById('player-token-input');
  const errorEl = document.getElementById('player-login-error');
  const btn     = document.getElementById('player-login-btn');
  const token   = input.value.trim();
  if (!token) return;

  btn.disabled    = true;
  btn.textContent = 'Verificando...';
  try {
    const res  = await fetch('/api/auth/player-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) localStorage.setItem('ard_access_token', data.token);
      setPlayerSession({ username: data.username, characterId: data.characterId });
      closePlayerLogin();
      // Navegar a la hoja del personaje
      showPage('chars');
      if (typeof showSidebar === 'function') showSidebar('chars');
      if (typeof showChar === 'function') showChar(data.characterId);
    } else {
      errorEl.textContent = data.error || 'Token inválido.';
      input.value = '';
      input.focus();
    }
  } catch (_) {
    errorEl.textContent = 'Error de conexión.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Entrar';
  }
}

async function playerLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('ard_access_token');
  setPlayerSession(null);
  if (typeof showAppGate === 'function') showAppGate();
}

// ── Panel DM: gestión de jugadores ──────────────────────────────────────────
async function renderPlayersPanel() {
  const el = document.getElementById('cmp-players');
  if (!el) return;

  let players = [];
  try {
    const res = await fetch('/api/players');
    if (res.ok) players = await res.json();
  } catch (_) {}

  const charLabels = { rac:'Rac (Bárbaro)', relyo:'Relyo (Monje)', tyrell:'Tyrell (Paladín)',
                       boyd:'Boyd (Druida)', esdas:'Esdas (Wizard)' };

  el.innerHTML = `
    <div class="players-panel">
      <h3 class="players-panel-title">Cuentas de jugadores</h3>

      <div class="players-create-form">
        <input id="new-player-username" class="players-input" placeholder="Nombre de usuario" />
        <select id="new-player-char" class="players-select">
          <option value="">— Personaje —</option>
          ${Object.entries(charLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
        </select>
        <button class="players-create-btn" onclick="createPlayer()">+ Crear jugador</button>
      </div>
      <div id="players-create-error" class="players-error"></div>

      <div class="players-list">
        ${players.length === 0
          ? '<p class="muted" style="font-size:0.85rem;padding:0.5rem 0">Sin jugadores creados.</p>'
          : players.map(p => `
            <div class="player-row">
              <div class="player-info">
                <span class="player-name">${p.username}</span>
                <span class="player-char muted">${charLabels[p.characterId] || p.characterId}</span>
              </div>
              <div class="player-token-wrap">
                <span class="player-token-label muted">Token:</span>
                <code class="player-token" id="tok-${p.username}">${p.accessToken}</code>
                <button class="players-copy-btn" onclick="copyPlayerToken('${p.username}')" title="Copiar token">⎘</button>
              </div>
              <button class="players-del-btn" onclick="deletePlayer('${p.username}')" title="Eliminar jugador">✕</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

async function createPlayer() {
  const username    = document.getElementById('new-player-username').value.trim();
  const characterId = document.getElementById('new-player-char').value;
  const errorEl     = document.getElementById('players-create-error');
  errorEl.textContent = '';

  if (!username || !characterId) {
    errorEl.textContent = 'Completá usuario y personaje.';
    return;
  }
  try {
    const res = await fetch('/api/players', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, characterId }),
    });
    const data = await res.json();
    if (!res.ok) { errorEl.textContent = data.error || 'Error al crear jugador.'; return; }
    document.getElementById('new-player-username').value = '';
    document.getElementById('new-player-char').value     = '';
    renderPlayersPanel();
  } catch (_) { errorEl.textContent = 'Error de conexión.'; }
}

async function deletePlayer(username) {
  if (!confirm(`¿Eliminar a ${username}? Su token quedará inválido.`)) return;
  try {
    await fetch('/api/players/' + username, { method: 'DELETE' });
    renderPlayersPanel();
  } catch (_) {}
}

function copyPlayerToken(username) {
  const code = document.getElementById('tok-' + username);
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(() => {
    const btn = code.nextElementSibling;
    if (btn) { const orig = btn.textContent; btn.textContent = '✓'; setTimeout(() => btn.textContent = orig, 1500); }
  });
}

// ── Teclado ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePlayerLogin();
  if (e.key === 'Enter') {
    const modal = document.getElementById('player-login-modal');
    if (modal && modal.classList.contains('open')) submitPlayerLogin();
  }
});
