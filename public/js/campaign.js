/* ── CAMPAIGN: hilos narrativos, eventos reordenables, lugares, ideas ── */

let CAMPAIGN = { events: [], threads: [], locations: [] };
let currentCampaignTab = 'events';

// ── Estado de edición pendiente ────────────────────────────────────────────
const _dirty   = {};    // { [id]: true }  — campos editados sin guardar
const _isNew   = {};    // { [id]: true }  — aún no POSTeado
const _orderDirty = { events: false, threads: false, locations: false };

const API = { events:'/api/events', threads:'/api/threads', locations:'/api/locations' };

function _put(path, data){
  return fetch(path, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    .catch(e => console.error('Campaign PUT error:', e.message));
}
function _post(path, data){
  return fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    .catch(e => console.error('Campaign POST error:', e.message));
}
function _delete(path){
  fetch(path, { method:'DELETE' }).catch(e => console.error('Campaign DELETE error:', e.message));
}

// Marca una card como sucia y muestra el botón guardar
function _markDirty(id){
  _dirty[id] = true;
  const card = document.querySelector(`[data-id="${id}"]`);
  if(card) card.querySelector('.cmp-save-btn')?.classList.add('visible');
}

// Limpia el estado dirty y oculta el botón guardar
function _clearDirty(id){
  delete _dirty[id];
  const card = document.querySelector(`[data-id="${id}"]`);
  if(card) card.querySelector('.cmp-save-btn')?.classList.remove('visible');
}

// Muestra u oculta el banner de "guardar orden" para un kind
function _setOrderDirty(kind, dirty){
  _orderDirty[kind] = dirty;
  const banner = document.getElementById('order-banner-'+kind);
  if(banner) banner.style.display = dirty ? 'flex' : 'none';
}

function loadCampaign(){
  CAMPAIGN = {
    events:         JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_EVENTS)),
    threads:        JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_THREADS)),
    locations:      JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_LOCATIONS)),
    wildShapeForms: CAMPAIGN.wildShapeForms || []
  };
}

function saveCampaign(){}  // no-op legacy

function escapeAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function switchCampaignTab(tab){
  currentCampaignTab = tab;
  document.querySelectorAll('.campaign-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.campaign-tab-content').forEach(c=>c.classList.remove('active'));
  const el = document.getElementById('cmp-'+tab);
  if(el) el.classList.add('active');
}

// ── Banner de orden ─────────────────────────────────────────────────────────
function _orderBannerHTML(kind){
  return `<div class="order-banner" id="order-banner-${kind}" style="display:none">
    <span>Orden modificado sin guardar</span>
    <button class="btn-save-order" onclick="saveOrder('${kind}')">💾 Guardar orden</button>
    <button class="btn-discard-order" onclick="discardOrder('${kind}')">✕ Descartar</button>
  </div>`;
}

async function saveOrder(kind){
  const arr = CAMPAIGN[kind];
  await Promise.all(arr.map((item, i) =>
    _put(`${API[kind]}/${item.id}`, { order: i })
  ));
  arr.forEach((item, i) => { item.order = i; });
  _setOrderDirty(kind, false);
}

function discardOrder(kind){
  // Recarga desde el estado en memoria (sin re-fetch) y cancela el orden pendiente
  _setOrderDirty(kind, false);
  if(kind==='events') renderEvents();
  else if(kind==='threads') renderThreads();
  else if(kind==='locations') renderLocations();
}

/* ── GUARDAR / CANCELAR por card ─────────────────────────────────────────── */
function saveCard(kind, id){
  const item = CAMPAIGN[kind].find(x=>x.id===id);
  if(!item) return;

  if(_isNew[id]){
    // Primer guardado — POST
    const order = CAMPAIGN[kind].indexOf(item);
    _post(API[kind], { ...item, order })
      .then(() => { delete _isNew[id]; _clearDirty(id); })
      .catch(e => console.error(e));
  } else {
    // Actualización — PUT con todos los campos del item
    _put(`${API[kind]}/${id}`, item)
      .then(() => _clearDirty(id))
      .catch(e => console.error(e));
  }
}

function cancelNewCard(kind, id){
  CAMPAIGN[kind] = CAMPAIGN[kind].filter(x=>x.id!==id);
  delete _isNew[id];
  delete _dirty[id];
  if(kind==='events') renderEvents();
  else if(kind==='threads') renderThreads();
  else if(kind==='locations') renderLocations();
}

/* ── EVENTOS ──────────────────────────────────────────────────────────────── */
function renderEvents(){
  const list = document.getElementById('event-list');
  if(!list) return;
  list.innerHTML = _orderBannerHTML('events');
  if(_orderDirty.events) document.getElementById('order-banner-events').style.display='flex';
  CAMPAIGN.events.forEach(e=>{
    const card = document.createElement('div');
    card.className = 'cmp-card event-card draggable';
    card.dataset.id = e.id;
    card.draggable = true;
    const isNew = !!_isNew[e.id];
    const isDirty = !!_dirty[e.id];
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <div class="cmp-row1">
          <input class="cmp-title" value="${escapeAttr(e.title)}"
            oninput="onEventField('${e.id}','title',this.value)" placeholder="Título del evento">
          <select class="cmp-status status-${e.status}"
            onchange="onEventField('${e.id}','status',this.value);this.className='cmp-status status-'+this.value">
            <option value="done"        ${e.status==='done'       ?'selected':''}>Hecho</option>
            <option value="in-progress" ${e.status==='in-progress'?'selected':''}>En curso</option>
            <option value="planned"     ${e.status==='planned'    ?'selected':''}>Planificado</option>
            <option value="idea"        ${e.status==='idea'       ?'selected':''}>Idea</option>
          </select>
          <input class="cmp-session" value="${escapeAttr(e.session||'')}"
            oninput="onEventField('${e.id}','session',this.value)" placeholder="Ses.">
        </div>
        <textarea class="cmp-desc"
          oninput="onEventField('${e.id}','description',this.value)"
          placeholder="Descripción del evento...">${escapeAttr(e.description||'')}</textarea>
      </div>
      <div class="cmp-controls">
        <button class="cmp-save-btn${isDirty||isNew?' visible':''}"
          onclick="saveCard('events','${e.id}')" title="Guardar">💾</button>
        ${isNew ? `<button class="cmp-btn cmp-cancel" onclick="cancelNewCard('events','${e.id}')" title="Cancelar">✕</button>` : ''}
        <button class="cmp-btn" onclick="moveItem('events','${e.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('events','${e.id}',1)" title="Bajar">↓</button>
        ${!isNew ? `<button class="cmp-btn cmp-del" onclick="deleteItem('events','${e.id}')" title="Eliminar">✕</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'events');
}

function onEventField(id, field, value){
  const e = CAMPAIGN.events.find(x=>x.id===id);
  if(!e) return;
  e[field] = value;
  _markDirty(id);
}

// Llamado desde live.js para cambios de status programáticos (sin botón guardar)
function updateEvent(id, field, value){
  const e = CAMPAIGN.events.find(x=>x.id===id);
  if(!e) return;
  e[field] = value;
  _put(`${API.events}/${id}`, { [field]: value });
  if(field==='status'){
    const card = document.querySelector(`.event-card[data-id="${id}"]`);
    if(card){ card.querySelector('.cmp-status').className = 'cmp-status status-'+value; }
  }
}

function addCampaignEvent(){
  const id = 'evt-'+Date.now();
  const newEvent = { id, title:'Nuevo evento', description:'', status:'idea', session:'' };
  CAMPAIGN.events.push(newEvent);
  _isNew[id] = true;
  _dirty[id] = true;
  renderEvents();
  // Scroll al nuevo card
  setTimeout(()=>{
    const card = document.querySelector(`.event-card[data-id="${id}"]`);
    if(card) card.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 50);
}

/* ── HILOS ────────────────────────────────────────────────────────────────── */
function renderThreads(){
  const list = document.getElementById('thread-list');
  if(!list) return;
  list.innerHTML = _orderBannerHTML('threads');
  if(_orderDirty.threads) document.getElementById('order-banner-threads').style.display='flex';
  CAMPAIGN.threads.forEach(t=>{
    const card = document.createElement('div');
    card.className = 'cmp-card thread-card draggable';
    card.dataset.id = t.id;
    card.draggable = true;
    const isNew = !!_isNew[t.id];
    const isDirty = !!_dirty[t.id];
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <div class="cmp-row1 thread-row">
          <input class="cmp-title" value="${escapeAttr(t.name)}"
            oninput="onThreadField('${t.id}','name',this.value)" placeholder="Nombre del hilo">
          <select class="cmp-status status-${t.status}"
            onchange="onThreadField('${t.id}','status',this.value);this.className='cmp-status status-'+this.value">
            <option value="active"   ${t.status==='active'  ?'selected':''}>Activo</option>
            <option value="emerging" ${t.status==='emerging'?'selected':''}>Emergiendo</option>
            <option value="dormant"  ${t.status==='dormant' ?'selected':''}>Dormido</option>
            <option value="resolved" ${t.status==='resolved'?'selected':''}>Resuelto</option>
          </select>
        </div>
        <textarea class="cmp-desc"
          oninput="onThreadField('${t.id}','description',this.value)"
          placeholder="Descripción del hilo narrativo...">${escapeAttr(t.description||'')}</textarea>
        <input class="cmp-meta" value="${escapeAttr((t.characters||[]).join(', '))}"
          oninput="onThreadChars('${t.id}',this.value)" placeholder="Personajes involucrados (separados por coma)">
      </div>
      <div class="cmp-controls">
        <button class="cmp-save-btn${isDirty||isNew?' visible':''}"
          onclick="saveCard('threads','${t.id}')">💾 Guardar</button>
        ${isNew ? `<button class="cmp-btn cmp-cancel" onclick="cancelNewCard('threads','${t.id}')" title="Cancelar">✕</button>` : ''}
        <button class="cmp-btn" onclick="moveItem('threads','${t.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('threads','${t.id}',1)" title="Bajar">↓</button>
        ${!isNew ? `<button class="cmp-btn cmp-del" onclick="deleteItem('threads','${t.id}')" title="Eliminar">✕</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'threads');
}

function onThreadField(id, field, value){
  const t = CAMPAIGN.threads.find(x=>x.id===id);
  if(!t) return;
  t[field] = value;
  _markDirty(id);
}
function onThreadChars(id, value){
  const t = CAMPAIGN.threads.find(x=>x.id===id);
  if(!t) return;
  t.characters = value.split(',').map(s=>s.trim()).filter(Boolean);
  _markDirty(id);
}
// legacy — usado desde live.js
function updateThread(id, field, value){
  const t = CAMPAIGN.threads.find(x=>x.id===id);
  if(!t) return;
  t[field] = value;
  _put(`${API.threads}/${id}`, { [field]: value });
}

function addCampaignThread(){
  const id = 'thread-'+Date.now();
  const newThread = { id, name:'Nuevo hilo', status:'active', description:'', characters:[] };
  CAMPAIGN.threads.push(newThread);
  _isNew[id] = true;
  _dirty[id] = true;
  renderThreads();
  setTimeout(()=>{
    const card = document.querySelector(`.thread-card[data-id="${id}"]`);
    if(card) card.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 50);
}

/* ── LUGARES ──────────────────────────────────────────────────────────────── */
function renderLocations(){
  const list = document.getElementById('location-list');
  if(!list) return;
  list.innerHTML = _orderBannerHTML('locations');
  if(_orderDirty.locations) document.getElementById('order-banner-locations').style.display='flex';
  CAMPAIGN.locations.forEach(l=>{
    const card = document.createElement('div');
    card.className = 'cmp-card location-card draggable';
    card.dataset.id = l.id;
    card.draggable = true;
    const isNew = !!_isNew[l.id];
    const isDirty = !!_dirty[l.id];
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <input class="cmp-title" value="${escapeAttr(l.name)}"
          oninput="onLocationField('${l.id}','name',this.value)" placeholder="Nombre del lugar">
        <div class="loc-row">
          <label class="loc-parent-label">Dentro de
            <select class="loc-parent-select" onchange="onLocationParent('${l.id}',this.value)">${locParentOptions(l)}</select>
          </label>
          <button class="loc-open-btn" onclick="openLocationModal('${l.id}')" title="Ver NPCs y eventos de este lugar">🔎 ${locCountsLabel(l.id)}</button>
        </div>
        <textarea class="cmp-desc"
          oninput="onLocationField('${l.id}','description',this.value)"
          placeholder="Descripción del lugar...">${escapeAttr(l.description||'')}</textarea>
        <input class="cmp-meta" value="${escapeAttr(l.state||'')}"
          oninput="onLocationField('${l.id}','state',this.value)" placeholder="Estado actual / quiénes están ahí">
      </div>
      <div class="cmp-controls">
        <button class="cmp-save-btn${isDirty||isNew?' visible':''}"
          onclick="saveCard('locations','${l.id}')">💾 Guardar</button>
        ${isNew ? `<button class="cmp-btn cmp-cancel" onclick="cancelNewCard('locations','${l.id}')" title="Cancelar">✕</button>` : ''}
        <button class="cmp-btn" onclick="moveItem('locations','${l.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('locations','${l.id}',1)" title="Bajar">↓</button>
        ${!isNew ? `<button class="cmp-btn cmp-del" onclick="deleteItem('locations','${l.id}')" title="Eliminar">✕</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'locations');
}

function onLocationField(id, field, value){
  const l = CAMPAIGN.locations.find(x=>x.id===id);
  if(!l) return;
  l[field] = value;
  _markDirty(id);
}
function onLocationParent(id, parentId){
  onLocationField(id, 'parentId', parentId || null);
  renderLocations();   // refresca opciones y contadores (incluyen sub-lugares)
}
// legacy
function updateLocation(id, field, value){
  const l = CAMPAIGN.locations.find(x=>x.id===id);
  if(!l) return;
  l[field] = value;
  _put(`${API.locations}/${id}`, { [field]: value });
}

function addCampaignLocation(){
  const id = 'loc-'+Date.now();
  const newLoc = { id, name:'Nuevo lugar', description:'', state:'' };
  CAMPAIGN.locations.push(newLoc);
  _isNew[id] = true;
  _dirty[id] = true;
  renderLocations();
  setTimeout(()=>{
    const card = document.querySelector(`.location-card[data-id="${id}"]`);
    if(card) card.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 50);
}

/* ── LUGARES: jerarquía (parentId) + NPCs y eventos asociados (locationIds) ─────
   Un lugar puede estar dentro de otro (la Taverna de Rollo → Solmira). NPCs y eventos
   guardan locationIds; el modal de un lugar muestra lo asociado a él y a sus sub-lugares,
   así el DM ve de un vistazo quién puede aparecer y qué puede pasar ahí. */
const EVENT_STATUS_LABEL = { 'in-progress':'En curso', planned:'Planificado', idea:'Idea', done:'Hecho' };
const LOC_POSSIBLE_ORDER = ['in-progress', 'planned', 'idea'];
let LOC_MODAL_ID = null;

function locById(id){ return CAMPAIGN.locations.find(l => l.id === id) || null; }
function locIdsOf(x){ return Array.isArray(x && x.locationIds) ? x.locationIds : []; }
function locAncestors(l){
  const out = [], seen = new Set([l.id]);
  let p = l.parentId ? locById(l.parentId) : null;
  while(p && !seen.has(p.id)){ out.unshift(p); seen.add(p.id); p = p.parentId ? locById(p.parentId) : null; }
  return out;
}
function locChildren(id){ return CAMPAIGN.locations.filter(l => l.parentId === id && l.id !== id); }
// Sub-lugares a cualquier profundidad (protegido contra ciclos)
function locDescendantIds(id){
  const out = [], seen = new Set([id]), stack = [id];
  while(stack.length){
    const cur = stack.shift();
    locChildren(cur).forEach(c => { if(!seen.has(c.id)){ seen.add(c.id); out.push(c.id); stack.push(c.id); } });
  }
  return out;
}
// Opciones del select "Dentro de": todos menos el propio lugar y sus sub-lugares (evita ciclos)
function locParentOptions(l){
  const banned = new Set([l.id, ...locDescendantIds(l.id)]);
  const opts = CAMPAIGN.locations.filter(o => !banned.has(o.id))
    .map(o => `<option value="${escapeAttr(o.id)}" ${o.id===l.parentId?'selected':''}>${escapeAttr(o.name||o.id)}</option>`).join('');
  return `<option value="" ${!l.parentId||!locById(l.parentId)?'selected':''}>— Lugar principal —</option>${opts}`;
}

// NPCs/eventos del lugar y sus sub-lugares. via = id del lugar por el que entran (el propio si es directo).
function locGather(id){
  const scope = [id, ...locDescendantIds(id)];
  const viaOf = x => { const ids = locIdsOf(x); return ids.includes(id) ? id : scope.find(s => ids.includes(s)); };
  const npcs = (typeof NPCS !== 'undefined' ? NPCS : []).map(n => ({ n, via: viaOf(n) })).filter(x => x.via);
  const events = CAMPAIGN.events.map(e => ({ e, via: viaOf(e) })).filter(x => x.via);
  return { npcs, events };
}
function locCountsLabel(id){
  const { npcs, events } = locGather(id);
  const possible = events.filter(x => x.e.status !== 'done').length;
  return `👤 ${npcs.length} · 📜 ${possible} posible${possible===1?'':'s'}`;
}
const npcIsDead = n => /†/.test(n.statusLabel || '');
// "Sin lugar fijo": NPCs sin ningún lugar válido y eventos pendientes sin lugar (pueden pasar en cualquier lado)
function locUnplaced(){
  const valid = x => locIdsOf(x).some(id => locById(id));
  return {
    npcs: (typeof NPCS !== 'undefined' ? NPCS : []).filter(n => !valid(n) && !npcIsDead(n)),
    events: CAMPAIGN.events.filter(e => e.status !== 'done' && !valid(e))
  };
}

function _ensureLocModal(){
  if(document.getElementById('locModal')) return;
  const m = document.createElement('div');
  m.className = 'loc-modal'; m.id = 'locModal';
  m.innerHTML = '<div class="loc-modal-box" id="locModalBox"></div>';
  m.addEventListener('click', e => { if(e.target === m) closeLocationModal(); });
  document.body.appendChild(m);
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && document.getElementById('locModal')?.classList.contains('show')) closeLocationModal();
  });
}
function openLocationModal(id){
  if(!locById(id)) return;
  LOC_MODAL_ID = id;
  _ensureLocModal();
  renderLocationModal();
  const m = document.getElementById('locModal');
  m.classList.add('show');
  const box = document.getElementById('locModalBox'); if(box) box.scrollTop = 0;
}
function closeLocationModal(){
  LOC_MODAL_ID = null;
  document.getElementById('locModal')?.classList.remove('show');
}

function _locViaTag(via){
  if(via === LOC_MODAL_ID) return '';
  const v = locById(via);
  return v ? `<button class="loc-via" onclick="openLocationModal('${v.id}')" title="Ver ese lugar">en ${escapeAttr(v.name)}</button>` : '';
}
function _locNpcCard({ n, via }, unplaced){
  const text = [n.desc, n.extra].filter(Boolean).join('\n\n');
  const action = unplaced
    ? `<button class="loc-here-btn" onclick="locAssociate('npc','${n.id}')" title="Asociar a este lugar">📍 Aquí</button>`
    : (via === LOC_MODAL_ID ? `<button class="loc-x" onclick="locDissociate('npc','${n.id}')" title="Quitar de este lugar">✕</button>` : '');
  return `<div class="loc-npc${npcIsDead(n)?' is-dead':''}">
    <div class="loc-npc-top">
      <span class="loc-npc-icon">${escapeAttr(n.icon||'✦')}</span>
      <span class="loc-npc-name">${escapeAttr(n.name)}</span>
      ${action}
    </div>
    ${n.role ? `<div class="loc-npc-role">${escapeAttr(n.role)}</div>` : ''}
    <div class="loc-npc-tags">
      <span class="npc-status ${escapeAttr(n.status||'neutral')}">${escapeAttr(n.statusLabel||n.status||'')}</span>
      ${unplaced ? '' : _locViaTag(via)}
    </div>
    ${text ? `<div class="loc-text clamp" onclick="this.classList.toggle('clamp')" title="Click para ver todo">${escapeAttr(text)}</div>` : ''}
  </div>`;
}
function _locEventItem({ e, via }, unplaced){
  const ses = e.session ? (/^\d+$/.test(String(e.session)) ? 'S'+e.session : e.session) : '';
  const action = unplaced
    ? `<button class="loc-here-btn" onclick="locAssociate('event','${e.id}')" title="Asociar a este lugar">📍 Aquí</button>`
    : (via === LOC_MODAL_ID ? `<button class="loc-x" onclick="locDissociate('event','${e.id}')" title="Quitar de este lugar">✕</button>` : '');
  return `<div class="loc-evt">
    <div class="loc-evt-head">
      <span class="cmp-status loc-pill status-${escapeAttr(e.status)}">${EVENT_STATUS_LABEL[e.status]||escapeAttr(e.status||'')}</span>
      <span class="loc-evt-title">${escapeAttr(e.title||'')}</span>
      ${ses ? `<span class="loc-evt-ses">${escapeAttr(ses)}</span>` : ''}
      ${unplaced ? '' : _locViaTag(via)}
      ${action}
    </div>
    ${e.description ? `<div class="loc-text clamp" onclick="this.classList.toggle('clamp')" title="Click para ver todo">${escapeAttr(e.description)}</div>` : ''}
  </div>`;
}

function renderLocationModal(){
  const box = document.getElementById('locModalBox');
  const l = LOC_MODAL_ID && locById(LOC_MODAL_ID);
  if(!box || !l) return;
  const ancestors = locAncestors(l);
  const children = locChildren(l.id);
  const { npcs, events } = locGather(l.id);
  // Vivos primero; los muertos quedan al final, atenuados (siguen siendo parte de la historia del lugar)
  npcs.sort((a, b) => (npcIsDead(a.n) - npcIsDead(b.n)) || ((a.via === l.id ? 0 : 1) - (b.via === l.id ? 0 : 1)));
  const possible = events.filter(x => x.e.status !== 'done')
    .sort((a, b) => LOC_POSSIBLE_ORDER.indexOf(a.e.status) - LOC_POSSIBLE_ORDER.indexOf(b.e.status));
  const done = events.filter(x => x.e.status === 'done');
  const un = locUnplaced();

  const directNpcIds = new Set(npcs.filter(x => x.via === l.id).map(x => x.n.id));
  const npcOpts = (typeof NPCS !== 'undefined' ? NPCS : []).filter(n => !directNpcIds.has(n.id))
    .slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
    .map(n => `<option value="${escapeAttr(n.id)}">${escapeAttr(n.name)}${locIdsOf(n).length ? '' : ' (sin lugar)'}</option>`).join('');
  const directEvtIds = new Set(events.filter(x => x.via === l.id).map(x => x.e.id));
  const evtOpts = CAMPAIGN.events.filter(e => !directEvtIds.has(e.id))
    .map(e => `<option value="${escapeAttr(e.id)}">${e.status==='done'?'✓ ':''}${escapeAttr(e.title||e.id)}</option>`).join('');

  const childChips = children.map(c => {
    const g = locGather(c.id);
    const p = g.events.filter(x => x.e.status !== 'done').length;
    return `<button class="loc-sub-chip" onclick="openLocationModal('${c.id}')">${escapeAttr(c.name)} <span>👤 ${g.npcs.length} · 📜 ${p}</span></button>`;
  }).join('');

  box.innerHTML = `
    <div class="loc-modal-head">
      <div>
        ${ancestors.length ? `<div class="loc-crumbs">${ancestors.map(a => `<button onclick="openLocationModal('${a.id}')">${escapeAttr(a.name)}</button>`).join('<span>›</span>')}<span>›</span></div>` : ''}
        <div class="loc-modal-title">${escapeAttr(l.name)}</div>
      </div>
      <button class="loc-modal-close" onclick="closeLocationModal()" title="Cerrar (Esc)">✕</button>
    </div>
    ${l.state ? `<div class="loc-modal-state">${escapeAttr(l.state)}</div>` : ''}
    ${children.length ? `<div class="loc-sec"><div class="loc-sec-title">Lugares dentro</div><div class="loc-sub-chips">${childChips}</div></div>` : ''}

    <div class="loc-sec">
      <div class="loc-sec-head">
        <span class="loc-sec-title">NPCs (${npcs.length})</span>
        <select class="loc-add-select" onchange="locAssociate('npc',this.value)"><option value="">+ Asociar NPC…</option>${npcOpts}</select>
      </div>
      ${npcs.length ? `<div class="loc-npc-grid">${npcs.map(x => _locNpcCard(x)).join('')}</div>` : '<p class="loc-empty">Ningún NPC asociado todavía.</p>'}
    </div>

    <div class="loc-sec">
      <div class="loc-sec-head">
        <span class="loc-sec-title">Eventos posibles (${possible.length})</span>
        <select class="loc-add-select" onchange="locAssociate('event',this.value)"><option value="">+ Asociar evento…</option>${evtOpts}</select>
      </div>
      ${possible.length ? possible.map(x => _locEventItem(x)).join('') : '<p class="loc-empty">No hay eventos planificados para este lugar.</p>'}
    </div>

    ${done.length ? `<details class="loc-sec loc-details">
      <summary class="loc-sec-title">Ya ocurrió aquí (${done.length})</summary>
      ${done.map(x => _locEventItem(x)).join('')}
    </details>` : ''}

    ${(un.npcs.length || un.events.length) ? `<details class="loc-sec loc-details">
      <summary class="loc-sec-title">Sin lugar fijo (${un.npcs.length + un.events.length}) — pueden aparecer en cualquier lado</summary>
      ${un.npcs.length ? `<div class="loc-npc-grid">${un.npcs.map(n => _locNpcCard({ n }, true)).join('')}</div>` : ''}
      ${un.events.map(e => _locEventItem({ e }, true)).join('')}
    </details>` : ''}
  `;
}

function _locTarget(kind, id){
  return kind === 'npc' ? (typeof NPCS !== 'undefined' ? NPCS : []).find(n => n.id === id) : CAMPAIGN.events.find(e => e.id === id);
}
function _locPersist(kind, item){
  const body = { locationIds: item.locationIds };
  if(kind === 'npc') return _put(`/api/npcs/${item.id}`, body);
  if(_isNew[item.id]) return Promise.resolve();   // evento sin guardar: viaja con su primer POST
  return _put(`${API.events}/${item.id}`, body);
}
function locAssociate(kind, id){
  const item = id && _locTarget(kind, id);
  if(!item || !LOC_MODAL_ID) return;
  const ids = locIdsOf(item).filter(x => locById(x));   // limpia ids de lugares borrados
  if(!ids.includes(LOC_MODAL_ID)) ids.push(LOC_MODAL_ID);
  item.locationIds = ids;
  _locPersist(kind, item);
  renderLocationModal();
  renderLocations();
}
function locDissociate(kind, id){
  const item = _locTarget(kind, id);
  if(!item || !LOC_MODAL_ID) return;
  item.locationIds = locIdsOf(item).filter(x => x !== LOC_MODAL_ID);
  _locPersist(kind, item);
  renderLocationModal();
  renderLocations();
}

/* ── COMUNES: mover / eliminar / drag&drop ────────────────────────────────── */
function moveItem(kind, id, delta){
  const arr = CAMPAIGN[kind];
  const idx = arr.findIndex(x=>x.id===id);
  const newIdx = idx + delta;
  if(idx<0 || newIdx<0 || newIdx>=arr.length) return;
  const [item] = arr.splice(idx,1);
  arr.splice(newIdx,0,item);
  _setOrderDirty(kind, true);
  if(kind==='events') renderEvents();
  else if(kind==='threads') renderThreads();
  else if(kind==='locations') renderLocations();
}

function deleteItem(kind, id){
  if(!confirm('¿Eliminar este elemento?')) return;
  CAMPAIGN[kind] = CAMPAIGN[kind].filter(x=>x.id!==id);
  _delete(`${API[kind]}/${id}`);
  if(kind==='events') renderEvents();
  else if(kind==='threads') renderThreads();
  else if(kind==='locations') renderLocations();
}

function attachDragHandlers(list, kind){
  list.querySelectorAll('.draggable').forEach(el=>{
    el.addEventListener('dragstart', e=>{
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', el.dataset.id);
    });
    el.addEventListener('dragend', ()=>{
      el.classList.remove('dragging');
      const newOrder = Array.from(list.querySelectorAll('.draggable')).map(x=>x.dataset.id);
      const collection = CAMPAIGN[kind];
      CAMPAIGN[kind] = newOrder.map(id=>collection.find(x=>x.id===id)).filter(Boolean);
      _setOrderDirty(kind, true);
    });
    el.addEventListener('dragover', e=>{
      e.preventDefault();
      const dragging = list.querySelector('.dragging');
      if(dragging && dragging !== el){
        const rect = el.getBoundingClientRect();
        const after = (e.clientY - rect.top) > (rect.height/2);
        if(after) list.insertBefore(dragging, el.nextSibling);
        else list.insertBefore(dragging, el);
      }
    });
  });
}

function bindDragFromHandleOnly(){
  document.addEventListener('mousedown', e=>{
    const card = e.target.closest('.draggable');
    if(!card) return;
    card.draggable = !!e.target.closest('.cmp-handle');
  });
  document.addEventListener('mouseup', ()=>{
    document.querySelectorAll('.draggable').forEach(c=>{ c.draggable = true; });
  });
}

/* ── SESIONES ────────────────────────────────────────────────────────────── */
const SESSION_TYPE_LABEL = {
  action:'⚔ Acción', narrative:'📖 Narrativa', combat:'💀 Combate',
  conversation:'💬 Conv.', loot:'🎲 Loot', rest:'😴 Descanso',
  levelup:'⬆ Nivel', 'round-start':'🔄 Round', 'combat-start':'⚔ Inicio combate',
  'combat-end':'🏁 Fin combate',
};

async function renderSessionsTab(){
  const el = document.getElementById('sessions-list');
  if(!el) return;
  el.innerHTML = '<p class="muted" style="padding:1rem">Cargando sesiones…</p>';

  let sessions;
  try {
    const r = await fetch('/api/sessions');
    sessions = await r.json();
  } catch(e) {
    el.innerHTML = '<p class="muted" style="padding:1rem">Error cargando sesiones.</p>';
    return;
  }

  if(!sessions.length){
    el.innerHTML = '<p class="muted" style="padding:1rem">No hay sesiones registradas.</p>';
    return;
  }

  // Ordenar por número descendente (más reciente primero)
  sessions.sort((a,b) => b.number - a.number);

  el.innerHTML = sessions.map(s => {
    const noteCount = (s.notes||[]).length;
    const dateStr = s.date ? new Date(s.date).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}) : '—';
    const notes = (s.notes||[]);

    const notesHTML = notes.length ? notes.map(n => {
      const label = SESSION_TYPE_LABEL[n.type] || n.type || '—';
      const text = n.text ? `<span class="ses-note-text">${escapeAttr(n.text)}</span>` : '';
      return `<div class="ses-note-row"><span class="ses-note-type">${label}</span>${text}</div>`;
    }).join('') : '<p class="muted" style="font-size:0.8rem;margin:0.4rem 0">Sin notas registradas.</p>';

    return `
      <div class="ses-card">
        <div class="ses-header" onclick="this.parentElement.classList.toggle('open')">
          <span class="ses-num">S${s.number}</span>
          <span class="ses-title">${escapeAttr(s.title||'Sin título')}</span>
          <span class="ses-date">${dateStr}</span>
          <span class="ses-count">${noteCount} nota${noteCount!==1?'s':''}</span>
          <span class="ses-chevron">▾</span>
        </div>
        <div class="ses-body">${notesHTML}</div>
      </div>`;
  }).join('');
}

/* ── IDEAS ── */
function saveCampaignIdeas(){
  save('campaign_ideas', document.getElementById('campaign-ideas').value);
}

/* ── INIT ── */
function initCampaign(){
  loadCampaign();
  renderEvents();
  renderThreads();
  renderLocations();
  const ideas = load('campaign_ideas','');
  const ta = document.getElementById('campaign-ideas');
  if(ta) ta.value = ideas;
  bindDragFromHandleOnly();
}

/* ══════════════════════════════════════════════════════
   FORMAS SALVAJES DE BOYD — gestión DM
   ══════════════════════════════════════════════════════ */

function getWildShapeForms(){
  const all = CAMPAIGN.wildShapeForms || [];
  return { base: [], custom: all, all };
}

function saveWildShapeForms(){
  fetch('/api/state', {
    method:'PUT', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ wildShapeForms: CAMPAIGN.wildShapeForms || [] })
  }).catch(e => console.error('saveWildShapeForms error:', e));
}

function renderWildShapeTab(){
  const el = document.getElementById('cmp-wildshape');
  if(!el) return;
  if(!CAMPAIGN){ el.innerHTML = '<div class="muted" style="padding:1rem">Cargando...</div>'; return; }
  if(!Array.isArray(CAMPAIGN.wildShapeForms)) CAMPAIGN.wildShapeForms = [];
  const { all } = getWildShapeForms();
  const boydLvl = (typeof getCharLevel !== 'undefined') ? getCharLevel('boyd') : 2;

  function formCard(f){
    const locked = boydLvl < (f.minLevel || 2);
    const lockBadge = locked ? `<span class="ws-lock-badge">🔒 Requiere Nv ${f.minLevel}</span>` : `<span class="ws-avail-badge">✓ Disponible (Nv ${f.minLevel}+)</span>`;
    const attacksHTML = (f.attacks||[]).map(a =>
      `<div class="ws-attack-row">⚔ <strong>${a.name}</strong> +${a.bonus} · ${a.dmg} ${a.dmgType}${a.note?' <em>('+a.note+')</em>':''}</div>`
    ).join('');
    return `
      <div class="ws-card ${locked?'ws-locked':''}">
        <div class="ws-card-header">
          <span class="ws-card-name">${f.name}</span>
          <span class="ws-card-cr">CR ${f.cr}</span>
          ${lockBadge}
          <button class="ws-del-btn" onclick="deleteWildShapeForm('${f.id}')">✕</button>
        </div>
        <div class="ws-card-stats">
          <span>HP <strong>${f.hpMax}</strong></span>
          <span>CA <strong>${f.ac}</strong></span>
          <span>Vel <strong>${f.speed}</strong></span>
          <span>STR ${f.str} DEX ${f.dex} CON ${f.con}</span>
        </div>
        <div class="ws-card-attacks">${attacksHTML}</div>
        ${f.notes ? `<div class="ws-card-notes">${f.notes}</div>` : ''}
      </div>`;
  }

  el.innerHTML = `
    <p class="muted" style="font-size:0.85rem;margin-bottom:1rem">
      Formas disponibles para Boyd según su nivel. Agregá formas nuevas cuando el grupo se cruce con animales nuevos.
    </p>

    <div class="ws-grid">
      ${all.map(f => formCard(f)).join('')}
    </div>

    <div class="ws-add-form" id="ws-add-form">
      <div class="form-title" style="margin-bottom:0.75rem">+ Agregar forma nueva</div>
      <div class="form-grid-halves">
        <div class="form-row"><label>Nombre</label><input class="form-input" id="wsf-name" placeholder="ej: Oso Pardo"></div>
        <div class="form-row"><label>CR</label><input class="form-input" id="wsf-cr" placeholder="ej: 1/2"></div>
      </div>
      <div class="form-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="form-row"><label>HP máx</label><input type="number" class="form-input" id="wsf-hp" placeholder="11"></div>
        <div class="form-row"><label>CA</label><input type="number" class="form-input" id="wsf-ac" placeholder="13"></div>
        <div class="form-row"><label>Velocidad</label><input class="form-input" id="wsf-speed" placeholder="40 ft"></div>
        <div class="form-row"><label>Nv mínimo</label><input type="number" class="form-input" id="wsf-minlvl" placeholder="2" min="2" max="20"></div>
      </div>
      <div class="form-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="form-row"><label>STR</label><input type="number" class="form-input" id="wsf-str" placeholder="12"></div>
        <div class="form-row"><label>DEX</label><input type="number" class="form-input" id="wsf-dex" placeholder="15"></div>
        <div class="form-row"><label>CON</label><input type="number" class="form-input" id="wsf-con" placeholder="12"></div>
      </div>
      <div class="form-row"><label>Ataques (uno por línea: Nombre | +bono | daño | nota)</label>
        <textarea class="form-input" id="wsf-attacks" rows="3" placeholder="Mordida | +4 | 2d6+2 | DC 11 STR o cae derribado&#10;Zarpazo | +4 | 1d6+2 |"></textarea>
      </div>
      <div class="form-row"><label>Notas / habilidades especiales</label>
        <input class="form-input" id="wsf-notes" placeholder="Pack Tactics, Pounce, etc.">
      </div>
      <div class="form-btns" style="margin-top:0.5rem">
        <button class="btn-primary" onclick="addWildShapeForm()">Agregar forma</button>
      </div>
    </div>
  `;
}

function addWildShapeForm(){
  const name    = document.getElementById('wsf-name').value.trim();
  const cr      = document.getElementById('wsf-cr').value.trim();
  const hp      = parseInt(document.getElementById('wsf-hp').value) || 0;
  const ac      = parseInt(document.getElementById('wsf-ac').value) || 10;
  const speed   = document.getElementById('wsf-speed').value.trim() || '30 ft';
  const minLvl  = parseInt(document.getElementById('wsf-minlvl').value) || 2;
  const str     = parseInt(document.getElementById('wsf-str').value) || 10;
  const dex     = parseInt(document.getElementById('wsf-dex').value) || 10;
  const con     = parseInt(document.getElementById('wsf-con').value) || 10;
  const rawAtks = document.getElementById('wsf-attacks').value.trim();
  const notes   = document.getElementById('wsf-notes').value.trim();

  if(!name){ alert('Ingresá el nombre de la forma.'); return; }
  if(hp <= 0){ alert('Ingresá los HP máx.'); return; }

  const newForm = {
    id: 'custom_' + Date.now(),
    name, cr: cr || '?', minLevel: minLvl,
    hp, hpMax: hp, ac, speed,
    str, dex, con,
    attacks: rawAtks ? rawAtks.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|').map(s => s.trim());
      const bonusRaw = parts[1] || '+0';
      return {
        name:    parts[0] || 'Ataque',
        bonus:   parseInt(bonusRaw.replace('+','')) || 0,
        dmg:     parts[2] || '1',
        dmgType: 'physical',
        note:    parts[3] || ''
      };
    }) : [],
    notes
  };

  if(!CAMPAIGN.wildShapeForms) CAMPAIGN.wildShapeForms = [];
  CAMPAIGN.wildShapeForms.push(newForm);
  saveWildShapeForms();
  renderWildShapeTab();
}

function deleteWildShapeForm(id){
  if(!confirm('¿Borrar esta forma?')) return;
  CAMPAIGN.wildShapeForms = (CAMPAIGN.wildShapeForms||[]).filter(f=>f.id!==id);
  saveWildShapeForms();
  renderWildShapeTab();
}
