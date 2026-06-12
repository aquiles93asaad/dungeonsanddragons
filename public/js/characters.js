/* ── CHARACTERS: HP, condiciones, inventario, notas ── */

/* ── HP ── */
function updateHP(c){
  const max=getHPMax(c);
  let val=parseInt(document.getElementById(c+'-hp').value)||0;
  val=Math.max(0,Math.min(max,val));
  document.getElementById(c+'-hp').value=val;
  const maxSpan=document.getElementById(c+'-hp-max');
  if(maxSpan) maxSpan.textContent=max;
  const inp=document.getElementById(c+'-hp');
  if(inp) inp.max=max;
  const pct=(val/max)*100;
  const bar=document.getElementById(c+'-hp-bar');
  bar.style.width=pct+'%';
  bar.className='hp-bar'+(pct<=25?' crit':pct<=50?' low':'');
  save('hp_'+c,val);
  updateOverview();
  if (window.DM_MODE && window._socket) window._socket.emit('hp:update', { charId: c, hp: val });
}

function changeVital(c,type,delta){
  const inp=document.getElementById(c+'-'+type);
  inp.value=parseInt(inp.value||0)+delta;
  if(type==='hp') updateHP(c);
}

/* ── CONDITIONS ── */
function toggleCondition(c,cond){
  const btns=document.querySelectorAll('#'+c+'-conditions .condition-btn');
  btns.forEach(btn=>{
    if(btn.textContent===cond) btn.classList.toggle('active');
  });
  const active=[];
  btns.forEach(btn=>{if(btn.classList.contains('active'))active.push(btn.textContent)});
  save('cond_'+c,active);
}

/* ── INVENTORY ── */
function renderInventory(c){
  const items=load('inv_'+c,DEFAULT_INVENTORY[c]||[]);
  const ul=document.getElementById(c+'-inventory');
  if(!ul)return;
  ul.innerHTML='';
  items.forEach((item,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>⬡</span><span style="flex:1">${item}</span><button class="inv-del" onclick="delItem('${c}',${i})" title="Eliminar">✕</button>`;
    ul.appendChild(li);
  });
}

function addItem(c){
  const inp=document.getElementById(c+'-inv-input');
  const val=inp.value.trim();
  if(!val)return;
  const items=load('inv_'+c,DEFAULT_INVENTORY[c]||[]);
  items.push(val);
  save('inv_'+c,items);
  inp.value='';
  renderInventory(c);
}

function delItem(c,i){
  const items=load('inv_'+c,DEFAULT_INVENTORY[c]||[]);
  items.splice(i,1);
  save('inv_'+c,items);
  renderInventory(c);
}

/* ── NOTES ── */
function saveNotes(c){
  save('notes_'+c,document.getElementById(c+'-notes').value);
}
