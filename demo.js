/* Live demo page: reads demo-config.js so each demo can be switched on later. */
(() => {
  const config=window.TELZA_DEMO_CONFIG||{},site=window.TelzaSite;
  const status=(key,live,label)=>{const el=document.querySelector(`[data-status="${key}"]`);if(!el)return;el.dataset.live=String(!!live);el.textContent=label;};

  // Inbound demo line.
  const inbound=config.voiceInbound||{},call=document.querySelector('#voice-call');
  if(inbound.number){
    call.href='tel:'+inbound.number.replace(/[^\d+]/g,'');
    call.textContent='Call '+(inbound.label||inbound.number)+' ↗';
    call.removeAttribute('aria-disabled');
    status('voiceInbound',true,'Live now');
  }else{
    call.removeAttribute('href');call.setAttribute('role','link');
    status('voiceInbound',false,'Being configured');
  }

  // Outbound demo requests.
  const outbound=config.voiceOutbound||{},form=document.querySelector('#voice-request');
  if(outbound.enabled===false){form.hidden=true;}
  status('voiceOutbound',outbound.live,outbound.live?'Live now':'Calls scheduled by the team');

  // WhatsApp bot.
  const wa=config.whatsapp||{},open=document.querySelector('#wa-open');
  if(wa.number){open.href=`https://wa.me/${String(wa.number).replace(/\D/g,'')}?text=${encodeURIComponent(wa.message||'Hi Telza!')}`;}
  status('whatsapp',wa.live,wa.live?'Live now':'Answered by the team');

  // Fillo sandbox.
  const fillo=config.fillo||{},filloOpen=document.querySelector('#fillo-open');
  if(fillo.sandboxUrl&&/^https:\/\//.test(fillo.sandboxUrl)){filloOpen.href=fillo.sandboxUrl;filloOpen.target='_blank';filloOpen.rel='noopener';filloOpen.textContent='Open the Fillo sandbox ↗';status('fillo',true,'Live now');}

  // Optional embedded demo (https only).
  if(config.embedUrl&&/^https:\/\//.test(config.embedUrl)){
    const box=document.querySelector('#demo-embed'),frame=document.createElement('iframe');
    frame.src=config.embedUrl;frame.title=config.embedTitle||'Telza live demo';frame.loading='lazy';frame.allow='microphone; autoplay; clipboard-write';
    frame.referrerPolicy='strict-origin-when-cross-origin';
    box.replaceChildren(frame);box.hidden=false;
  }

  if(!form||!site)return;
  const message=form.querySelector('.form-status'),submit=form.querySelector('[type=submit]');
  form.addEventListener('submit',async event=>{
    event.preventDefault();message.hidden=true;
    const data=new FormData(form),fields=[...form.querySelectorAll('[required]')];
    let valid=true;
    fields.forEach(el=>{let ok=el.type==='checkbox'?el.checked:el.value.trim().length>1;if(ok&&el.type==='email')ok=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());if(ok&&el.type==='tel')ok=el.value.replace(/\D/g,'').length>=7;el.setAttribute('aria-invalid',String(!ok));if(!ok)valid=false;});
    if(!valid){message.dataset.type='error';message.hidden=false;message.textContent='Please complete the highlighted fields.';form.querySelector('[aria-invalid=true]')?.focus();return;}
    const payload={type:'voice-outbound',name:data.get('name').trim(),phone:data.get('phone').trim(),email:data.get('email').trim(),useCase:data.get('useCase'),consent:true,company_site:data.get('company_site'),page:location.pathname};
    submit.disabled=true;const label=submit.textContent;submit.textContent='Sending…';
    const result=await site.send('/api/demo-request',payload);
    submit.disabled=false;submit.textContent=label;
    if(result.ok){
      const done=document.createElement('div');done.className='form-success';
      const h=document.createElement('h3');h.textContent='Request received.';
      const p=document.createElement('p');p.textContent=outbound.live?`The agent will call ${payload.phone} in the next few minutes.`:`Thanks, ${payload.name.split(' ')[0]}. We’ll schedule your demo call to ${payload.phone} and confirm by email.`;
      done.append(h,p);form.replaceChildren(done);
    }else{
      message.dataset.type='error';message.hidden=false;
      const text=document.createElement('p');text.textContent='We couldn’t send your request just now. Please try again, or message us directly:';
      const link=document.createElement('a');link.href=site.whatsapp(`Hi Telza, I’d like a Voice Agent demo call.\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email}\nUse case: ${payload.useCase}`);link.target='_blank';link.rel='noopener';link.textContent='Request on WhatsApp';
      message.replaceChildren(text,link);
    }
  });
})();
