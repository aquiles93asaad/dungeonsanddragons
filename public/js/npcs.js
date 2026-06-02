/* ── NPCs: render dinámico desde NPCS array + expand + notas DM ── */

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
