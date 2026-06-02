/* ── INIT: arranque async de la app ────────────────────────────────────────
   1. Fetchea todos los datos de referencia desde la API
   2. Popula los globals (ITEMS, CLASS_PRESETS, etc.)
   3. Corre el init normal (localStorage para estado dinámico)
   ────────────────────────────────────────────────────────────────────────── */

async function fetchAPI(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

function showLoadingError(msg) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;
                background:#0d0d0d;color:#f87171;font-family:monospace;flex-direction:column;gap:1rem">
      <div style="font-size:1.5rem">⚠ Error al cargar la app</div>
      <div style="font-size:0.9rem;color:#6b7280">${msg}</div>
      <button onclick="location.reload()"
        style="margin-top:1rem;padding:0.5rem 1.5rem;background:#1f1f1f;border:1px solid #374151;
               color:#d1d5db;border-radius:6px;cursor:pointer;font-family:monospace">
        Reintentar
      </button>
    </div>`;
}

async function loadReferenceData() {
  const [
    items, conditions, npcs, monsters,
    events, threads, locations, presetsMap
  ] = await Promise.all([
    fetchAPI('/api/items'),
    fetchAPI('/api/conditions'),
    fetchAPI('/api/npcs'),
    fetchAPI('/api/monsters'),
    fetchAPI('/api/events'),
    fetchAPI('/api/threads'),
    fetchAPI('/api/locations'),
    fetchAPI('/api/presets-map'),
  ]);

  // Popula los globals que el resto del código espera
  ITEMS                    = items;
  CONDITIONS               = conditions;
  NPCS                     = npcs;
  NPC_IDS                  = npcs.map(n => n.id);
  PRESET_MONSTERS          = monsters;
  DEFAULT_CAMPAIGN_EVENTS  = events;
  DEFAULT_CAMPAIGN_THREADS = threads;
  DEFAULT_CAMPAIGN_LOCATIONS = locations;
  CLASS_PRESETS            = presetsMap;

  // CONCENTRATION_META desde el array de condiciones (no tiene colección propia)
  // lo reconstruimos localmente
  CONCENTRATION_META = {
    id:'concentration', name:'Concentration', nameEs:'Concentración',
    icon:'◎', color:'#fbbf24',
    desc:'Mantiene concentración en un spell. Recibir daño → CON save DC max(10, daño/2) o pierde la concentración.'
  };
}

function initApp() {
  renderNPCs();

  CHARS.forEach(c => {
    const hp  = load('hp_' + c, getHPMax(c));
    const inp = document.getElementById(c + '-hp');
    if (inp) { inp.value = hp; updateHP(c); }

    const conds = load('cond_' + c, []);
    conds.forEach(cond => {
      document.querySelectorAll('#' + c + '-conditions .condition-btn')
        .forEach(btn => { if (btn.textContent === cond) btn.classList.add('active'); });
    });

    renderInventory(c);

    const notes = load('notes_' + c, '');
    const ta    = document.getElementById(c + '-notes');
    if (ta) ta.value = notes;

    const portrait = load('portrait_' + c, null);
    if (portrait) setPortrait(c, portrait);
  });

  NPC_IDS.forEach(n => {
    const note = load('npc_note_' + n, '');
    const ta   = document.getElementById('npc-' + n + '-notes');
    if (ta) ta.value = note;

    const portrait = load('portrait_npc-' + n, null);
    if (portrait) setPortrait('npc-' + n, portrait);
  });

  renderAllAbilities();
  renderAllMoney();
  updateOverview();
}

// ── Arranque ───────────────────────────────────────────────────────────────
checkDMSession().then(() => loadReferenceData())
  .then(() => {
    loadMonsters();
    renderMonsters();
    initCampaign();
    initLive();
    initItems();

    document.getElementById('imageModal')
      .addEventListener('click', function(e) {
        if (e.target === this) closeImageModal();
      });

    initApp();
  })
  .catch(err => {
    console.error('Error cargando datos de referencia:', err);
    showLoadingError(err.message);
  });
