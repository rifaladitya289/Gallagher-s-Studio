/* Gallagher's Studio — accessible, lightweight interactions */
(() => {
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
 const menu = document.querySelector('.menu-toggle');
 const nav = document.querySelector('.primary-nav');

 if (menu && nav) {
   const closeMenu = () => {
     nav.classList.remove('is-open');
     menu.setAttribute('aria-expanded', 'false');
     menu.setAttribute('aria-label', 'Open navigation');
     menu.textContent = '☰';
   };
   menu.addEventListener('click', () => {
     const open = nav.classList.toggle('is-open');
     menu.setAttribute('aria-expanded', String(open));
     menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
     menu.textContent = open ? '×' : '☰';
   });
   nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
   document.addEventListener('keydown', event => {
     if (event.key === 'Escape') closeMenu();
   });
   document.addEventListener('click', event => {
     if (!nav.contains(event.target) && !menu.contains(event.target)) closeMenu();
   });
 }

 document.querySelectorAll('[data-year]').forEach(el => {
   el.textContent = new Date().getFullYear();
 });

 // Reveal sections once, with a light stagger for grouped cards and rows.
 const revealItems = document.querySelectorAll('.reveal,.reveal-stagger');
 if ('IntersectionObserver' in window && !reduced) {
   const observer = new IntersectionObserver(entries => entries.forEach(entry => {
     if (!entry.isIntersecting) return;
     entry.target.classList.add('is-visible');
     observer.unobserve(entry.target);
   }), {threshold: 0.12, rootMargin: '0px 0px -35px 0px'});
   revealItems.forEach(el => observer.observe(el));
 } else {
   revealItems.forEach(el => el.classList.add('is-visible'));
 }

 // Subtle image parallax: desktop only, clamped to avoid distracting movement.
 const parallaxImages = document.querySelectorAll('.hero-product img,.case-image img');
 if (finePointer && !reduced && parallaxImages.length) {
   let scheduled = false;
   const updateParallax = () => {
     const viewport = window.innerHeight || 1;
     parallaxImages.forEach(img => {
       const rect = img.getBoundingClientRect();
       if (rect.bottom < 0 || rect.top > viewport) return;
       const offset = Math.max(-12, Math.min(12, (rect.top + rect.height / 2 - viewport / 2) * -0.018));
       img.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
     });
     scheduled = false;
   };
   const requestParallax = () => {
     if (scheduled) return;
     scheduled = true;
     window.requestAnimationFrame(updateParallax);
   };
   window.addEventListener('scroll', requestParallax, {passive:true});
   window.addEventListener('resize', requestParallax);
   requestParallax();
 }

 // Desktop-only cursor accent. It never intercepts pointer events.
 if (finePointer && !reduced) {
   const dot = document.createElement('span');
   const trail = document.createElement('span');
   dot.className = 'cursor-dot';
   trail.className = 'cursor-trail';
   document.body.append(dot, trail);
   Object.assign(dot.style, {
     position:'fixed', zIndex:999, pointerEvents:'none', width:'7px', height:'7px',
     borderRadius:'50%', background:'var(--accent-strong)', left:0, top:0,
     transform:'translate(-50%,-50%)'
   });
   Object.assign(trail.style, {
     position:'fixed', zIndex:998, pointerEvents:'none', width:'28px', height:'28px',
     border:'1px solid var(--accent-ring)', borderRadius:'50%', left:0, top:0,
     transform:'translate(-50%,-50%)', transition:'transform .18s ease'
   });
   let x=0, y=0, tx=0, ty=0, frame=0;
   window.addEventListener('pointermove', event => {
     x=event.clientX; y=event.clientY;
     dot.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';
     if (frame) return;
     frame=window.requestAnimationFrame(() => {
       tx+=(x-tx)*.35; ty+=(y-ty)*.35;
       trail.style.transform='translate('+tx+'px,'+ty+'px) translate(-50%,-50%)';
       frame=0;
     });
   }, {passive:true});
 }

 // Same-site page transitions; hash links and downloads remain native.
 if (!reduced) {
   document.body.classList.add('page-enter');
   document.querySelectorAll('a[href]').forEach(link => {
     link.addEventListener('click', event => {
       const url = new URL(link.href, window.location.href);
       const samePageHash = url.origin === location.origin &&
         url.pathname === location.pathname && url.hash;
       const eligible = url.origin === location.origin &&
         !samePageHash && !link.hasAttribute('download') &&
         !link.target && !event.metaKey && !event.ctrlKey &&
         !event.shiftKey && !event.altKey && event.button === 0;
       if (!eligible) return;
       event.preventDefault();
       document.body.classList.add('page-leave');
       window.setTimeout(() => { window.location.href = url.href; }, 220);
     });
   });
 }

 // Formspree stays disabled until a real endpoint is configured.
 const form = document.querySelector('[data-contact-form]');
 if (form) {
   const status = form.querySelector('[data-form-status]');
   const endpoint = form.dataset.endpoint || '';
   const submit = form.querySelector('button[type="submit"]');
   if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
     if (submit) submit.disabled = true;
     if (status) status.textContent = 'Contact form setup pending: add your Formspree form ID before accepting submissions. Email is available as an alternative.';
   } else {
     form.addEventListener('submit', async event => {
       event.preventDefault();
       if (!form.reportValidity()) return;
       if (submit) { submit.disabled=true; submit.textContent='Sending…'; }
       if (status) status.textContent='Sending your message…';
       try {
         const response = await fetch(endpoint, {
           method:'POST', body:new FormData(form),
           headers:{Accept:'application/json'}
         });
         if (!response.ok) throw new Error('Submission failed');
         form.reset();
         if (status) status.textContent='Thank you. Your message has been sent successfully.';
       } catch {
         if (status) status.textContent='Your message could not be sent. Please use the email option instead.';
       } finally {
         if (submit) { submit.disabled=false; submit.textContent='Send message'; }
       }
     });
   }
 }

 // Decode the contact address only when the page is rendered.
 document.querySelectorAll('[data-email-user][data-email-domain]').forEach(link => {
   const address = link.dataset.emailUser + '@' + link.dataset.emailDomain;
   link.textContent = address;
   link.href = 'mailto:' + address;
 });
})();
