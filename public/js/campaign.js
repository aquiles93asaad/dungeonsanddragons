/* ── CAMPAIGN: hilos narrativos, eventos reordenables, lugares, ideas ── */

let CAMPAIGN = { events: [], threads: [], locations: [] };
let currentCampaignTab = 'events';

// ── Helpers para persistir a MongoDB ──────────────────────────────────────
const _apiDebounce = {};
function _campaignPut(path, data, immediate){
  if(immediate){
    fetch(path, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
      .catch(e => console.error('Campaign PUT error:', e.message));
  } else {
    clearTimeout(_apiDebounce[path]);
    _apiDebounce[path] = setTimeout(() => {
      fetch(path, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
        .catch(e => console.error('Campaign PUT error:', e.message));
    }, 600);
  }
}
function _campaignPost(path, data){
  return fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    .catch(e => console.error('Campaign POST error:', e.message));
}
function _campaignDelete(path){
  fetch(path, { method:'DELETE' }).catch(e => console.error('Campaign DELETE error:', e.message));
}

function loadCampaign(){
  // La fuente de verdad es MongoDB — DEFAULT_CAMPAIGN_* ya fue cargado desde la API en init.js
  CAMPAIGN = {
    events:    JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_EVENTS)),
    threads:   JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_THREADS)),
    locations: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_LOCATIONS))
  };
}

// No-op — se mantiene por compatibilidad, las mutaciones llaman a la API directamente
function saveCampaign(){}

function escapeAttr(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function switchCampaignTab(tab){
  currentCampaignTab = tab;
  document.querySelectorAll('.campaign-tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.campaign-tab-content').forEach(c=>c.classList.remove('active'));
  const el = document.getElementById('cmp-'+tab);
  if(el) el.classList.add('active');
}

/* ── EVENTOS ── */
function renderEvents(){
  const list = document.getElementById('event-list');
  if(!list) return;
  list.innerHTML = '';
  CAMPAIGN.events.forEach(e=>{
    const card = document.createElement('div');
    card.className = 'cmp-card event-card draggable';
    card.dataset.id = e.id;
    card.draggable = true;
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <div class="cmp-row1">
          <input class="cmp-title" value="${escapeAttr(e.title)}" oninput="updateEvent('${e.id}','title',this.value)" placeholder="Título del evento">
          <select class="cmp-status status-${e.status}" onchange="updateEvent('${e.id}','status',this.value)">
            <option value="done" ${e.status==='done'?'selected':''}>Hecho</option>
            <option value="in-progress" ${e.status==='in-progress'?'selected':''}>En curso</option>
            <option value="planned" ${e.status==='planned'?'selected':''}>Planificado</option>
            <option value="idea" ${e.status==='idea'?'selected':''}>Idea</option>
          </select>
          <input class="cmp-session" value="${escapeAttr(e.session)}" oninput="updateEvent('${e.id}','session',this.value)" placeholder="Ses.">
        </div>
        <textarea class="cmp-desc" oninput="updateEvent('${e.id}','description',this.value)" placeholder="Descripción del evento...">${escapeAttr(e.description||'')}</textarea>
      </div>
      <div class="cmp-controls">
        <button class="cmp-btn" onclick="moveItem('events','${e.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('events','${e.id}',1)" title="Bajar">↓</button>
        <button class="cmp-btn cmp-del" onclick="deleteItem('events','${e.id}')" title="Eliminar">✕</button>
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'events');
}

function updateEvent(id, field, value){
  const e = CAMPAIGN.events.find(x=>x.id===id);
  if(!e) return;
  e[field] = value;
  _campaignPut(`/api/events/${id}`, {[field]:value}, field==='status'||field==='session');
  if(field==='status'){
    const card = document.querySelector(`.event-card[data-id="${id}"]`);
    if(card){
      const sel = card.querySelector('.cmp-status');
      sel.className = 'cmp-status status-'+value;
    }
  }
}

function addCampaignEvent(){
  const newEvent = { id:'evt-'+Date.now(), title:'Nuevo evento', description:'', status:'idea', session:'' };
  CAMPAIGN.events.push(newEvent);
  _campaignPost('/api/events', newEvent);
  renderEvents();
}

/* ── HILOS ── */
function renderThreads(){
  const list = document.getElementById('thread-list');
  if(!list) return;
  list.innerHTML = '';
  CAMPAIGN.threads.forEach(t=>{
    const card = document.createElement('div');
    card.className = 'cmp-card thread-card draggable';
    card.dataset.id = t.id;
    card.draggable = true;
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <div class="cmp-row1 thread-row">
          <input class="cmp-title" value="${escapeAttr(t.name)}" oninput="updateThread('${t.id}','name',this.value)" placeholder="Nombre del hilo">
          <select class="cmp-status status-${t.status}" onchange="updateThread('${t.id}','status',this.value)">
            <option value="active" ${t.status==='active'?'selected':''}>Activo</option>
            <option value="emerging" ${t.status==='emerging'?'selected':''}>Emergiendo</option>
            <option value="dormant" ${t.status==='dormant'?'selected':''}>Dormido</option>
            <option value="resolved" ${t.status==='resolved'?'selected':''}>Resuelto</option>
          </select>
        </div>
        <textarea class="cmp-desc" oninput="updateThread('${t.id}','description',this.value)" placeholder="Descripción del hilo narrativo...">${escapeAttr(t.description||'')}</textarea>
        <input class="cmp-meta" value="${escapeAttr((t.characters||[]).join(', '))}" oninput="updateThreadChars('${t.id}',this.value)" placeholder="Personajes involucrados (separados por coma)">
      </div>
      <div class="cmp-controls">
        <button class="cmp-btn" onclick="moveItem('threads','${t.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('threads','${t.id}',1)" title="Bajar">↓</button>
        <button class="cmp-btn cmp-del" onclick="deleteItem('threads','${t.id}')" title="Eliminar">✕</button>
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'threads');
}

function updateThread(id, field, value){
  const t = CAMPAIGN.threads.find(x=>x.id===id);
  if(!t) return;
  t[field] = value;
  _campaignPut(`/api/threads/${id}`, {[field]:value}, field==='status');
  if(field==='status'){
    const card = document.querySelector(`.thread-card[data-id="${id}"]`);
    if(card){
      const sel = card.querySelector('.cmp-status');
      sel.className = 'cmp-status status-'+value;
    }
  }
}

function updateThreadChars(id, value){
  const t = CAMPAIGN.threads.find(x=>x.id===id);
  if(!t) return;
  t.characters = value.split(',').map(s=>s.trim()).filter(Boolean);
  _campaignPut(`/api/threads/${id}`, {characters:t.characters});
}

function addCampaignThread(){
  const newThread = { id:'thread-'+Date.now(), name:'Nuevo hilo', status:'active', description:'', characters:[] };
  CAMPAIGN.threads.push(newThread);
  _campaignPost('/api/threads', newThread);
  renderThreads();
}

/* ── LUGARES ── */
function renderLocations(){
  const list = document.getElementById('location-list');
  if(!list) return;
  list.innerHTML = '';
  CAMPAIGN.locations.forEach(l=>{
    const card = document.createElement('div');
    card.className = 'cmp-card location-card draggable';
    card.dataset.id = l.id;
    card.draggable = true;
    card.innerHTML = `
      <div class="cmp-handle" title="Arrastrar para reordenar">≡</div>
      <div class="cmp-body">
        <input class="cmp-title" value="${escapeAttr(l.name)}" oninput="updateLocation('${l.id}','name',this.value)" placeholder="Nombre del lugar">
        <textarea class="cmp-desc" oninput="updateLocation('${l.id}','description',this.value)" placeholder="Descripción del lugar...">${escapeAttr(l.description||'')}</textarea>
        <input class="cmp-meta" value="${escapeAttr(l.state||'')}" oninput="updateLocation('${l.id}','state',this.value)" placeholder="Estado actual / quiénes están ahí">
      </div>
      <div class="cmp-controls">
        <button class="cmp-btn" onclick="moveItem('locations','${l.id}',-1)" title="Subir">↑</button>
        <button class="cmp-btn" onclick="moveItem('locations','${l.id}',1)" title="Bajar">↓</button>
        <button class="cmp-btn cmp-del" onclick="deleteItem('locations','${l.id}')" title="Eliminar">✕</button>
      </div>
    `;
    list.appendChild(card);
  });
  attachDragHandlers(list, 'locations');
}

function updateLocation(id, field, value){
  const l = CAMPAIGN.locations.find(x=>x.id===id);
  if(!l) return;
  l[field] = value;
  _campaignPut(`/api/locations/${id}`, {[field]:value});
}

function addCampaignLocation(){
  const newLoc = { id:'loc-'+Date.now(), name:'Nuevo lugar', description:'', state:'' };
  CAMPAIGN.locations.push(newLoc);
  _campaignPost('/api/locations', newLoc);
  renderLocations();
}

/* ── COMUNES: mover / eliminar / drag&drop ── */
function moveItem(kind, id, delta){
  const arr = CAMPAIGN[kind];
  const idx = arr.findIndex(x=>x.id===id);
  const newIdx = idx + delta;
  if(idx<0 || newIdx<0 || newIdx>=arr.length) return;
  const [item] = arr.splice(idx,1);
  arr.splice(newIdx,0,item);
  // Orden local — no hay campo order en el schema, se resetea al recargar
  if(kind==='events') renderEvents();
  else if(kind==='threads') renderThreads();
  else if(kind==='locations') renderLocations();
}

function deleteItem(kind, id){
  if(!confirm('¿Eliminar este elemento?')) return;
  CAMPAIGN[kind] = CAMPAIGN[kind].filter(x=>x.id!==id);
  const apiPaths = { events:'/api/events', threads:'/api/threads', locations:'/api/locations' };
  _campaignDelete(apiPaths[kind]+'/'+id);
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
      // Orden local — no hay campo order en el schema, se resetea al recargar
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

/* Evitar que al arrastrar inputs/textareas dentro del card inicie el drag del card */
function bindDragFromHandleOnly(){
  document.addEventListener('mousedown', e=>{
    const card = e.target.closest('.draggable');
    if(!card) return;
    const fromHandle = e.target.closest('.cmp-handle');
    card.draggable = !!fromHandle;
  });
  document.addEventListener('mouseup', e=>{
    document.querySelectorAll('.draggable').forEach(c=>{ c.draggable = true; });
  });
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
