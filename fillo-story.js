/* Fillo shares the homepage's scroll clock, canvas and five specialist balls.
   Its sphere is the one at the chapter's index (Voice Agent comes first). */
(() => {
  const chapter=document.querySelector('#fillo'),index=Number(chapter.dataset.chapter)||0,scene=chapter.querySelector('.scene'),slot=chapter.querySelector('.visual-slot'),artboard=chapter.querySelector('.artboard');
  const intro=chapter.querySelector('.fillo-intro'),closing=chapter.querySelector('.fillo-closing'),layout=chapter.querySelector('.story-layout');
  const steps=[...chapter.querySelectorAll('.story-step')],art=[...chapter.querySelectorAll('[data-art]')],fields=[...chapter.querySelectorAll('[data-fill]')];
  const address=chapter.querySelector('.address-card'),ip=chapter.querySelector('.ip-card'),label=chapter.querySelector('#experience-label'),caption=chapter.querySelector('#visual-caption');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:760px)');
  const {clamp,smooth,sequence,toTimeline,narrativeEnd,openingNode,closingNode,sample,position,objects,radius,fieldProgress,targets}=window.FilloStory;
  const labels=['THE CURRENT SETUP','YOUR FILLO DASHBOARD','MATCHED TO THE LEAD’S LOCATION','ON THE CLIENT’S WEBSITE','BACK ON YOUR DASHBOARD'];
  const sphereCaption=document.createElement('div');sphereCaption.className='fillo-sphere-caption';sphereCaption.setAttribute('aria-hidden','true');sphereCaption.innerHTML='<span>FILLO</span><svg viewBox="0 0 40 40"><path d="m12 20 6 6 12-13" pathLength="1"/></svg>';document.body.append(sphereCaption);
  const fallback=document.createElement('div');fallback.className='fillo-fallback';fallback.setAttribute('aria-hidden','true');document.body.append(fallback);
  let top=0,span=1,end=0,next=0,nextNodes=null,scale=1,anchors={},entry=null,letter=null,lastLetter=null,active=-1,lastRegion=null,source={x:133,y:286,width:412,height:110};
  const holding=()=>window.TelzaJourneyMotion.holding(mobile.matches,innerHeight);
  function measure(following){
    lastRegion=null;
    const nextChapter=chapter.nextElementSibling;
    top=chapter.offsetTop;span=Math.max(1,chapter.offsetHeight-innerHeight);end=top+span;next=nextChapter?nextChapter.offsetTop:end+innerHeight;
    nextNodes=following||window.TelzaJourneyMotion.product(index+1,mobile.matches,innerHeight);
    if(reduce.matches)return;
    scale=Math.min(slot.clientWidth/600,slot.clientHeight/500);artboard.style.setProperty('--art-scale',scale);
    const bounds=scene.getBoundingClientRect(),board=artboard.getBoundingClientRect(),socket=chapter.querySelector('.address-socket').getBoundingClientRect(),w=document.documentElement.clientWidth,h=innerHeight;
    source={x:(socket.left-board.left)/scale,y:(socket.top-board.top)/scale,width:socket.width/scale,height:socket.height/scale};anchors={};
    artboard.querySelectorAll('[data-anchor]').forEach(el=>{const r=el.getBoundingClientRect();anchors[el.dataset.anchor]={x:r.left/w,y:(r.top-bounds.top)/h};});
    const measureLetter=selector=>{const r=chapter.querySelector(selector).getBoundingClientRect();return{x:(r.left+r.width/2)/w,y:(r.top+r.height/2-bounds.top)/h,r:r.width/2};};
    letter=measureLetter('.intro-o');lastLetter=measureLetter('.closing-o');
    const r=Math.max(20,letter.r*1.25),headerBottom=document.querySelector('.header').getBoundingClientRect().bottom;
    const parked=holding()[index],clearance=parked.y*h+(r+parked.r*h)*1.1+12;
    entry={x:Math.min(1-(r+20)/w,Math.max(.82,letter.x+r*3/w)),y:Math.max(headerBottom+r+16,clearance,letter.y*h-Math.max(h*.19,r*3))/h,r};
  }
  function withPoint(point){const nodes=holding();nodes[index]={...point,r:point.r/innerHeight};return nodes;}
  function entryNodes(){return entry?withPoint(entry):window.TelzaJourneyMotion.product(index,mobile.matches,innerHeight);}
  function nodeState(y){
    if(!entry||reduce.matches)return null;
    if(y>end)return window.TelzaFilloHandoff.sample((y-end)/(next-end),{...lastLetter,r:lastLetter.r/innerHeight},holding(),nextNodes,index);
    const overall=clamp((y-top)/span),phase=sequence(overall),p=phase.storyP,s=sample(p),r=radius(scale)*(1+s.confirmed*.1);
    const point=overall<toTimeline(0)?openingNode(overall,entry,letter,{...anchors.setup,r:radius(scale)}):overall>=narrativeEnd?closingNode(overall,{...anchors.success,r},lastLetter):{...position(p,anchors),r};
    return{nodes:withPoint(point),join:0,letterMorph:phase.letterMorph};
  }
  function place(el,rect){el.style.transform=`translate3d(${rect.x}px,${rect.y}px,0)`;el.style.width=rect.width+'px';el.style.height=rect.height+'px';}
  function text(selector,value){chapter.querySelector(selector).textContent=value;}
  function update(y){
    const region=y<top?'before':y>next?'after':'inside';
    if(region!=='inside'&&region===lastRegion)return null;
    lastRegion=region;
    const overall=clamp((y-top)/span),phase=sequence(overall),p=phase.storyP,s=sample(reduce.matches?1:p),exit=clamp((y-end)/Math.max(1,next-end)),presence=1-smooth(0,.25,exit);
    const properties={'intro-presence':phase.introPresence,'story-presence':phase.storyPresence,'closing-presence':phase.closingPresence*presence,'contact-presence':phase.contactPresence,'invitation-presence':phase.invitationPresence,'watermark-presence':phase.watermarkPresence};
    Object.entries(properties).forEach(([key,value])=>chapter.style.setProperty('--'+key,reduce.matches?1:value));
    for(const [el,visible] of [[intro,phase.introPresence>=.5],[layout,phase.storyPresence>=.5],[closing,phase.closingPresence*presence>=.5]]){el.inert=!reduce.matches&&!visible;el.setAttribute('aria-hidden',String(!reduce.matches&&!visible));}
    const vars={received:s.received,'receive-in':s.receiveIn,extracted:s.extract,located:s.located,filtered:s.filtered,matched:s.matched,'device-ready':s.deviceReady,'form-filled':s.formFilled,pressed:s.pressed,acknowledged:s.acknowledged,confirmed:s.confirmed,'result-in':s.resultIn,'address-presence':s.addressPresence,'ip-presence':s.ipPresence};
    Object.entries(vars).forEach(([key,value])=>chapter.style.setProperty('--'+key,value));
    steps.forEach((step,i)=>{const visible=reduce.matches||i===s.stage;step.style.setProperty('--presence',reduce.matches?1:s.weights[i]);step.style.setProperty('--enter',reduce.matches?0:(1-s.weights[i])*(p<targets[i]?1:-1));step.style.setProperty('--ready',i===1?s.received:i===3?s.deviceReady:1);step.inert=!visible;step.setAttribute('aria-hidden',String(!visible));step.dataset.active=String(visible);});
    art.forEach((layer,i)=>{layer.style.setProperty('--presence',s.weights[i]);layer.setAttribute('aria-hidden',String(i!==s.stage));});
    address.setAttribute('aria-hidden',String(s.addressPresence<.5));ip.setAttribute('aria-hidden',String(s.ipPresence<.5));
    if(active!==s.stage){active=s.stage;label.textContent=labels[active];}
    text('#source-action',s.received>.98?'Received by Fillo':'Send to Fillo');text('#receive-status',s.received>.98?'Form data received. Fillo is on it.':'Receiving the lead from your agent');
    text('#submission-label',s.acknowledged>.98?'Submitted':p>=.812?'Submitting…':'Submit form');
    text('#submit-status',s.acknowledged>.98?'Submission confirmed by the website':p>=.812?'Submitting the lead':'A fresh device ID for this submission');
    text('#website-status',s.acknowledged>.98?'Submission confirmed':p>=.812?'Waiting for the website’s response':'Fillo is entering the lead details');
    text('#ip-label',p>=.66?'Selected IP':'Precise IP selected');text('#match-status',s.matched>.98?'Address matched. IP selected.':s.filtered>.98?'Selecting the closest available IP':s.located>.98?'Narrowing by ZIP 78701':'Locating the address');
    caption.textContent=s.stage===0?'Repeated device ID · VPN or data-center IP':s.stage===1?(s.extract>0?'Separating the address from the lead data':'Your agent provides the data. Fillo takes over.'):s.stage===2?(s.matched>.98?'The lead’s address has its IP match':s.extract<.99?'The address moves out. The location match begins.':'Choosing the closest available IP'):s.stage===3?'Selected IP · New device ID · Human-like automation':'Lead ID + Trusted ID · Generated after submission';
    fields.forEach((field,i)=>{const fill=reduce.matches?1:fieldProgress(i,p),value=field.dataset.fill;field.textContent=value.slice(0,Math.floor(value.length*fill));field.parentElement.classList.toggle('typing',fill>0&&fill<1);field.parentElement.classList.toggle('filled',fill>=1);});
    const cards=objects(p,source);place(address,cards.address);place(ip,cards.ip);
    const state=nodeState(y),visible=!reduce.matches&&y>=top&&y<=next;
    if(state){
      const point=state.nodes[index],h=innerHeight,r=point.r*h,hole=Math.max(0,1.58*state.letterMorph-1)*100;
      for(const el of [fallback,sphereCaption]){el.style.left=point.x*document.documentElement.clientWidth+'px';el.style.top=point.y*h+'px';}
      fallback.style.width=fallback.style.height=r*2+'px';fallback.style.maskImage=hole>0?`radial-gradient(circle closest-side,transparent ${hole}%,#000 ${hole+.6}%)`:'none';
      sphereCaption.style.setProperty('--radius',r+'px');sphereCaption.style.setProperty('--confirmed',s.confirmed*phase.confirmationPresence*(1-exit));sphereCaption.style.setProperty('--caption-presence',s.weights[1]);
    }
    sphereCaption.style.opacity=fallback.style.opacity=visible?'1':'0';
    return visible?state:null;
  }
  chapter.querySelector('[data-start-story]').addEventListener('click',()=>scrollTo({top:top+span*toTimeline(0),behavior:reduce.matches?'instant':'smooth'}));
  window.TelzaFilloStory={measure,update,entryNodes,nodeState,index,get start(){return top;},get finish(){return next;}};
})();
