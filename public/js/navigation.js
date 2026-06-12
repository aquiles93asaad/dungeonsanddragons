/* ── NAVIGATION: páginas, sidebar, personajes ── */

let currentPage='overview', currentChar='rac';

const PAGE_SLUGS = {
  overview:'inicio', story:'historia', live:'live',
  campaign:'campana', chars:'personajes', npcs:'npcs',
  bestiary:'bestiario', items:'items', sessions:'sesiones'
};
const SLUG_TO_PAGE = Object.fromEntries(Object.entries(PAGE_SLUGS).map(([p,s])=>[s,p]));

function showPage(p){
  // Si hay una hoja de personaje en el modal, devolverla a su lugar antes de navegar
  if(typeof CHAR_MODAL_STATE !== 'undefined' && CHAR_MODAL_STATE){
    closeCharSheetModal();
  }
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(btn=>{
    if(btn.getAttribute('onclick').includes("'"+p+"'"))btn.classList.add('active');
  });
  currentPage=p;
  if(p!=='chars') hideSidebar();
  else showSidebar('chars');
  // Actualizar URL hash
  const slug = PAGE_SLUGS[p];
  if(slug) history.replaceState(null,'','#'+slug);
}

function showSidebar(t){document.getElementById('sidebar').classList.add('show')}
function hideSidebar(){document.getElementById('sidebar').classList.remove('show')}

function showChar(c){
  CHARS.forEach(ch=>{
    const el=document.getElementById('char-'+ch);
    if(el) el.style.display=ch===c?'block':'none';
  });
  document.querySelectorAll('.sidebar-item').forEach(btn=>{
    btn.classList.toggle('active',btn.getAttribute('onclick').includes("'"+c+"'"));
  });
  currentChar=c;
  showPage('chars');
}
