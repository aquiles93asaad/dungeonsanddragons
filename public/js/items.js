/* ── ITEMS: catálogo de armas y objetos ── */

let itemFilter = 'all';
let customItems = [];  // items agregados desde el form (sesión actual, no persisten — ver TODO)

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
  const open = form.style.display !== 'none';
  form.style.display = open ? 'none' : 'block';
  if(!open) clearItemForm();
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
  toggleWeaponFields();
}

function saveNewItem(){
  const name   = (document.getElementById('if-name')||{}).value.trim();
  const nameEs = (document.getElementById('if-name-es')||{}).value.trim();
  const cat    = (document.getElementById('if-category')||{}).value;
  const desc   = (document.getElementById('if-desc')||{}).value.trim();
  if(!name){ alert('Name is required.'); return; }

  const id = 'custom-' + Date.now();
  const item = { id, name, nameEs: nameEs || name, category: cat, desc };

  if(cat === 'weapon'){
    item.damage     = (document.getElementById('if-damage')||{}).value.trim();
    item.damageType = (document.getElementById('if-dmgtype')||{}).value;
    item.atkStat    = (document.getElementById('if-atkstat')||{}).value;
    item.dmgStat    = (document.getElementById('if-dmgstat')||{}).value;
    item.range      = (document.getElementById('if-range')||{}).value.trim() || 'melee';
    item.proficient = (document.getElementById('if-proficient')||{}).checked;
    const propsRaw  = (document.getElementById('if-properties')||{}).value;
    item.properties = propsRaw ? propsRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
  }

  ITEMS.push(item);
  toggleItemForm();
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

  return `
    <div class="item-card item-cat-${item.category}">
      <div class="item-card-head">
        <span class="item-name">${displayName}</span>
        <span class="item-cat-badge">${catLabel}</span>
      </div>
      ${weaponStats}
      ${item.desc ? `<div class="item-desc muted">${item.desc}</div>` : ''}
      ${carriersHTML}
    </div>`;
}

function initItems(){
  toggleWeaponFields();
  renderItemsList();
}
