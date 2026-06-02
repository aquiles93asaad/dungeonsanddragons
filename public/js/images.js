/* ── IMAGES: modal de URL + carga de archivo + asignar a retrato ── */

let imageTarget=null;

function openImageModal(target){
  imageTarget=target;
  document.getElementById('imageUrlInput').value='';
  document.getElementById('imageModal').classList.add('show');
  setTimeout(()=>document.getElementById('imageUrlInput').focus(),100);
}

function closeImageModal(){
  document.getElementById('imageModal').classList.remove('show');
  imageTarget=null;
}

function applyImage(){
  const url=document.getElementById('imageUrlInput').value.trim();
  if(url && imageTarget) setPortrait(imageTarget,url);
  closeImageModal();
}

function loadFromFile(e){
  const file=e.target.files[0];
  if(!file||!imageTarget)return;
  const reader=new FileReader();
  reader.onload=ev=>{setPortrait(imageTarget,ev.target.result);closeImageModal()};
  reader.readAsDataURL(file);
}

function setPortrait(target,url){
  const img=document.getElementById('portrait-img-'+target);
  const ph=document.getElementById('portrait-ph-'+target);
  if(!img)return;
  img.src=url;
  img.style.display='block';
  if(ph)ph.style.display='none';
  save('portrait_'+target,url);
}
