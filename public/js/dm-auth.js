/* ── AUTH: gate de acceso + sesiones DM y jugador ────────────────────────────
   Flujo:
   1. checkDMSession() → lee localStorage → intenta token-login silencioso
   2. Si hay token válido: unlockApp()
   3. Si no hay token o es inválido: muestra el gate
   ─────────────────────────────────────────────────────────────────────────── */

const TOKEN_KEY = 'ard_access_token';
window.DM_MODE  = false;

// ── Lock / Unlock ────────────────────────────────────────────────────────────
function lockApp() {
  document.body.classList.add('app-locked');
}

function unlockApp() {
  document.body.classList.remove('app-locked');
  const gate = document.getElementById('app-gate');
  if (gate) gate.style.display = 'none';
}

function showAppGate() {
  lockApp();
  const gate = document.getElementById('app-gate');
  if (gate) {
    gate.style.display = 'flex';
    const input = document.getElementById('gate-token-input');
    if (input) { input.value = ''; input.focus(); }
    document.getElementById('gate-token-error').textContent = '';
  }
}

// ── Indicador de sesión en el nav ────────────────────────────────────────────
function setSessionIndicator(text, color) {
  const el = document.getElementById('session-indicator');
  if (!el) return;
  el.textContent = text;
  el.style.color = color || 'var(--muted)';
}

// ── Estado DM ────────────────────────────────────────────────────────────────
function setDMMode(active) {
  window.DM_MODE = active;
  document.body.classList.toggle('dm-mode', active);
  if (active) setSessionIndicator('🎲 DM', 'var(--gold)');
  else        setSessionIndicator('');
}

// ── Arranque: chequear token guardado en localStorage ───────────────────────
async function checkDMSession() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    try {
      const res  = await fetch('/api/auth/token-login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.role === 'dm') {
          setDMMode(true);
        } else if (data.role === 'player' && typeof setPlayerSession === 'function') {
          setPlayerSession({ username: data.username, characterId: data.characterId });
        }
        unlockApp();
        return;
      }
    } catch (_) {}

    localStorage.removeItem(TOKEN_KEY);
  }

  showAppGate();
}

// ── Submit desde el gate ─────────────────────────────────────────────────────
async function submitGateToken() {
  const input   = document.getElementById('gate-token-input');
  const errorEl = document.getElementById('gate-token-error');
  const btn     = document.getElementById('gate-submit-btn');
  const token   = input.value.trim();
  if (!token) return;

  btn.disabled    = true;
  btn.textContent = 'Verificando...';
  errorEl.textContent = '';

  try {
    const res  = await fetch('/api/auth/token-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem(TOKEN_KEY, token);
      if (data.role === 'dm') {
        setDMMode(true);
      } else if (data.role === 'player' && typeof setPlayerSession === 'function') {
        setPlayerSession({ username: data.username, characterId: data.characterId });
      }
      unlockApp();
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

// ── Logout ───────────────────────────────────────────────────────────────────
async function dmLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem(TOKEN_KEY);
  setDMMode(false);
  showAppGate();
}

// ── Interceptor global de 401 ────────────────────────────────────────────────
const _originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
  const res = await _originalFetch(url, options);
  if (typeof url === 'string' && url.startsWith('/api/auth')) return res;
  if (res.status === 401) {
    const cloned = res.clone();
    const toast  = document.createElement('div');
    toast.className   = 'dm-toast';
    toast.textContent = 'Sesión expirada. Volvé a ingresar tu token.';
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); showAppGate(); }, 1800);
    return cloned;
  }
  return res;
};

// ── Enter en el gate ─────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const gate = document.getElementById('app-gate');
    if (gate && gate.style.display !== 'none') { submitGateToken(); return; }
    const playerModal = document.getElementById('player-login-modal');
    if (playerModal && playerModal.classList.contains('open')) {
      if (typeof submitPlayerLogin === 'function') submitPlayerLogin();
    }
  }
  if (e.key === 'Escape' && typeof closePlayerLogin === 'function') closePlayerLogin();
});
