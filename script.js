/* Gallagher's Studio — lightweight interactions */
(() => {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const menu = document.querySelector('.menu-toggle');
 const nav = document.querySelector('.primary-nav');
 if (menu && nav) {
   menu.addEventListener('click', () => {
     const open = nav.classList.toggle('is-open');
     menu.setAttribute('aria-expanded', String(open));
     menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
     menu.textContent = open ? '×' : '☰';
   });
   nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
     nav.classList.remove('is-open'); menu.setAttribute('aria-expanded','false'); menu.textContent='☰';
   }));
 }
 document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
 const revealItems = document.querySelectorAll('.reveal,.reveal-stagger');
 if ('IntersectionObserver' in window && !reduced) {
   const observer = new IntersectionObserver(entries => entries.forEach(entry => {
     if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
   }), {threshold:.12});
   revealItems.forEach(el => observer.observe(el));
 } else revealItems.forEach(el => el.classList.add('is-visible'));
 // Cursor accent is desktop-only and uses transform, with no pointer interception.
 if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
   const dot = document.createElement('span'); dot.className='cursor-dot';
   const trail = document.createElement('span'); trail.className='cursor-trail';
   document.body.append(dot,trail);
   Object.assign(dot.style,{position:'fixed',zIndex:999,pointerEvents:'none',width:'7px',height:'7px',borderRadius:'50%',background:'var(--accent-strong)',left:0,top:0,transform:'translate(-50%,-50%)'});
   Object.assign(trail.style,{position:'fixed',zIndex:998,pointerEvents:'none',width:'28px',height:'28px',border:'1px solid rgba(155,185,232,.35)',borderRadius:'50%',left:0,top:0,transform:'translate(-50%,-50%)',transition:'transform .18s ease'});
   let x=0,y=0,tx=0,ty=0,frame=false;
   window.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;dot.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';if(!frame){frame=true;requestAnimationFrame(()=>{tx+=(x-tx)*.35;ty+=(y-ty)*.35;trail.style.transform='translate('+tx+'px,'+ty+'px) translate(-50%,-50%)';frame=false;});}},{passive:true});
 }
 // Optional Formspree endpoint. Form remains safely disabled until configured.
 const form = document.querySelector('[data-contact-form]');
 if (form) {
   const status = form.querySelector('[data-form-status]');
   const endpoint = form.dataset.endpoint || '';
   const submit = form.querySelector('button[type="submit"]');
   if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
     if (submit) submit.disabled = true;
     if (status) status.textContent = 'Contact form setup pending: add your Formspree form ID before accepting submissions. Email is available as an alternative.';
   } else {
     form.addEventListener('submit', async e => {
       e.preventDefault();
       if (!form.reportValidity()) return;
       if (submit) {submit.disabled=true;submit.textContent='Sending…';}
       if (status) status.textContent='Sending your message…';
       try {
         const response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
         if (!response.ok) throw new Error('Request failed');
         form.reset(); if(status) status.textContent='Thank you. Your message has been sent successfully.';
       } catch {
         if(status) status.textContent='Your message could not be sent. Please use the email option instead.';
       } finally {if(submit){submit.disabled=false;submit.textContent='Send message';}}
     });
   }
 }
})();
