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
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  window.CHAR_STATE[c].hp = val;
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
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  window.CHAR_STATE[c].conditions = active;
  save('cond_'+c, active);
}

/* ── INVENTORY ── */
function renderInventory(c){
  const cs = window.CHAR_STATE && window.CHAR_STATE[c];
  const items = (cs && cs.inventory) ? cs.inventory : (DEFAULT_INVENTORY[c]||[]);
  const ul=document.getElementById(c+'-inventory');
  if(!ul)return;
  ul.innerHTML='';
  items.forEach((item,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>⬡</span><span style="flex:1">${item}</span><button class="inv-del" onclick="delItem('${c}',${i})" title="Eliminar">✕</button>`;
    ul.appendChild(li);
  });
}

function _getInventory(c){
  const cs = window.CHAR_STATE && window.CHAR_STATE[c];
  return (cs && cs.inventory) ? [...cs.inventory] : [...(DEFAULT_INVENTORY[c]||[])];
}

function _setInventory(c, items){
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  window.CHAR_STATE[c].inventory = items;
  save('inv_'+c, items);
}

function addItem(c){
  const inp=document.getElementById(c+'-inv-input');
  const val=inp.value.trim();
  if(!val)return;
  const items=_getInventory(c);
  items.push(val);
  _setInventory(c, items);
  inp.value='';
  renderInventory(c);
}

function delItem(c,i){
  const items=_getInventory(c);
  items.splice(i,1);
  _setInventory(c, items);
  renderInventory(c);
}

/* ── NOTES ── */
function saveNotes(c){
  const val = document.getElementById(c+'-notes').value;
  if(!window.CHAR_STATE) window.CHAR_STATE = {};
  if(!window.CHAR_STATE[c]) window.CHAR_STATE[c] = {};
  window.CHAR_STATE[c].notes = val;
  save('notes_'+c, val);
}
