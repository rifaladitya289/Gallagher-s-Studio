/* Gallagher's Studio — cinematic scene navigation and accessible interactions */
(() => {
 'use strict';
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
 const $ = (selector, root=document) => root.querySelector(selector);
 const $$ = (selector, root=document) => Array.from(root.querySelectorAll(selector));

 $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

 // Intro counter is intentionally brief and never blocks the page without JavaScript.
 const loader = $('.film-loader');
 const counter = $('[data-loader-count]');
 const bar = $('[data-loader-bar]');
 if (loader && counter && !reduced) {
   document.body.classList.add('cinema-loading');
   const start = performance.now();
   const duration = 720;
   const tick = now => {
     const progress = Math.min(1, (now-start)/duration);
     const eased = 1-Math.pow(1-progress,3);
     counter.textContent = String(Math.round(eased*100)).padStart(2,'0');
     if (bar) bar.style.width = (eased*100)+'%';
     if (progress < 1) requestAnimationFrame(tick);
     else {
       document.body.classList.remove('cinema-loading');
       document.body.classList.add('cinema-ready');
     }
   };
   requestAnimationFrame(tick);
 } else {
   document.body.classList.remove('cinema-loading');
 }

 // Full-screen scene index: usable by pointer, touch and keyboard.
 const menuButton = $('.hud-menu');
 const menuPanel = $('.scene-index');
 const closeButton = $('.index-close');
 const setMenu = open => {
   if (!menuButton || !menuPanel) return;
   menuButton.setAttribute('aria-expanded', String(open));
   menuButton.setAttribute('aria-label', open ? 'Close scene index' : 'Open scene index');
   menuPanel.classList.toggle('is-open', open);
   menuPanel.setAttribute('aria-hidden', String(!open));
   document.body.classList.toggle('menu-open', open);
   if (cinema) cinema.inert = open;
   const mainContent = $('main');
   if (mainContent) mainContent.inert = open;
   if (open && closeButton) closeButton.focus();
   if (!open && menuButton) menuButton.focus();
 };
 if (menuButton && menuPanel) {
   menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
   closeButton?.addEventListener('click', () => setMenu(false));
   menuPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
   menuPanel.addEventListener('click', event => { if (event.target === menuPanel) setMenu(false); });
 }

 const cinema = $('.cinema');
 const scenes = $$('.scene[data-scene]');
 const count = $('[data-scene-count]');
 const progress = $('[data-progress]');
 let activeScene = 0;
 const goToScene = index => {
   if (!scenes.length) return;
   const next = Math.max(0, Math.min(scenes.length-1, index));
   scenes[next].scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 };
 const setActive = scene => {
   const index = scenes.indexOf(scene);
   if (index < 0 || index === activeScene) return;
   activeScene = index;
   scenes.forEach((item,i) => item.classList.toggle('is-active',i===index));
   if (count) count.innerHTML = String(index+1).padStart(2,'0')+' <i>/ 06</i>';
   if (progress) progress.style.width = ((index+1)/6*100)+'%';
 };
 if (scenes.length && 'IntersectionObserver' in window) {
   const observer = new IntersectionObserver(entries => {
     entries.forEach(entry => { if (entry.isIntersecting && entry.intersectionRatio >= .45) setActive(entry.target); });
   },{root:cinema,threshold:[.45,.65]});
   scenes.forEach(scene => observer.observe(scene));
   scenes[0].classList.add('is-active');
 }

 // Scroll progress gives the film strip a restrained entrance as its scene arrives.
 const processScene=$('#scene-03');
 const filmstrip=$('[data-filmstrip]');
 if(processScene && filmstrip && !reduced){
   let stripFrame=0;
   const updateStrip=()=>{
     const rect=processScene.getBoundingClientRect();
     const vh=window.innerHeight||1;
     const progress=Math.max(0,Math.min(1,(vh-rect.top)/(vh+rect.height)));
     filmstrip.style.transform='translate3d('+(1-progress)*34+'px,0,0)';
     stripFrame=0;
   };
   const requestStrip=()=>{if(stripFrame)return;stripFrame=requestAnimationFrame(updateStrip);};
   cinema?.addEventListener('scroll',requestStrip,{passive:true});
   requestStrip();
 }

 // Keyboard shortcuts: arrows navigate scenes; 1–6 jump; M opens menu.
 document.addEventListener('keydown', event => {
   const target = event.target;
   const menuOpen = menuPanel?.classList.contains('is-open');
   if (event.key === 'Escape' && menuOpen) { setMenu(false); return; }
   if (menuOpen) {
     if (event.key === 'Tab') {
       const focusables = $$('a[href],button:not([disabled])', menuPanel);
       const first = focusables[0], last = focusables[focusables.length-1];
       if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
       else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
     }
     return;
   }
   const typing = target && target.matches('input,textarea,select,button,[contenteditable="true"]');
   if (typing) return;
   if (event.key.toLowerCase() === 'm') { event.preventDefault(); setMenu(true); return; }
   if (!scenes.length) return;
   if (/^[1-6]$/.test(event.key)) { event.preventDefault(); goToScene(Number(event.key)-1); return; }
   if (['ArrowDown','ArrowRight','PageDown'].includes(event.key)) { event.preventDefault(); goToScene(activeScene+1); }
   if (['ArrowUp','ArrowLeft','PageUp'].includes(event.key)) { event.preventDefault(); goToScene(activeScene-1); }
   if (event.key === 'Home') { event.preventDefault(); goToScene(0); }
   if (event.key === 'End') { event.preventDefault(); goToScene(scenes.length-1); }
 });

 // Drag the horizontal process strip with mouse; native touch swipe remains enabled.
 const strip = $('[data-filmstrip]');
 if (strip && finePointer) {
   let down=false,startX=0,startScroll=0,moved=false;
   strip.addEventListener('pointerdown',event=>{
     if(event.pointerType!=='mouse' || event.button!==0) return;
     down=true;moved=false;startX=event.clientX;startScroll=strip.scrollLeft;
     strip.setPointerCapture(event.pointerId);
   });
   strip.addEventListener('pointermove',event=>{
     if(!down) return;
     const delta=event.clientX-startX;
     if(Math.abs(delta)>4)moved=true;
     strip.scrollLeft=startScroll-delta;
   });
   const stop=()=>{down=false;};
   strip.addEventListener('pointerup',stop);
   strip.addEventListener('pointercancel',stop);
   strip.addEventListener('click',event=>{if(moved){event.preventDefault();event.stopPropagation();moved=false;}},true);
 }

 // Cursor states: default, VIEW on project actions, DRAG over the process strip.
 const cursor = $('.cursor-system');
 const cursorCore = $('.cursor-core');
 const cursorLabel = $('.cursor-label');
 if (cursor && cursorCore && cursorLabel && finePointer && !reduced) {
   let x=0,y=0;
   window.addEventListener('pointermove',event=>{
     x=event.clientX;y=event.clientY;
     cursorCore.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';
     cursorLabel.style.transform='translate('+x+'px,'+y+'px) translate(-50%,-50%)';
   },{passive:true});
   $$('[data-cursor],a,button,[data-filmstrip]').forEach(el=>{
     el.addEventListener('pointerenter',()=>{
       const label=el.dataset.cursor || (el.matches('[data-filmstrip]')?'DRAG':'');
       cursorLabel.textContent=label;
       cursor.classList.toggle('is-active',Boolean(label));\n       cursor.classList.toggle('is-link',el.matches('a,button'));
     });
     el.addEventListener('pointerleave',()=>cursor.classList.remove('is-active'));
   });
 }

 // Floating StudyTrack mockups tilt toward pointer; no touch or reduced-motion tilt.
 if (finePointer && !reduced) {
   $$('[data-tilt]').forEach(item=>{
     item.addEventListener('pointermove',event=>{
       const rect=item.getBoundingClientRect();
       const px=(event.clientX-rect.left)/rect.width-.5;
       const py=(event.clientY-rect.top)/rect.height-.5;
       const image=item.querySelector('.object-frame,.poster-art>img:first-of-type');
       if(image) image.style.transform='perspective(1000px) rotateY('+(-px*10)+'deg) rotateX('+(py*7)+'deg) translateY(-3px)';
     });
     item.addEventListener('pointerleave',()=>{
       const image=item.querySelector('.object-frame,.poster-art>img:first-of-type');
       if(image) image.style.transform='';
     });
   });
   $$('.magnetic').forEach(button=>{
     button.addEventListener('pointermove',event=>{
       const rect=button.getBoundingClientRect();
       const dx=(event.clientX-(rect.left+rect.width/2))*.12;
       const dy=(event.clientY-(rect.top+rect.height/2))*.12;
       button.style.transform='translate3d('+dx+'px,'+dy+'px,0)';
     });
     button.addEventListener('pointerleave',()=>{button.style.transform='';});
   });
 }

 // Same-site page transitions, with no white flash; hashes remain native.
 if (!reduced) {
   $$('a[href]').forEach(link=>{
     link.addEventListener('click',event=>{
       const url=new URL(link.href,location.href);
       const samePageHash=url.origin===location.origin && url.pathname===location.pathname && url.hash;
       const eligible=url.origin===location.origin && !samePageHash && !link.hasAttribute('download') &&
         !link.target && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button===0;
       if(!eligible)return;
       event.preventDefault();
       document.body.classList.add('page-leave');
       window.setTimeout(()=>{location.href=url.href;},220);
     });
   });
 }

 // Formspree: no false success state when the endpoint is not configured.
 const form=$('[data-contact-form]');
 if(form){
   const status=$('[data-form-status]',form);
   const endpoint=form.dataset.endpoint||'';
   const submit=$('button[type="submit"]',form);
   if(!endpoint||endpoint.includes('YOUR_FORM_ID')){
     if(submit)submit.disabled=true;
     if(status)status.textContent='Form setup pending — email is available as an alternative.';
   }else{
     form.addEventListener('submit',async event=>{
       event.preventDefault();
       if(!form.reportValidity())return;
       if(submit){submit.disabled=true;submit.textContent='SENDING…';}
       if(status)status.textContent='Sending your project brief…';
       try{
         const response=await fetch(endpoint,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
         if(!response.ok)throw new Error('Submission failed');
         form.reset();
         if(status)status.textContent='Thank you. Your project brief has been sent.';
       }catch{
         if(status)status.textContent='The brief could not be sent. Please use the email link instead.';
       }finally{
         if(submit){submit.disabled=false;submit.innerHTML='SEND PROJECT BRIEF <span>↗</span>';}
       }
     });
   }
 }
 $$('[data-email-user][data-email-domain]').forEach(link=>{
   const address=link.dataset.emailUser+'@'+link.dataset.emailDomain;
   link.textContent=address;
   link.href='mailto:'+address;
 });
 // Single-page app sheets, hash history, island context and dock state.
 const dock=$('.floating-dock');
 const dockItems=$$('.dock-item',dock);
 const islandTitle=$('[data-island-title]');
 const sceneNames=['OPENING','KARYA YANG BICARA','CARA KERJA','PRINSIP DI BALIK KARYA','PERJALANAN','NGOBROL YUK'];
 let activeSheet=null;
 let lastSheetTrigger=null;
 const openSheet=id=>{
   const sheet=$('#'+id);
   if(!sheet)return;
   lastSheetTrigger=document.activeElement;
   sheet.classList.add('is-open');
   sheet.setAttribute('aria-hidden','false');
   document.body.classList.add('sheet-open');
   activeSheet=sheet;
   if(location.hash!=='#'+id)history.pushState({sheet:id},'', '#'+id);
   sheet.querySelector('.sheet-close')?.focus();
 };
 const closeSheet=(updateHistory=true)=>{
   if(!activeSheet)return;
   activeSheet.classList.remove('is-open');
   activeSheet.setAttribute('aria-hidden','true');
   document.body.classList.remove('sheet-open');
   activeSheet=null;
   if(updateHistory&&location.hash.startsWith('#sheet-'))history.pushState({},'',location.pathname+location.search);
   lastSheetTrigger?.focus?.();
 };
 $$('[data-open-sheet]').forEach(btn=>btn.addEventListener('click',()=>openSheet(btn.dataset.openSheet)));
 $$('[data-close-sheet]').forEach(btn=>btn.addEventListener('click',()=>closeSheet()));
 window.addEventListener('popstate',()=>{
   if(activeSheet)closeSheet(false);
   const id=location.hash.slice(1);
   if(id.startsWith('sheet-'))openSheet(id);
 });
 if(location.hash.startsWith('#sheet-'))openSheet(location.hash.slice(1));\n else if(location.hash.startsWith('#scene-'))document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});
 document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&activeSheet){closeSheet();return;}
   if(event.key.toLowerCase()==='k'&&!event.target.matches('input,textarea,select,[contenteditable="true"]')){
     event.preventDefault();
     setMenu(!menuPanel?.classList.contains('is-open'));
   }
 });
 const syncDock=()=>{
   const n=Math.max(0,activeScene);
   dockItems.forEach(item=>{
     const target=item.getAttribute('href')?.slice(1);
     const sceneIndex=scenes.findIndex(scene=>scene.id===target);
     const active=sceneIndex===n||(item.dataset.openSheet==='sheet-about'&&n===4);
     item.classList.toggle('is-active',active);
     if(active)item.setAttribute('aria-current','location');else item.removeAttribute('aria-current');
   });
   if(islandTitle)islandTitle.textContent=sceneNames[n]||'GALLAGHER’S STUDIO';
 };
 const dockObserver=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
     if(entry.isIntersecting){
       const n=scenes.indexOf(entry.target);
       if(n>=0){activeScene=n;syncDock();history.replaceState({scene:scenes[n].id},'', '#'+scenes[n].id);const progress=document.querySelector('[data-top-progress]');if(progress)progress.style.width=((n+1)/scenes.length*100)+'%';const ring=document.querySelector('.island-ring');if(ring)ring.style.setProperty('--ring-progress',((n+1)/scenes.length*100)+'%');}
     }
   });
 },{root:cinema,threshold:.6});
 scenes.forEach(scene=>dockObserver.observe(scene));
 let previousScroll=0;
 cinema?.addEventListener('scroll',()=>{
   const current=cinema.scrollTop;
   if(dock){
     if(current>previousScroll+5)dock.classList.add('dock-hidden');
     else if(current<previousScroll-5)dock.classList.remove('dock-hidden');
   }
   previousScroll=current;
 },{passive:true});
 syncDock();

})();
