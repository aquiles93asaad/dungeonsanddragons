/* ── STORAGE: localStorage helpers + indicador "Guardado" ── */

function save(key,val){try{localStorage.setItem('ard_'+key,JSON.stringify(val));showSaved()}catch(e){}}
function load(key,def){try{const v=localStorage.getItem('ard_'+key);return v?JSON.parse(v):def}catch(e){return def}}

function showSaved(){
  const el=document.getElementById('saveIndicator');
  el.classList.add('show');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),1500);
}
