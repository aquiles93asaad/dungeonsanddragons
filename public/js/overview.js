/* ── OVERVIEW: tarjetas de estado del grupo en la página inicial ── */

function renderOverviewSituation(){
  const el = document.getElementById('overview-situation');
  if(!el) return;
  const doneEvents = (DEFAULT_CAMPAIGN_EVENTS||[]).filter(e=>e.status==='done');
  if(!doneEvents.length){ el.innerHTML = '<p class="muted">Sin eventos completados aún.</p>'; return; }

  const savedId = load('overview_event_id', null);
  const event = doneEvents.find(e=>e.id===savedId) || doneEvents[doneEvents.length-1];

  const dmPicker = window.DM_MODE ? `
    <div class="dm-only" style="margin-top:0.8rem">
      <select id="overview-event-select" onchange="setOverviewEvent(this.value)"
        style="background:var(--bg3);border:1px solid var(--border2);color:var(--cream);font-family:var(--font-body);font-size:0.85rem;padding:0.3rem 0.5rem;width:100%">
        ${doneEvents.map(e=>`<option value="${e.id}" ${e.id===event.id?'selected':''}>${e.title}${e.session?' — S'+e.session:''}</option>`).join('')}
      </select>
    </div>` : '';

  el.innerHTML = `
    <div class="card card-gold">
      <div style="font-family:var(--font-title);font-size:0.65rem;letter-spacing:0.1em;color:var(--gold-dim);margin-bottom:0.4rem">ÚLTIMO EVENTO — S${event.session||'?'}</div>
      <div style="font-family:var(--font-title);font-size:1rem;color:var(--gold);margin-bottom:0.5rem">${event.title}</div>
      <p style="font-size:0.9rem;color:var(--cream);line-height:1.6">${event.description||''}</p>
      ${dmPicker}
    </div>`;
}

function setOverviewEvent(id){
  save('overview_event_id', id);
  renderOverviewSituation();
}

function updateOverview(){
  const grid=document.getElementById('overview-grid');
  if(!grid)return;
  grid.innerHTML='';
  const labels={rac:'Bárbaro Nv2',relyo:'Monje Nv2',tyrell:'Paladín Nv2',boyd:'Druida Nv2',esdas:'Wizard Nv2'};
  const icons={rac:'🪓',relyo:'🥋',tyrell:'🛡',boyd:'🌿',esdas:'🔥'};
  CHARS.forEach(c=>{
    const hp=load('hp_'+c,getHPMax(c));
    const max=getHPMax(c);
    const pct=Math.round((hp/max)*100);
    const barColor=pct<=25?'var(--red-bright)':pct<=50?'#e07020':'var(--green-bright)';
    const div=document.createElement('div');
    div.className='overview-card';
    div.onclick=()=>showChar(c);
    div.innerHTML=`<div class="ov-name">${icons[c]} ${c.charAt(0).toUpperCase()+c.slice(1)}</div><div class="ov-class">${labels[c]}</div><div class="ov-hp-bar"><div class="ov-hp-fill" style="width:${pct}%;background:${barColor}"></div></div><div class="ov-hp-text">HP: ${hp} / ${max}</div>`;
    grid.appendChild(div);
  });
}
