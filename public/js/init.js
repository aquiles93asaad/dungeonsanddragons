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
  loadStory();
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

// ── Estado en memoria cargado desde MongoDB (fuente de verdad para renders) ──
window.CHAR_STATE = {};

// ── Carga de estado de personajes desde MongoDB ────────────────────────────
async function loadCharState() {
  try {
    const state = await fetchAPI('/api/state');
    if(!state) return;
    if(state.characters){
      CHARS.forEach(c => {
        const cs = state.characters[c];
        if(!cs) return;
        // Guardar en memoria (fuente de verdad primaria para renders)
        window.CHAR_STATE[c] = cs;
        // Guardar en localStorage (persistencia entre sesiones / fallback offline)
        if(cs.level            !== undefined) save('char_level_'+c,       cs.level);
        if(cs.hpMax            !== undefined) save('hp_max_'+c,           cs.hpMax);
        if(cs.hp               !== undefined) save('hp_'+c,               cs.hp);
        if(cs.conditions)                     save('cond_'+c,             cs.conditions);
        if(cs.inventory)                      save('inv_'+c,              cs.inventory);
        if(cs.notes            !== undefined && cs.notes !== null)
                                              save('notes_'+c,            cs.notes);
        if(cs.prepared)                       save('prepared_'+c,         cs.prepared);
        if(cs.activeCantrips)                 save('active_cantrips_'+c,  cs.activeCantrips);
        if(cs.committedSchool)                save('committed_school_'+c, cs.committedSchool);
        if(cs.abilityScores)                  save('ability_scores_'+c,   cs.abilityScores);
        if(cs.slots)     Object.entries(cs.slots).forEach(([lvl,v])  => save('slots_'+c+'_'+lvl, v));
        if(cs.resources) Object.entries(cs.resources).forEach(([k,v]) => save('resource_'+c+'_'+k, v));
      });
    }
    if(state.money){
      Object.entries(state.money).forEach(([owner, m]) => save('money_'+owner, m));
    }
    if(Array.isArray(state.wildShapeForms)){
      CAMPAIGN.wildShapeForms = state.wildShapeForms;
    } else {
      console.warn('[init] wildShapeForms no encontrado en state:', state.wildShapeForms);
    }
  } catch(e){
    // Degradación graceful: si falla la API, usa los valores de localStorage
    console.warn('loadCharState: usando localStorage como fallback.', e.message);
  }
}

// ── Arranque ───────────────────────────────────────────────────────────────
checkDMSession().then(() => loadReferenceData())
  .then(() => loadCharState())         // cargar estado de personajes desde MongoDB
  .then(() => {
    loadMonsters().then(() => renderMonsters());
    initCampaign();
    initLive();
    initItems();

    document.getElementById('imageModal')
      .addEventListener('click', function(e) {
        if (e.target === this) closeImageModal();
      });

    initApp();
    _apiSyncEnabled = true;            // habilitar sync DESPUÉS del render inicial
  })
  .catch(err => {
    console.error('Error cargando datos de referencia:', err);
    showLoadingError(err.message);
  });
