/* ── NPCs: render dinámico + CRUD completo ── */

let editingNpcId = null;

function escapeNpc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function renderNPCs(){
  const grid = document.getElementById('npc-grid');
  if(!grid) return;
  grid.innerHTML = NPCS.map(n => `
    <div class="npc-card" id="npc-${n.id}" onclick="toggleNPC('${n.id}',event)">
      <div class="npc-portrait" onclick="openImageModal('npc-${n.id}');event.stopPropagation()">
        <div class="npc-portrait-ph" id="portrait-ph-npc-${n.id}"><span style="font-size:1.5rem">${n.icon||'✦'}</span></div>
        <img id="portrait-img-npc-${n.id}" src="" style="display:none">
        <div class="portrait-overlay">📷</div>
      </div>
      <div class="npc-name">${escapeNpc(n.name)}</div>
      <div class="npc-role">${escapeNpc(n.role||'')}</div>
      <span class="npc-status ${n.status||'neutral'}">${escapeNpc(n.statusLabel||n.status||'')}</span>
      <div class="npc-desc">${escapeNpc(n.desc||'')}</div>
      <div class="npc-extra">
        ${n.extra ? `<p style="font-size:0.9rem;color:var(--cream);margin-bottom:0.5rem">${escapeNpc(n.extra)}</p>` : ''}
        <div style="font-family:var(--font-title);font-size:0.65rem;color:var(--muted);letter-spacing:0.1em;margin-bottom:0.3rem">NOTAS DM</div>
        <textarea class="npc-notes-input" id="npc-${n.id}-notes" placeholder="Notas privadas..." onclick="event.stopPropagation()" oninput="saveNPCNote('${n.id}')"></textarea>
        <div class="dm-only" style="display:flex;gap:0.4rem;margin-top:0.6rem" onclick="event.stopPropagation()">
          <button class="m-del-btn" style="font-size:0.65rem;padding:0.25rem 0.7rem" onclick="openEditNPC('${n.id}')">✏ Editar</button>
          <button class="m-del-btn" onclick="deleteNPC('${n.id}')">✕</button>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleNPC(n,e){
  if(e.target.tagName==='TEXTAREA'||e.target.tagName==='BUTTON') return;
  const card=document.getElementById('npc-'+n);
  card.classList.toggle('expanded');
}

function saveNPCNote(n){
  save('npc_note_'+n,document.getElementById('npc-'+n+'-notes').value);
}

/* ── FORM ── */
function toggleNPCForm(){
  const f = document.getElementById('npcForm');
  editingNpcId = null;
  document.getElementById('npcFormTitle').textContent = 'Nuevo NPC';
  clearNPCForm();
  f.classList.toggle('show');
  if(f.classList.contains('show')) f.scrollIntoView({behavior:'smooth',block:'start'});
}

function clearNPCForm(){
  ['nf-name','nf-icon','nf-faction','nf-role','nf-status-label','nf-desc','nf-extra'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value = '';
  });
  const s = document.getElementById('nf-status'); if(s) s.value = 'neutral';
}

function openEditNPC(id){
  const n = NPCS.find(x=>x.id===id);
  if(!n) return;
  editingNpcId = id;
  const g = eid => document.getElementById(eid);
  g('nf-name').value         = n.name        || '';
  g('nf-icon').value         = n.icon        || '';
  g('nf-faction').value      = n.faction     || '';
  g('nf-role').value         = n.role        || '';
  g('nf-status').value       = n.status      || 'neutral';
  g('nf-status-label').value = n.statusLabel || '';
  g('nf-desc').value         = n.desc        || '';
  g('nf-extra').value        = n.extra       || '';
  document.getElementById('npcFormTitle').textContent = 'Editar NPC';
  const f = document.getElementById('npcForm');
  f.classList.add('show');
  f.scrollIntoView({behavior:'smooth',block:'start'});
}

function saveNPCForm(){
  const g = id => document.getElementById(id);
  const name = g('nf-name').value.trim();
  if(!name){ alert('El nombre es obligatorio.'); return; }

  const fields = {
    name,
    icon:        g('nf-icon').value.trim()         || '✦',
    faction:     g('nf-faction').value.trim(),
    role:        g('nf-role').value.trim(),
    status:      g('nf-status').value,
    statusLabel: g('nf-status-label').value.trim(),
    desc:        g('nf-desc').value.trim(),
    extra:       g('nf-extra').value.trim(),
  };

  if(editingNpcId){
    const idx = NPCS.findIndex(x=>x.id===editingNpcId);
    if(idx !== -1){
      NPCS[idx] = { ...NPCS[idx], ...fields };
      fetch('/api/npcs/'+editingNpcId, {
        method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(NPCS[idx])
      }).catch(()=>{});
    }
    editingNpcId = null;
  } else {
    const newNpc = { id:'npc-custom-'+Date.now(), ...fields };
    NPCS.push(newNpc);
    fetch('/api/npcs', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newNpc)
    }).catch(()=>{});
  }

  document.getElementById('npcForm').classList.remove('show');
  document.getElementById('npcFormTitle').textContent = 'Nuevo NPC';
  clearNPCForm();
  renderNPCs();
}

function deleteNPC(id){
  if(!confirm('¿Eliminar este NPC?')) return;
  NPCS = NPCS.filter(x=>x.id!==id);
  fetch('/api/npcs/'+id, {method:'DELETE'}).catch(()=>{});
  renderNPCs();
}
