/* ── OVERVIEW: tarjetas de estado del grupo en la página inicial ── */

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
