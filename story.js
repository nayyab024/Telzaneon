/* Scroll stories for the Voice Agent and the WhatsApp bot.
   One stage at a time: the chapter's own sphere docks beside the active moment,
   the copy changes with it, and content marked data-from/data-to appears. */
(() => {
  const clamp=x=>Math.max(0,Math.min(1,x));
  const reduce=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:760px)');
  // Stages share this part of the pinned scroll. The remainder is a calm exit.
  const SHARE=.93;

  function create(chapter){
    const index=Number(chapter.dataset.chapter)||0,scene=chapter.querySelector('.scene'),slot=chapter.querySelector('.visual-slot'),artboard=chapter.querySelector('.artboard');
    const steps=[...chapter.querySelectorAll('.story-step')],count=steps.length;
    const docks=[...chapter.querySelectorAll('[data-dock]')].sort((a,b)=>a.dataset.dock-b.dataset.dock);
    const timed=[...chapter.querySelectorAll('[data-from]')],ticks=[...chapter.querySelectorAll('[data-goto]')];
    const modeButtons=[...chapter.querySelectorAll('[data-story-mode]')];
    let copy={};
    try{copy=JSON.parse(chapter.querySelector('script[type="application/json"]')?.textContent||'{}');}catch{copy={};}
    let top=0,span=1,anchors=[],stage=-1,mode=chapter.dataset.mode||'default';
    const holding=()=>window.TelzaJourneyMotion.holding(mobile.matches,innerHeight);
    const withPoint=point=>{const nodes=holding();nodes[index]={...point};return nodes;};
    const position=k=>top+span*SHARE*k/count;

    function measure(){
      top=chapter.offsetTop;span=Math.max(1,chapter.offsetHeight-innerHeight);
      if(artboard&&slot){const scale=Math.min(slot.clientWidth/600,slot.clientHeight/500)||1;artboard.style.setProperty('--art-scale',scale);}
      const bounds=scene.getBoundingClientRect(),w=document.documentElement.clientWidth,h=innerHeight;
      anchors=docks.map(dock=>{const r=dock.getBoundingClientRect();return{x:(r.left+r.width/2)/w,y:(r.top+r.height/2-bounds.top)/h,r:Math.max(12,r.width/2)/h};});
    }

    // Arrive at the first dock as the scene pins, rest at each dock, then glide.
    function keys(){
      if(reduce.matches||anchors.length!==count)return [];
      const out=[{at:top,nodes:withPoint(anchors[0]),join:0}];
      anchors.forEach((point,k)=>out.push({at:position(k+.28),nodes:withPoint(point),join:0},{at:position(k+.72),nodes:withPoint(point),join:0}));
      out.push({at:top+span,nodes:withPoint(anchors[count-1]),join:0});
      return out;
    }

    function apply(){
      chapter.dataset.stage=stage;
      steps.forEach((step,i)=>{const visible=reduce.matches||i===stage;step.dataset.active=String(visible);step.inert=!visible;step.setAttribute('aria-hidden',String(!visible));});
      timed.forEach(el=>{const from=Number(el.dataset.from),to=el.dataset.to===undefined?Infinity:Number(el.dataset.to);el.classList.toggle('on',stage>=from&&stage<=to);el.classList.toggle('now',stage===from);});
      docks.forEach((dock,i)=>{dock.classList.toggle('current',i===stage);dock.classList.toggle('past',i<stage);});
      ticks.forEach(tick=>{const k=Number(tick.dataset.goto);tick.classList.toggle('current',k===stage);tick.classList.toggle('past',k<stage);if(k===stage)tick.setAttribute('aria-current','step');else tick.removeAttribute('aria-current');});
      const strings=copy[mode]||copy.default||{};
      for(const [selector,values] of Object.entries(strings)){const el=chapter.querySelector(selector);if(el)el.textContent=values[Math.min(stage,values.length-1)];}
    }

    function update(y){
      const q=clamp((y-top)/span),next=reduce.matches?count-1:Math.min(count-1,Math.floor(q/SHARE*count));
      chapter.style.setProperty('--story',q.toFixed(4));
      if(next!==stage){stage=next;apply();}
    }

    function setMode(value){
      mode=value;chapter.dataset.mode=value;
      modeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.storyMode===value)));
      if(stage>=0)apply();
    }

    modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.storyMode)));
    ticks.forEach(tick=>tick.addEventListener('click',()=>{
      const k=Number(tick.dataset.goto);
      if(reduce.matches){steps[k]?.scrollIntoView({block:'center'});return;}
      scrollTo({top:position(k+.5),behavior:'smooth'});
    }));
    setMode(mode);
    return {chapter,index,measure,keys,update,get start(){return top;},get finish(){return top+span;}};
  }

  const stories=[...document.querySelectorAll('.chapter[data-story]')].map(create);
  window.TelzaStories={
    all:stories,
    for:chapter=>stories.find(story=>story.chapter===chapter),
    update:y=>stories.forEach(story=>story.update(y))
  };
})();
