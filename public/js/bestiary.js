/* ── BESTIARY: monstruos, render, CRUD, filtros, formulario ── */

let MONSTERS = [];
let activeFilter = 'all';
let expandedMonster = null;
let editingMonsterId = null;

async function loadMonsters(){
  try {
    const res = await fetch('/api/monsters');
    if(res.ok){
      const apiMonsters = await res.json();
      if(apiMonsters.length > 0){
        MONSTERS = apiMonsters;
        // Migración: agregar monstruos del PRESET que no están en la API
        let newOnes = [];
        PRESET_MONSTERS.forEach(preset => {
          if(!MONSTERS.find(m => m.id === preset.id)){
            const nm = {...preset, hpCurrent: preset.hpMax, showInLive: true};
            newOnes.push(nm);
            MONSTERS.push(nm);
          }
        });
        // Crear en API los nuevos del preset
        for(const nm of newOnes){
          fetch('/api/monsters', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(nm)}).catch(()=>{});
        }
        return;
      }
    }
  } catch(e){}
  // Fallback: localStorage o presets
  const saved = load('bestiary', null);
  if(saved && saved.length > 0){
    MONSTERS = saved;
  } else {
    MONSTERS = PRESET_MONSTERS.map(m => ({...m, hpCurrent: m.hpMax, showInLive: true}));
  }
}

function saveMonsters(){ save('bestiary', MONSTERS); }

const _hpSyncTimers = {};
function syncMonsterToAPI(m){
  if(!m) return;
  fetch('/api/monsters/'+m.id, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(m)
  }).catch(()=>{});
}
function syncMonsterHPDebounced(id){
  clearTimeout(_hpSyncTimers[id]);
  _hpSyncTimers[id] = setTimeout(()=>{
    const m = MONSTERS.find(x=>x.id===id);
    if(m) syncMonsterToAPI(m);
  }, 800);
}

function mod(score){ const m = Math.floor((score-10)/2); return (m>=0?'+':'')+m; }

function crClass(cr){
  const n = parseFloat(cr);
  if(n >= 3) return 'cr-high';
  if(n >= 1) return 'cr-mid';
  return '';
}

function renderMonsters(){
  const list = document.getElementById('monsterList');
  const search = document.getElementById('bst-search').value.toLowerCase();
  // keep header
  const header = list.querySelector('.header-row');
  list.innerHTML = '';
  list.appendChild(header);

  MONSTERS.forEach((m,i) => {
    if(activeFilter !== 'all' && m.type !== activeFilter) return;
    if(search && !m.name.toLowerCase().includes(search) && !m.type.toLowerCase().includes(search)) return;

    const isExp = expandedMonster === m.id;
    const hpPct = Math.max(0, Math.min(100, (m.hpCurrent/m.hpMax)*100));
    const barColor = hpPct <= 25 ? 'var(--red-bright)' : hpPct <= 50 ? '#e07020' : 'var(--green-bright)';

    const row = document.createElement('div');
    row.className = 'monster-row' + (isExp ? ' expanded' : '');
    row.id = 'mrow-'+m.id;
    row.onclick = () => toggleMonsterDetail(m.id);
    row.innerHTML = `
      <div><div class="m-name">${m.name}</div><div class="m-type">${m.size} ${m.type}</div></div>
      <div class="m-val">${m.ac}</div>
      <div class="m-hp-live" onclick="event.stopPropagation()">
        <button class="m-hp-btn" onclick="changeMonsterHP('${m.id}',-1)">−</button>
        <input class="m-hp-input" id="mhp-${m.id}" value="${m.hpCurrent}" onchange="setMonsterHP('${m.id}',this.value)" onclick="event.stopPropagation()">
        <span style="font-size:0.75rem;color:var(--muted)">/${m.hpMax}</span>
        <button class="m-hp-btn" onclick="changeMonsterHP('${m.id}',1)">+</button>
      </div>
      <div class="m-val" style="font-size:0.82rem;color:var(--muted)">${m.speed}</div>
      <div style="text-align:center"><span class="m-cr-badge ${crClass(m.cr)}">CR ${m.cr}</span></div>
      <div style="display:flex;gap:0.4rem;justify-content:center;align-items:center" onclick="event.stopPropagation()">
        <button class="m-live-toggle ${m.showInLive!==false?'on':''}" title="${m.showInLive!==false?'Visible en Live':'Oculto en Live'}" onclick="toggleShowInLive('${m.id}')">⚔</button>
        <button class="m-del-btn" onclick="openEditMonster('${m.id}')">✏</button>
        <button class="m-del-btn" onclick="resetMonsterHP('${m.id}')">↺</button>
        <button class="m-del-btn" onclick="deleteMonster('${m.id}')">✕</button>
      </div>
    `;
    list.appendChild(row);

    // HP bar row
    const barRow = document.createElement('div');
    barRow.style.cssText = 'height:3px;background:var(--bg4)';
    barRow.innerHTML = `<div style="height:100%;width:${hpPct}%;background:${barColor};transition:width 0.3s"></div>`;
    list.appendChild(barRow);

    // detail panel
    const detail = document.createElement('div');
    detail.className = 'monster-detail' + (isExp ? ' show' : '');
    detail.id = 'mdetail-'+m.id;
    detail.onclick = e => e.stopPropagation();

    const attacksHTML = (m.attacks||[]).map(a=>`
      <div class="atk-block">
        <div class="atk-name">${a.name}</div>
        <div class="atk-line">${a.bonus} al ataque · ${a.dmg}</div>
        ${a.note ? `<div class="atk-special">${a.note}</div>` : ''}
      </div>`).join('');

    const phasesHTML = (m.phases||[]).map(p=>`
      <div class="phase-block">
        <div class="phase-name">${p.name}</div>
        <div class="phase-desc">${p.desc}</div>
      </div>`).join('');

    // Loot table (catálogo de referencia — la tirada se hace en Sesión Live)
    const lootHTML = (m.loot && m.loot.length) ? `
      <div class="loot-block">
        <table class="loot-table">
          <thead><tr><th>Item posible</th><th>Necesitás</th><th>Cantidad</th></tr></thead>
          <tbody>
            ${m.loot.map(it=>{
              const isCrit = it.minRoll >= 20;
              const isGuaranteed = it.minRoll === 0;
              const cls = isCrit ? 'loot-crit' : (isGuaranteed ? 'loot-guaranteed' : '');
              const threshLabel = isGuaranteed ? 'Garantizado' : (isCrit ? 'NAT 20' : it.minRoll+'+');
              return `<tr class="${cls}">
                <td><div class="loot-name">${it.name}</div>${it.note?`<div class="loot-note">${it.note}</div>`:''}</td>
                <td class="loot-thresh"><strong>${threshLabel}</strong></td>
                <td class="loot-qty">${it.qty||'1'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="loot-hint">🎲 Las tiradas de loot se procesan en <strong>Sesión Live</strong> cuando el monstruo es derrotado en el combat tracker. Acá solo ves el catálogo de qué <em>puede</em> dejar.</div>
      </div>` : '';

    detail.innerHTML = `
      <div>
        <div class="md-section"><span class="md-label">Descripción</span><div class="md-body">${m.desc||'—'}</div></div>
        <div class="md-stats">
          <div class="md-stat"><span class="md-stat-name">STR</span><span class="md-stat-val">${m.str||10}</span><span class="md-stat-mod">${mod(m.str||10)}</span></div>
          <div class="md-stat"><span class="md-stat-name">DEX</span><span class="md-stat-val">${m.dex||10}</span><span class="md-stat-mod">${mod(m.dex||10)}</span></div>
          <div class="md-stat"><span class="md-stat-name">CON</span><span class="md-stat-val">${m.con||10}</span><span class="md-stat-mod">${mod(m.con||10)}</span></div>
          <div class="md-stat"><span class="md-stat-name">INT</span><span class="md-stat-val">${m.int||10}</span><span class="md-stat-mod">${mod(m.int||10)}</span></div>
          <div class="md-stat"><span class="md-stat-name">WIS</span><span class="md-stat-val">${m.wis||10}</span><span class="md-stat-mod">${mod(m.wis||10)}</span></div>
          <div class="md-stat"><span class="md-stat-name">CHA</span><span class="md-stat-val">${m.cha||10}</span><span class="md-stat-mod">${mod(m.cha||10)}</span></div>
        </div>
        <div class="md-section"><span class="md-label">Ataques</span>${attacksHTML}</div>
        ${m.abilities ? `<div class="md-section"><span class="md-label">Habilidades especiales</span><div class="md-body" style="white-space:pre-line">${m.abilities}</div></div>` : ''}
      </div>
      <div>
        ${phasesHTML ? `<div class="md-section"><span class="md-label">Fases cinematográficas</span>${phasesHTML}</div>` : ''}
        ${lootHTML ? `<div class="md-section"><span class="md-label">Loot table</span>${lootHTML}</div>` : ''}
        ${m.rewards ? `<div class="md-section"><span class="md-label">Recompensas / XP</span><div class="md-body">${m.rewards}</div></div>` : ''}
        ${m.notes ? `<div class="md-section"><span class="md-label">Notas DM</span><div class="md-body" style="color:var(--muted);font-style:italic;white-space:pre-line">${m.notes}</div></div>` : ''}
      </div>
    `;
    list.appendChild(detail);
  });
}

function toggleMonsterDetail(id){
  expandedMonster = expandedMonster === id ? null : id;
  renderMonsters();
}

/* Tira un patrón tipo "1d4", "2d6", "1d6 sp", "1d4 gp" — devuelve {value, label} */
function rollQty(pattern){
  const s = String(pattern||'1').trim();
  // Match: NdM seguido de cualquier sufijo
  const m = s.match(/^(\d+)d(\d+)(.*)$/);
  if(!m) return { value:s, label:s };
  const n = parseInt(m[1]), die = parseInt(m[2]), suffix = m[3].trim();
  let total = 0;
  for(let i=0;i<n;i++) total += Math.floor(Math.random()*die)+1;
  return { value: total, label: total + (suffix ? ' '+suffix : '') };
}


function changeMonsterHP(id, delta){
  const m = MONSTERS.find(x=>x.id===id);
  if(!m) return;
  m.hpCurrent = Math.max(0, Math.min(m.hpMax, (m.hpCurrent||m.hpMax) + delta));
  saveMonsters();
  syncMonsterHPDebounced(id);
  renderMonsters();
}

function setMonsterHP(id, val){
  const m = MONSTERS.find(x=>x.id===id);
  if(!m) return;
  m.hpCurrent = Math.max(0, Math.min(m.hpMax, parseInt(val)||0));
  saveMonsters();
  syncMonsterHPDebounced(id);
  renderMonsters();
}

function resetMonsterHP(id){
  const m = MONSTERS.find(x=>x.id===id);
  if(!m) return;
  m.hpCurrent = m.hpMax;
  saveMonsters();
  syncMonsterToAPI(m);
  renderMonsters();
}

function deleteMonster(id){
  if(!confirm('¿Eliminar esta criatura del bestiario?')) return;
  MONSTERS = MONSTERS.filter(x=>x.id!==id);
  if(expandedMonster===id) expandedMonster=null;
  saveMonsters();
  fetch('/api/monsters/'+id, {method:'DELETE'}).catch(()=>{});
  renderMonsters();
}

function filterMonsters(){renderMonsters()}

function setFilter(f){
  activeFilter=f;
  document.querySelectorAll('.bst-filter').forEach(b=>b.classList.remove('on'));
  const map={'all':'filt-all','Bestia':'filt-bestia','Monstruosidad':'filt-monstruo','Humanoide':'filt-humanoide'};
  const el=document.getElementById(map[f]);
  if(el)el.classList.add('on');
  renderMonsters();
}

function toggleShowInLive(id){
  const m = MONSTERS.find(x=>x.id===id);
  if(!m) return;
  m.showInLive = m.showInLive === false ? true : false;
  saveMonsters();
  syncMonsterToAPI(m);
  renderMonsters();
}

function toggleMonsterForm(){
  const f=document.getElementById('monsterForm');
  editingMonsterId = null;
  document.getElementById('monsterFormTitle').textContent = 'Nueva Criatura';
  f.classList.toggle('show');
  if(f.classList.contains('show')) f.scrollIntoView({behavior:'smooth',block:'start'});
}

function openEditMonster(id){
  const m = MONSTERS.find(x=>x.id===id);
  if(!m) return;
  editingMonsterId = id;
  const g = eid => document.getElementById(eid);
  g('fn-name').value   = m.name || '';
  g('fn-type').value   = m.type || 'Bestia';
  g('fn-size').value   = m.size || 'Mediano';
  g('fn-cr').value     = m.cr   || '';
  g('fn-ac').value     = m.ac   || '';
  g('fn-hp').value     = m.hpMax || '';
  g('fn-speed').value  = m.speed || '';
  g('fn-atk').value    = m.atk   || '';
  g('fn-str').value    = m.str   || '';
  g('fn-dex').value    = m.dex   || '';
  g('fn-con').value    = m.con   || '';
  g('fn-int').value    = m.int   || '';
  g('fn-wis').value    = m.wis   || '';
  g('fn-cha').value    = m.cha   || '';
  g('fn-desc').value      = m.desc      || '';
  g('fn-abilities').value = m.abilities || '';
  g('fn-notes').value     = m.notes     || '';
  g('fn-attacks').value   = (m.attacks||[]).map(a=>[a.name,a.bonus,a.dmg,a.note].filter(Boolean).join(' | ')).join('\n');
  g('fn-phases').value    = (m.phases||[]).map(p=>[p.name,p.desc].join(' | ')).join('\n');
  document.getElementById('monsterFormTitle').textContent = 'Editar Criatura';
  const f = document.getElementById('monsterForm');
  f.classList.add('show');
  f.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveNewMonster(){
  const g = id => document.getElementById(id);
  const name = g('fn-name').value.trim();
  if(!name){alert('El nombre es obligatorio.');return;}

  const rawAtks = g('fn-attacks').value.trim();
  const attacks = rawAtks ? rawAtks.split('\n').filter(Boolean).map(line=>{
    const parts = line.split('|').map(s=>s.trim());
    return {name:parts[0]||'Ataque',bonus:parts[1]||'+0',dmg:parts[2]||'—',note:parts[3]||''};
  }) : [];

  const rawPhases = g('fn-phases').value.trim();
  const phases = rawPhases ? rawPhases.split('\n').filter(Boolean).map(line=>{
    const parts = line.split('|').map(s=>s.trim());
    return {name:parts[0]||'Fase',desc:parts[1]||''};
  }) : [];

  const hpMax = parseInt(g('fn-hp').value)||10;
  const fields = {
    name,
    type: g('fn-type').value,
    size: g('fn-size').value,
    cr: g('fn-cr').value||'—',
    ac: parseInt(g('fn-ac').value)||10,
    hpMax,
    speed: g('fn-speed').value||'30 ft',
    atk: g('fn-atk').value||'+0',
    str:parseInt(g('fn-str').value)||10,
    dex:parseInt(g('fn-dex').value)||10,
    con:parseInt(g('fn-con').value)||10,
    int:parseInt(g('fn-int').value)||10,
    wis:parseInt(g('fn-wis').value)||10,
    cha:parseInt(g('fn-cha').value)||10,
    desc: g('fn-desc').value,
    attacks,
    abilities: g('fn-abilities').value,
    phases,
    notes: g('fn-notes').value,
  };

  if(editingMonsterId){
    const idx = MONSTERS.findIndex(x=>x.id===editingMonsterId);
    if(idx !== -1){
      MONSTERS[idx] = { ...MONSTERS[idx], ...fields };
      MONSTERS[idx].hpCurrent = Math.min(MONSTERS[idx].hpCurrent || hpMax, hpMax);
      syncMonsterToAPI(MONSTERS[idx]);
    }
    editingMonsterId = null;
  } else {
    const nm = { id:'custom-'+Date.now(), ...fields, hpCurrent: hpMax, showInLive: true, rewards:'' };
    MONSTERS.push(nm);
    fetch('/api/monsters', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(nm)}).catch(()=>{});
  }

  saveMonsters();
  renderMonsters();
  // Cerrar y limpiar form
  document.getElementById('monsterForm').classList.remove('show');
  document.getElementById('monsterFormTitle').textContent = 'Nueva Criatura';
  ['fn-name','fn-cr','fn-ac','fn-hp','fn-speed','fn-atk','fn-str','fn-dex','fn-con','fn-int','fn-wis','fn-cha','fn-desc','fn-attacks','fn-abilities','fn-phases','fn-notes'].forEach(id=>{g(id).value='';});
}
