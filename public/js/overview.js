/* ── OVERVIEW: tarjetas de estado del grupo en la página inicial ── */

async function renderOverviewSituation(){
  const el = document.getElementById('overview-situation');
  if(!el) return;

  try {
    const res  = await fetch('/api/story');
    const data = await res.json();
    const acts = (data.acts || []).sort((a,b) => {
      if(b.chapter !== a.chapter) return b.chapter - a.chapter;
      return b.order - a.order;
    });
    const act = acts[0];
    if(!act){ el.innerHTML = '<p class="muted">Sin historia cargada aún.</p>'; return; }

    const preview = (act.body || []).map(p => `<p style="font-size:0.9rem;color:var(--cream);line-height:1.6;margin-bottom:0.5rem">${p}</p>`).join('');

    el.innerHTML = `
      <div class="card card-gold">
        <div style="font-family:var(--font-title);font-size:0.65rem;letter-spacing:0.1em;color:var(--gold-dim);margin-bottom:0.4rem">CAPÍTULO ${act.chapter}</div>
        <div style="font-family:var(--font-title);font-size:1rem;color:var(--gold);margin-bottom:0.5rem">${act.title}</div>
        ${preview}
        ${act.highlight ? `<div style="font-size:0.85rem;color:var(--gold-dim);font-style:italic;margin-top:0.5rem;border-left:2px solid var(--gold-dim);padding-left:0.6rem">${act.highlight}</div>` : ''}
      </div>`;
  } catch(e) {
    el.innerHTML = '<p class="muted">Error al cargar la historia.</p>';
  }
}

function updateOverview(){
  const grid=document.getElementById('overview-grid');
  if(!grid)return;
  grid.innerHTML='';
  const labels={}; CHARS.forEach(c=>{ const preset=CLASS_PRESETS[c]||{}; const lvl=getCharLevel(c); labels[c]=(preset.className||c)+' Nv'+lvl; });
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
