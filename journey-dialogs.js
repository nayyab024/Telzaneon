(() => {
  const detail=document.querySelector('#product-dialog');
  if(!detail)return;
  const data={
    voice:{name:'Voice Agent',interest:'Voice Agent',demo:'demo.html#voice',title:'Every call, qualified automatically.',description:'An AI calling agent for inbound and outbound calls. It holds natural, human-like conversations at scale, qualifies in real time and transfers only the best prospects to your agents, with a precise disposition for every call.',steps:['Outbound: dial, greet, pitch by state, qualify, handle objections and transfer live.','Inbound: answer on the first ring, answer questions, qualify, then transfer, book or route.','Plugs into ViciDial, Telnyx, Twilio, Vonage, SignalWire or any SIP carrier.','Per-client reporting portal, multi-voice library and compliance built in.']},
    fillo:{name:'Fillo AI',interest:'Fillo AI',demo:'demo.html#fillo',title:'Lead work, taken care of.',description:'Fillo is Telza’s lead-ID form automation. Your agent enters the lead once; Fillo matches the closest IP from a 10-million-IP pool, uses a fresh device ID and submits the form with human-like automation.',steps:['Your agent adds the lead data once, in the Fillo dashboard.','Fillo matches the lead’s address and ZIP to the closest available IP.','The form is filled and submitted on your client’s website.','The Lead ID and Trusted ID return to your dashboard.']},
    whatsapp:{name:'WhatsApp Bot',interest:'WhatsApp Bot',demo:'demo.html#whatsapp',title:'Keep the conversation going.',description:'An AI assistant on your WhatsApp Business number. It answers questions, qualifies with quick replies, books appointments, sends reminders and hands over to your team when a person is needed.',steps:['Start with the questions your team answers most often.','Connect your calendar, catalogue or CRM for bookings and lead capture.','Approved templates for confirmations, reminders and follow-ups.','Human handoff with the full conversation in view.']},
    commerce:{name:'E-commerce AI',interest:'E-commerce AI',demo:'demo.html',title:'Help the next decision happen.',description:'An assistant for product questions and shopping support, using the information and workflows available in your store.',steps:['Identify the product and order questions shoppers ask.','Connect store information and define the assistant’s scope.','Help shoppers find an answer, or reach your team.']},
    custom:{name:'Custom AI',interest:'Custom AI',demo:'demo.html',title:'Built around your kind of work.',description:'For repetitive work that needs a tailored approach, Telza maps the process and builds an automation around a defined result, with the portal, CRM or app around it if you need one.',steps:['Show us the process, tools and decisions involved.','Agree the scope, connections and review points.','See it working with real examples, then launch and improve.']}
  };
  const book=interest=>'book.html?interest='+encodeURIComponent(interest);
  document.querySelectorAll('[data-detail]').forEach(button=>button.addEventListener('click',()=>{
    const x=data[button.dataset.detail];if(!x)return;
    document.querySelector('#detail-eyebrow').textContent=x.name.toUpperCase()+' / BY TELZA';
    document.querySelector('#detail-title').textContent=x.title;
    document.querySelector('#detail-description').textContent=x.description;
    document.querySelector('#detail-steps').replaceChildren(...x.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    document.querySelector('#detail-demo').href=book(x.interest);
    document.querySelector('#detail-live').href=x.demo;
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    detail.showModal();document.body.classList.add('dialog-open');
  }));
  detail.querySelector('.dialog-close').addEventListener('click',()=>detail.close());
  detail.addEventListener('click',event=>{if(event.target!==detail)return;const r=detail.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)detail.close();});
  detail.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
})();
