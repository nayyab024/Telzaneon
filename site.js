/* Shared across every page: the mobile menu, the footer year and form sending. */
(() => {
  const CONTACT={email:'info@telza.ai',phone:'+14016783367',phoneLabel:'+1 (401) 678-3367',whatsapp:'14016783367'};

  const header=document.querySelector('.header'),toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#site-nav');
  if(header&&toggle&&nav){
    const set=open=>{header.classList.toggle('menu-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');};
    toggle.addEventListener('click',()=>set(!header.classList.contains('menu-open')));
    nav.addEventListener('click',event=>{if(event.target.closest('a'))set(false);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&header.classList.contains('menu-open')){set(false);toggle.focus();}});
    matchMedia('(min-width:761px)').addEventListener('change',()=>set(false));
  }
  // Products and Industries dropdowns: hover and keyboard focus open them (CSS). A button trigger toggles its menu;
  // a link trigger (Products) opens its menu on the first tap on touch screens with the full nav, then works as a link.
  const menus=[...document.querySelectorAll('.nav-menu')];
  if(menus.length){
    const touch=matchMedia('(hover:none)'),wide=matchMedia('(min-width:761px)');
    const setOpen=(menu,open)=>{menu.classList.toggle('is-open',open);menu.querySelector(':scope>button')?.setAttribute('aria-expanded',String(open));};
    menus.forEach(menu=>{
      const trigger=menu.querySelector(':scope>a,:scope>button');
      // Capture phase, so the homepage's own Products scroll handler does not also run on that first tap.
      menu.addEventListener('click',event=>{
        if(event.target.closest('a,button')!==trigger)return;
        const open=menu.classList.contains('is-open');
        if(trigger.tagName==='BUTTON'){menus.forEach(m=>m!==menu&&setOpen(m,false));setOpen(menu,!open);return;}
        if(touch.matches&&wide.matches&&!open){event.preventDefault();event.stopPropagation();menus.forEach(m=>m!==menu&&setOpen(m,false));setOpen(menu,true);}
      },true);    });
    document.addEventListener('click',event=>{menus.forEach(m=>{if(!m.contains(event.target))setOpen(m,false);});});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')menus.forEach(m=>setOpen(m,false));});
  }
  document.querySelectorAll('[data-year]').forEach(el=>{el.textContent=String(new Date().getFullYear());});

  // Send a form to the site's API. Resolves {ok, data}; never throws.
  async function send(endpoint,payload){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      let data={};try{data=await response.json();}catch{}
      return {ok:response.ok&&data.ok!==false,status:response.status,data};
    }catch(error){return {ok:false,status:0,data:{error:error.name==='AbortError'?'timeout':'network'}};}
    finally{clearTimeout(timer);}
  }
  const mailto=(subject,body)=>`mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const whatsapp=text=>`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  window.TelzaSite={CONTACT,send,mailto,whatsapp};
})();
