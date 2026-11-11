(() => {
  const button = document.querySelector('button[aria-controls="main-navigation"]');
  const nav = document.getElementById('main-navigation');
  function close() { if (!button || !nav) return; button.setAttribute('aria-expanded','false');nav.classList.add('hidden');nav.classList.remove('flex');button.querySelector('.sr-only').textContent='Abrir menu'; }
  button?.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));nav.classList.toggle('hidden',!open);nav.classList.toggle('flex',open);button.querySelector('.sr-only').textContent=open?'Fechar menu':'Abrir menu';});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();button?.focus();}});
  let timer;
  function notice(){const el=document.getElementById('preview-status');el.textContent='Esta é uma prévia visual. Essa interação está disponível no projeto completo.';el.style.display='block';clearTimeout(timer);timer=setTimeout(()=>el.style.display='none',4500);}
  document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();notice();}));
  document.querySelectorAll('button').forEach(el=>{if(el!==button){el.disabled=false;el.addEventListener('click',notice);}});
  document.querySelectorAll('a[href="#preview-notice"]').forEach(el=>el.addEventListener('click',event=>{event.preventDefault();notice();}));
})();
