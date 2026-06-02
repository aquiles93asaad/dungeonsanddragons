/* ── MONEDERO: personal por personaje + monedero del grupo ──
   Denominaciones D&D 5E: cp (cobre) · sp (plata) · ep (electrum) · gp (oro) · pp (platino)
   Por defecto usamos 4: cp, sp, gp, pp (electrum es raro, lo omito para no saturar).
*/

const COIN_TYPES = [
  { key:'cp', label:'CP', name:'Cobre',  color:'#b87333' },
  { key:'sp', label:'SP', name:'Plata',  color:'#c0c0c0' },
  { key:'gp', label:'GP', name:'Oro',    color:'#d4af37' },
  { key:'pp', label:'PP', name:'Platino',color:'#a0a8b0' }
];

/* Defaults — sólo se aplican si no hay nada guardado todavía */
const MONEY_DEFAULTS = {
  group: { cp:0, sp:2, gp:0, pp:0 },  // Los 2 sp narrativos del grupo
  rac:   { cp:0, sp:0, gp:0, pp:0 },
  relyo: { cp:0, sp:0, gp:0, pp:0 },
  tyrell:{ cp:0, sp:0, gp:0, pp:0 },
  boyd:  { cp:0, sp:0, gp:0, pp:0 },
  esdas: { cp:0, sp:0, gp:0, pp:0 }
};

function getMoney(owner){
  const def = MONEY_DEFAULTS[owner] || { cp:0, sp:0, gp:0, pp:0 };
  const stored = load('money_'+owner, null);
  if(stored && typeof stored === 'object') return { ...def, ...stored };
  return { ...def };
}

function setMoneyCoin(owner, key, value){
  const m = getMoney(owner);
  m[key] = Math.max(0, parseInt(value)||0);
  save('money_'+owner, m);
  renderMoney(owner);
  if(owner === 'group') updateOverview(); // refrescar overview si cambió el del grupo
}

function changeMoneyCoin(owner, key, delta){
  const m = getMoney(owner);
  m[key] = Math.max(0, (parseInt(m[key])||0) + delta);
  save('money_'+owner, m);
  renderMoney(owner);
  if(owner === 'group') updateOverview();
}

/* Total convertido a SP para una idea rápida del valor */
function getMoneyTotalSP(owner){
  const m = getMoney(owner);
  return (m.cp/10) + m.sp + (m.gp*10) + (m.pp*100);
}

function renderMoney(owner){
  const el = document.getElementById('money-'+owner);
  if(!el) return;
  const m = getMoney(owner);
  const totalSP = getMoneyTotalSP(owner);
  const totalLabel = totalSP >= 100 ? (totalSP/10).toFixed(1)+' gp' : totalSP.toFixed(1)+' sp';
  el.innerHTML = `
    <div class="money-row">
      ${COIN_TYPES.map(t => `
        <div class="money-coin coin-${t.key}">
          <span class="coin-label" style="color:${t.color}">${t.label}</span>
          <div class="coin-controls">
            <button class="coin-btn dm-only" onclick="changeMoneyCoin('${owner}','${t.key}',-1)">−</button>
            <input class="coin-val" type="number" min="0" value="${m[t.key]||0}" onchange="setMoneyCoin('${owner}','${t.key}',this.value)">
            <button class="coin-btn dm-only" onclick="changeMoneyCoin('${owner}','${t.key}',1)">+</button>
          </div>
        </div>
      `).join('')}
      <div class="money-total" title="Equivalencia: 10cp=1sp · 10sp=1gp · 10gp=1pp">
        Total: <strong>${totalLabel}</strong>
      </div>
    </div>
  `;
}

function renderAllMoney(){
  ['group', ...CHARS].forEach(renderMoney);
}
