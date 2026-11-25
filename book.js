/* Book a meeting: validation, sending and a clear fallback if sending fails. */
(() => {
  const form=document.querySelector('#booking-form');
  if(!form)return;
  const card=document.querySelector('#booking-card'),status=document.querySelector('#booking-status'),submit=form.querySelector('[type=submit]');
  const $=id=>document.getElementById(id);
  const site=window.TelzaSite;

  // Time zone: the visitor's own, with the full list when the browser has it.
  const zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
  let zones=[];try{zones=Intl.supportedValuesOf('timeZone');}catch{zones=['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Berlin','Asia/Dubai','Asia/Karachi','Asia/Kolkata','Asia/Singapore','Australia/Sydney','UTC'];}
  if(!zones.includes(zone))zones.unshift(zone);
  $('b-timezone').replaceChildren(...zones.map(z=>{const o=document.createElement('option');o.value=o.textContent=z;if(z===zone)o.selected=true;return o;}));

  // Half-hour slots, 9:00 am to 6:00 pm in the visitor's time zone.
  const times=[];for(let m=9*60;m<=18*60;m+=30){const h=Math.floor(m/60),mm=String(m%60).padStart(2,'0'),label=`${(h+11)%12+1}:${mm} ${h<12?'am':'pm'}`;times.push([`${String(h).padStart(2,'0')}:${mm}`,label]);}
  $('b-time').append(...times.map(([value,label])=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;}));

  // Earliest date: tomorrow, so there is time to confirm.
  const local=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
  const latest=new Date();latest.setDate(latest.getDate()+120);
  $('b-date').min=local(tomorrow);$('b-date').max=local(latest);

  // Preselect what the visitor came from: ?interest=Voice%20Agent
  const interest=new URLSearchParams(location.search).get('interest');
  if(interest){const wanted=interest.toLowerCase();form.querySelectorAll('input[name=interests]').forEach(box=>{if(box.value.toLowerCase().startsWith(wanted))box.checked=true;});}
  // Carry over the email entered in a product page's call to action: ?email=you@company.com
  const email=new URLSearchParams(location.search).get('email');
  if(email&&!$('b-email').value)$('b-email').value=email.trim().slice(0,200);

  const rules={
    'b-name':v=>v.trim().length>=2||'Please enter your name.',
    'b-email':v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||'Please enter a valid email address.',
    'b-phone':v=>v.replace(/\D/g,'').length>=7||'Please enter a phone or WhatsApp number.',
    'b-date':v=>{if(!v)return 'Please choose a date.';if(v<$('b-date').min||v>$('b-date').max)return 'Please choose a date from tomorrow onwards.';return true;},
    'b-time':v=>!!v||'Please choose a time.',
    'b-consent':(v,el)=>el.checked||'Please confirm we may contact you.'
  };
  function check(id){
    const el=$(id),result=rules[id](el.value,el),error=$(id+'-error'),ok=result===true;
    el.setAttribute('aria-invalid',String(!ok));if(error)error.textContent=ok?'':result;
    if(!ok)el.setAttribute('aria-describedby',id+'-error');else el.removeAttribute('aria-describedby');
    return ok;
  }
  function checkInterests(){
    const ok=!!form.querySelector('input[name=interests]:checked');
    $('b-interests-error').textContent=ok?'':'Please choose at least one topic.';
    return ok;
  }
  Object.keys(rules).forEach(id=>{const el=$(id);el.addEventListener('blur',()=>{if(el.value||el.type==='checkbox')check(id);});el.addEventListener('change',()=>{if(el.getAttribute('aria-invalid')==='true')check(id);});});
  form.querySelectorAll('input[name=interests]').forEach(box=>box.addEventListener('change',()=>{if($('b-interests-error').textContent)checkInterests();}));

  const payload=()=>{
    const data=new FormData(form);
    return {
      name:data.get('name').trim(),email:data.get('email').trim(),phone:data.get('phone').trim(),
      company:data.get('company').trim(),website:data.get('website').trim(),volume:data.get('volume'),
      interests:data.getAll('interests'),date:data.get('date'),time:data.get('time'),timezone:data.get('timezone'),
      meeting:data.get('meeting'),message:data.get('message').trim(),consent:data.get('consent')==='on',
      company_site:data.get('company_site'),page:location.pathname+location.search
    };
  };
  const timeLabel=value=>(times.find(([v])=>v===value)||[,value])[1];
  const dateLabel=value=>{const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});};
  const summary=p=>[
    `Name: ${p.name}`,`Email: ${p.email}`,`Phone/WhatsApp: ${p.phone}`,p.company&&`Company: ${p.company}`,p.website&&`Website: ${p.website}`,
    `Topics: ${p.interests.join(', ')}`,`Preferred time: ${dateLabel(p.date)}, ${timeLabel(p.time)} (${p.timezone})`,`Meet by: ${p.meeting}`,
    p.volume&&`Monthly volume: ${p.volume}`,p.message&&`\n${p.message}`
  ].filter(Boolean).join('\n');

  function showSuccess(p){
    const wrap=document.createElement('div');wrap.className='form-success';wrap.tabIndex=-1;
    const rows=[['Topics',p.interests.join(', ')],['Preferred time',`${dateLabel(p.date)}, ${timeLabel(p.time)}`],['Time zone',p.timezone],['Meet by',p.meeting],['Email',p.email]];
    const dl=document.createElement('dl');
    rows.forEach(([k,v])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=v;div.append(dt,dd);dl.append(div);});
    const mark=document.createElement('div');mark.className='success-mark';mark.setAttribute('aria-hidden','true');mark.textContent='✓';
    const h=document.createElement('h2');h.textContent='Request received.';
    const text=document.createElement('p');text.textContent=`Thank you, ${p.name.split(' ')[0]}. We’ll confirm your meeting by email at ${p.email} within one business day. Need us sooner? Message us on WhatsApp.`;
    const actions=document.createElement('div');actions.className='form-actions';
    const wa=document.createElement('a');wa.className='button';wa.href=site.whatsapp(`Hi Telza, I just requested a meeting (${p.name}, ${p.email}).`);wa.target='_blank';wa.rel='noopener';wa.textContent='Message us on WhatsApp ↗';
    const home=document.createElement('a');home.className='text-button';home.href='index.html';home.textContent='Back to the homepage';
    actions.append(wa,home);
    wrap.append(mark,h,text,dl,actions);
    card.replaceChildren(wrap);wrap.focus({preventScroll:true});card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function showFallback(p){
    status.dataset.type='error';status.hidden=false;
    const intro=document.createElement('p');intro.textContent='We couldn’t send your request just now. Your details are still here. Please try again, or send them straight to us:';
    const links=document.createElement('p');links.style.marginTop='10px';
    const mail=document.createElement('a');mail.href=site.mailto('Meeting request — '+p.name,summary(p));mail.textContent='Send by email';
    const wa=document.createElement('a');wa.href=site.whatsapp('Hi Telza, I’d like to book a meeting.\n\n'+summary(p));wa.target='_blank';wa.rel='noopener';wa.textContent='Send on WhatsApp';
    links.append(mail,document.createTextNode('  ·  '),wa);
    status.replaceChildren(intro,links);
  }

  form.addEventListener('submit',async event=>{
    event.preventDefault();status.hidden=true;
    const results=[...Object.keys(rules).map(check),checkInterests()];
    if(results.includes(false)){const first=form.querySelector('[aria-invalid=true]')||form.querySelector('input[name=interests]');first?.focus();return;}
    const p=payload();
    submit.disabled=true;const label=submit.textContent;submit.textContent='Sending…';
    const result=await site.send('/api/booking',p);
    submit.disabled=false;submit.textContent=label;
    if(result.ok)showSuccess(p);else showFallback(p);
  });
})();
