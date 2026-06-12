/* ── ITEMS: catálogo de armas y objetos ── */

let itemFilter = 'all';
let editingItemId = null;

function setItemFilter(cat){
  itemFilter = cat;
  document.querySelectorAll('.items-filter').forEach(b => b.classList.remove('on'));
  const btn = document.getElementById('items-filt-' + (cat === 'all' ? 'all' : cat));
  if(btn) btn.classList.add('on');
  renderItemsList();
}

function filterItems(){
  renderItemsList();
}

function toggleItemForm(){
  const form = document.getElementById('itemForm');
  if(!form) return;
  editingItemId = null;
  document.getElementById('itemFormTitle').textContent = 'Nuevo Item';
  const open = form.classList.contains('show');
  form.classList.toggle('show', !open);
  if(!open){ clearItemForm(); form.scrollIntoView({behavior:'smooth',block:'start'}); }
}

function toggleWeaponFields(){
  const cat = (document.getElementById('if-category')||{}).value;
  const wf = document.getElementById('if-weapon-fields');
  if(wf) wf.style.display = cat === 'weapon' ? 'block' : 'none';
}

function clearItemForm(){
  ['if-name','if-name-es','if-damage','if-range','if-properties','if-desc'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const cat = document.getElementById('if-category'); if(cat) cat.value = 'weapon';
  const dt  = document.getElementById('if-dmgtype');  if(dt)  dt.value  = 'slashing';
  const as  = document.getElementById('if-atkstat');  if(as)  as.value  = 'str';
  const ds  = document.getElementById('if-dmgstat');  if(ds)  ds.value  = 'str';
  const pr  = document.getElementById('if-proficient'); if(pr) pr.checked = true;
  const kn  = document.getElementById('if-known');    if(kn)  kn.checked = false;
  toggleWeaponFields();
}

function openEditItem(id){
  const item = ITEMS.find(x=>x.id===id);
  if(!item) return;
  editingItemId = id;
  const g = eid => document.getElementById(eid);
  g('if-name').value    = item.name    || '';
  g('if-name-es').value = item.nameEs  || '';
  g('if-category').value = item.category || 'weapon';
  g('if-desc').value    = item.desc    || '';
  g('if-known').checked = !!item.known;
  toggleWeaponFields();
  if(item.category === 'weapon'){
    g('if-damage').value    = item.damage     || '';
    g('if-dmgtype').value   = item.damageType || 'slashing';
    g('if-atkstat').value   = item.atkStat    || 'str';
    g('if-dmgstat').value   = item.dmgStat    || 'str';
    g('if-range').value     = item.range      || '';
    g('if-proficient').checked = item.proficient !== false;
    g('if-properties').value = (item.properties||[]).join(', ');
  }
  document.getElementById('itemFormTitle').textContent = 'Editar Item';
  const form = document.getElementById('itemForm');
  form.classList.add('show');
  form.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveNewItem(){
  const name   = (document.getElementById('if-name')||{}).value.trim();
  const nameEs = (document.getElementById('if-name-es')||{}).value.trim();
  const cat    = (document.getElementById('if-category')||{}).value;
  const desc   = (document.getElementById('if-desc')||{}).value.trim();
  const known  = !!(document.getElementById('if-known')||{}).checked;
  if(!name){ alert('El nombre es obligatorio.'); return; }

  const fields = { name, nameEs: nameEs || name, category: cat, desc, known };

  if(cat === 'weapon'){
    fields.damage     = (document.getElementById('if-damage')||{}).value.trim();
    fields.damageType = (document.getElementById('if-dmgtype')||{}).value;
    fields.atkStat    = (document.getElementById('if-atkstat')||{}).value;
    fields.dmgStat    = (document.getElementById('if-dmgstat')||{}).value;
    fields.range      = (document.getElementById('if-range')||{}).value.trim() || 'melee';
    fields.proficient = (document.getElementById('if-proficient')||{}).checked;
    const propsRaw    = (document.getElementById('if-properties')||{}).value;
    fields.properties = propsRaw ? propsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  }

  if(editingItemId){
    const idx = ITEMS.findIndex(x=>x.id===editingItemId);
    if(idx !== -1){
      ITEMS[idx] = { ...ITEMS[idx], ...fields };
      fetch('/api/items/'+editingItemId, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(ITEMS[idx])
      }).catch(()=>{});
    }
    editingItemId = null;
  } else {
    const newItem = { id:'custom-'+Date.now(), ...fields };
    ITEMS.push(newItem);
    fetch('/api/items', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newItem)
    }).catch(()=>{});
  }

  const form = document.getElementById('itemForm');
  form.classList.remove('show');
  document.getElementById('itemFormTitle').textContent = 'Nuevo Item';
  clearItemForm();
  renderItemsList();
}

function deleteItem(id){
  if(!confirm('¿Eliminar este item?')) return;
  ITEMS = ITEMS.filter(x=>x.id!==id);
  fetch('/api/items/'+id, {method:'DELETE'}).catch(()=>{});
  renderItemsList();
}

function toggleItemKnown(id){
  const item = ITEMS.find(x=>x.id===id);
  if(!item) return;
  item.known = !item.known;
  fetch('/api/items/'+id, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(item)
  }).catch(()=>{});
  renderItemsList();
}

const CATEGORY_LABELS = {
  weapon:'Weapon', magic:'Magic', loot:'Loot', quest:'Quest', misc:'Misc'
};

function renderItemsList(){
  const container = document.getElementById('items-list');
  if(!container) return;
  const query = ((document.getElementById('items-search')||{}).value || '').toLowerCase();

  const filtered = ITEMS.filter(item => {
    if(itemFilter !== 'all' && item.category !== itemFilter) return false;
    if(query && !item.name.toLowerCase().includes(query) &&
       !(item.nameEs||'').toLowerCase().includes(query) &&
       !(item.desc||'').toLowerCase().includes(query)) return false;
    return true;
  });

  if(!filtered.length){
    container.innerHTML = '<div class="items-empty muted">No items match.</div>';
    return;
  }

  const groups = {};
  filtered.forEach(item => {
    const cat = item.category || 'misc';
    if(!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });

  const catOrder = ['weapon','magic','loot','quest','misc'];
  let html = '';
  catOrder.forEach(cat => {
    if(!groups[cat]) return;
    html += `<div class="items-group">
      <div class="items-group-title">${CATEGORY_LABELS[cat] || cat}</div>
      <div class="items-grid">
        ${groups[cat].map(renderItemCard).join('')}
      </div>
    </div>`;
  });

  container.innerHTML = html;
}

function renderItemCard(item){
  const catLabel = CATEGORY_LABELS[item.category] || item.category;
  const isWeapon = item.category === 'weapon';

  const weaponStats = isWeapon ? `
    <div class="item-stats">
      ${item.damage     ? `<span class="item-stat-pill item-dice">${item.damage}</span>` : ''}
      ${item.damageType ? `<span class="item-stat-pill item-dmgtype">${item.damageType.charAt(0).toUpperCase()+item.damageType.slice(1)}</span>` : ''}
      ${item.atkStat    ? `<span class="item-stat-pill item-stat">${item.atkStat.toUpperCase()}</span>` : ''}
      ${item.range && item.range !== 'melee' ? `<span class="item-stat-pill item-range">${item.range}</span>` : ''}
      ${(item.properties||[]).map(p=>`<span class="item-stat-pill item-prop">${p}</span>`).join('')}
    </div>` : '';

  const carriers = CHARS.filter(c => {
    const preset = CLASS_PRESETS[c];
    if(!preset || !preset.equipment) return false;
    return preset.equipment.some(e => e.itemId === item.id && e.equipped);
  });
  const carriersHTML = carriers.length
    ? `<div class="item-carriers">${carriers.map(c=>`<span class="item-carrier-badge">${c.charAt(0).toUpperCase()+c.slice(1)}</span>`).join('')}</div>`
    : '';

  const displayName = item.nameEs && item.nameEs !== item.name
    ? `${item.nameEs} <span class="item-name-en muted">/ ${item.name}</span>`
    : item.name;

  const knownBadge = `<span class="item-known-badge dm-only" title="${item.known?'Visible para jugadores':'Oculto para jugadores'}" onclick="toggleItemKnown('${item.id}')" style="cursor:pointer;font-size:0.65rem;padding:0.1rem 0.4rem;border:1px solid;${item.known?'border-color:var(--green-bright);color:var(--green-bright)':'border-color:var(--border2);color:var(--muted)'}">${item.known?'✓ Visible':'Oculto'}</span>`;

  const dmActions = `<div class="dm-only" style="display:flex;gap:0.4rem;margin-top:0.5rem;align-items:center">
    ${knownBadge}
    <button class="m-del-btn" style="font-size:0.6rem;padding:0.2rem 0.5rem" onclick="openEditItem('${item.id}')">✏</button>
    <button class="m-del-btn" style="font-size:0.6rem;padding:0.2rem 0.5rem" onclick="deleteItem('${item.id}')">✕</button>
  </div>`;

  return `
    <div class="item-card item-cat-${item.category}">
      <div class="item-card-head">
        <span class="item-name">${displayName}</span>
        <span class="item-cat-badge">${catLabel}</span>
      </div>
      ${weaponStats}
      ${item.desc ? `<div class="item-desc muted">${item.desc}</div>` : ''}
      ${carriersHTML}
      ${dmActions}
    </div>`;
}

function initItems(){
  toggleWeaponFields();
  renderItemsList();
}
