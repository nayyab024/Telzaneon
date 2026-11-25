(() => {
 const root=document.documentElement,opening=document.querySelector('.opening'),stage=document.querySelector('.opening-stage'),family=document.querySelector('.family-links'),cards=[...family.children],hero=document.querySelector('.hero-copy'),heading=document.querySelector('.family-heading'),world=document.querySelector('.world'),chapters=[...document.querySelectorAll('.chapter')],approach=document.querySelector('#approach'),closing=document.querySelector('.closing'),questions=document.querySelector('.questions'),nav=document.querySelector('.journey-nav'),motion=document.querySelector('#motion-toggle');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),mobile=matchMedia('(max-width:760px)'),finePointer=matchMedia('(hover:hover) and (pointer:fine)'),clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)},mix=(a,b,t)=>a+(b-a)*t;
 const navLinks=[...nav.querySelectorAll('a')],custom=document.querySelector('#custom'),interludes=[...document.querySelectorAll('[data-interlude]')],stories=window.TelzaStories||{all:[],for:()=>null,update(){}},approachSteps=[...approach.querySelectorAll('article')];
 const surfaces=chapters.map(chapter=>({chapter,scene:chapter.querySelector('.scene'),x:0,y:0,tx:0,ty:0}));
 const approachStage=approach.querySelector('.approach-stage'),stations=[...approach.querySelectorAll('.approach-station')],faqStage=questions.querySelector('.faq-stage'),closingCopy=closing.querySelector('.closing-copy'),closingScene=closing.querySelector('.scene');
 let approachMotion=null,approachState=null,faqMotion=null,filloState=null;
 let paused=reduce.matches,raf=0,last=0,displayY=scrollY,targetY=scrollY,keys=[],end=0,dirty=true;
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('family-connections');svg.setAttribute('aria-hidden','true');family.before(svg);const paths=cards.map(()=>{const p=document.createElementNS(ns,'path');p.setAttribute('pathLength','1');svg.append(p);return p});
 const beam=document.createElementNS(ns,'svg'),beamPath=document.createElementNS(ns,'path');beam.classList.add('approach-beam');beam.setAttribute('aria-hidden','true');beam.append(beamPath);document.body.append(beam);
 const constellation=()=>window.TelzaJourneyMotion.holding(mobile.matches,innerHeight);
 function row(){const w=stage.clientWidth,small=mobile.matches,spread=(Math.min(1100,w*.9)+12)/(.9*w),f=small?[0,.35,1,.24]:[(1-spread)/2,.29,spread,.55];return Array.from({length:5},(_,i)=>({x:f[0]+f[2]*(.14+.18*i),y:f[1]+f[3]*.5-.12*f[3]/4.25,r:.43*f[3]/4.25}));}
 function mark(){
  const h=innerHeight,w=stage.clientWidth,small=mobile.matches,k=small?(h<700?.065:.075):Math.min(.13,w*.14/h),cx=small?.5:.74;
  const points=window.TelzaFaqMotion.logoPoints;
  let cy=small?(h<700?.74:.69):.50;
  if(!small){
   const copy=closingCopy.getBoundingClientRect(),scene=closingScene.getBoundingClientRect();
   const copyCenter=(copy.top-scene.top+copy.height/2)/h;
   // Centre the complete silhouette beside the complete copy, including its CTA.
   const top=Math.min(...points.map(([,y,r])=>-y-r))*k,bottom=Math.max(...points.map(([,y,r])=>-y+r))*k;
   cy=copyCenter-(top+bottom)/2;
  }
  return points.map(([x,y,r])=>({x:cx+x*k*h/w,y:cy-y*k,r:r*k}));
 }
 function familyNodes(){
  if(!mobile.matches)return row();
  const w=stage.clientWidth,h=innerHeight;
  return cards.map(card=>({x:(family.offsetLeft+20)/w,y:(family.offsetTop+card.offsetTop+card.offsetHeight/2)/h,r:Math.min(20,card.offsetHeight*.28)/h}));
 }
 function measure(){end=opening.offsetHeight-innerHeight;keys=[{at:end,nodes:familyNodes(),join:0}];const m=mobile.matches;
 // Stories dock their own sphere. Fillo hands over to whatever follows it.
 stories.all.forEach(story=>story.measure());
 const fillo=document.querySelector('#fillo'),afterFillo=fillo&&fillo.nextElementSibling,followingStory=afterFillo&&stories.for(afterFillo);
 window.TelzaFilloStory.measure(followingStory?.keys()[0]?.nodes);
 chapters.forEach((s,i)=>{if(s.id==='fillo'){keys.push({at:s.offsetTop,nodes:window.TelzaFilloStory.entryNodes(),join:0});return;}const story=stories.for(s),storyKeys=story?story.keys():[];if(storyKeys.length){keys.push(...storyKeys);return;}const span=s.offsetHeight-innerHeight;keys.push({at:s.offsetTop,nodes:window.TelzaJourneyMotion.product(i,m,innerHeight),join:0});keys.push({at:s.offsetTop+span*.85,nodes:window.TelzaJourneyMotion.product(i,m,innerHeight,true),join:0});});
 // Detail sections between chapters: every specialist waits in the holding row.
 interludes.forEach(section=>{keys.push({at:section.offsetTop-innerHeight*.5,nodes:constellation(-1),join:0});keys.push({at:Math.max(section.offsetTop-innerHeight*.5,section.offsetTop+section.offsetHeight-innerHeight),nodes:constellation(-1),join:0});});
 const w=stage.clientWidth,h=innerHeight,stageTop=approachStage.getBoundingClientRect().top;
 const landings=stations.map(station=>{const box=station.getBoundingClientRect();return {x:box.left/w,y:(box.top-stageTop)/h,r:Math.min(20,Math.max(12,w*.0125))/h}});
 const questionShape=window.TelzaFaqMotion.shape(w,h,m);
 faqMotion=window.TelzaFaqMotion.create({top:questions.offsetTop,stageEnd:questions.offsetTop+questions.offsetHeight-faqStage.offsetHeight,height:h,question:questionShape,logo:mark(),closeAt:closing.offsetTop+h*.15});
 approachMotion=window.TelzaApproachMotion.create({start:approach.offsetTop,end:approach.offsetTop+Math.max(1,approach.offsetHeight-approachStage.offsetHeight),closeAt:faqMotion.start,width:w,height:h,holding:constellation(-1),landings,logo:questionShape.nodes,lead:Math.min(32,w*.045)/w,clearance:.02});
 beam.setAttribute('viewBox',`0 0 ${w} ${h}`);
 keys.push({at:approach.offsetTop-h*.2,nodes:constellation(-1),join:0});keys.push({at:approach.offsetTop,nodes:constellation(-1),join:0});keys.push({at:approachMotion.end,nodes:landings,join:0});keys.push({at:faqMotion.closeAt,nodes:mark(),join:0});keys.push({at:closing.offsetTop+h*.42,nodes:mark(),join:1});keys.sort((a,b)=>a.at-b.at);
 svg.setAttribute('viewBox',`0 0 ${stage.clientWidth} ${stage.clientHeight}`);const anchors=window.telzaSculpture?.productAnchors(stage.clientWidth,stage.clientHeight);if(anchors)paths.forEach((p,i)=>{const card=cards[i];if(m){const node=familyNodes()[i],cy=node.y*h;p.setAttribute('d',`M${node.x*w+node.r*h+2} ${cy}H${family.offsetLeft+64}`);}else{const x=family.offsetLeft+card.offsetLeft+card.offsetWidth/2;p.setAttribute('d',`M${anchors[i].x} ${anchors[i].y}L${x} ${family.offsetTop+card.offsetTop}`)}});dirty=true;wake();}
 function journey(y){if(filloState&&y>=window.TelzaFilloStory.start&&y<=window.TelzaFilloStory.finish)return filloState;if(approachState&&y>=approachMotion.start&&y<=approachMotion.closeAt)return approachState;if(faqMotion&&y>=faqMotion.start&&y<=faqMotion.closeAt)return faqMotion.sample(y);let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++){if(y<=keys[i].at){a=keys[i-1];b=keys[i];break;}a=keys[i];}const t=b.at<=a.at?1:clamp((y-a.at)/(b.at-a.at));return {nodes:window.TelzaJourneyMotion.interpolate(a.nodes,b.nodes,t),join:mix(a.join,b.join,smooth(0,1,t))};}
 function frame(now){raf=0;if(document.hidden)return;const dt=Math.min(last?now-last:16,90);last=now;displayY+=(targetY-displayY)*(1-Math.exp(-dt/90));if(Math.abs(targetY-displayY)<.1)displayY=targetY;const p=clamp(displayY/Math.max(1,end)),split=smooth(.08,.55,p),ho=1-smooth(.08,.28,p),fo=smooth(.48,.60,p),line=smooth(.57,.71,p),reveal=smooth(.73,.91,p);
 root.style.setProperty('--split',split);root.style.setProperty('--hero-opacity',reduce.matches?1:ho);root.style.setProperty('--family-opacity',reduce.matches?1:fo);family.style.setProperty('--cards',reduce.matches?1:reveal);svg.style.setProperty('--connection',line);hero.inert=!reduce.matches&&ho<.1;family.inert=!reduce.matches&&reveal<.98;heading.setAttribute('aria-hidden',String(!reduce.matches&&fo<.1));
 let active=-1;chapters.forEach((s,i)=>{const q=clamp((displayY-s.offsetTop)/Math.max(1,s.offsetHeight-innerHeight));s.style.setProperty('--p',q);s.style.setProperty('--action',reduce.matches?1:smooth(.10,.55,q));s.style.setProperty('--result',reduce.matches?1:smooth(.50,.85,q));if(displayY>=s.offsetTop-innerHeight*.3&&displayY<s.offsetTop+s.offsetHeight-innerHeight*.3)active=i;});
 filloState=window.TelzaFilloStory.update(displayY);stories.update(displayY);
 nav.classList.toggle('visible',active>=0&&!reduce.matches);navLinks.forEach((a,i)=>{a.classList.toggle('active',i===active);if(i===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 nav.style.setProperty('--journey-progress',clamp((displayY-chapters[0].offsetTop)/(custom.offsetTop+custom.offsetHeight-innerHeight-chapters[0].offsetTop)));
 const approachShift=approachStage.getBoundingClientRect().top/innerHeight;
 approachState=approachMotion.sample(displayY,approachShift);
 questions.dataset.phase=faqMotion.sample(displayY).phase;
 approach.dataset.phase=approachState.phase;approach.dataset.landed=approachState.landed.filter(Boolean).length;approach.dataset.struck=approachState.struck.filter(Boolean).length;
 approach.style.setProperty('--approach',approachState.progress);
 stations.forEach((station,i)=>{station.classList.toggle('landed',reduce.matches||approachState.landed[i]);station.classList.toggle('struck',reduce.matches||approachState.struck[i]);station.style.setProperty('--hit',reduce.matches?0:approachState.glow[i]);});
 const currentApproachStep=Math.max(0,approachState.landed.filter(Boolean).length-1);
 approachSteps.forEach((step,i)=>{step.classList.toggle('reached',reduce.matches||approachState.struck[i]);step.classList.toggle('current',i===currentApproachStep)});
 const beamY=(approachMotion.landings[0].y+approachShift)*innerHeight,beamStart=(approachMotion.landings[0].x-approachMotion.lead)*stage.clientWidth,beamEnd=approachState.lineX*stage.clientWidth;
 beamPath.setAttribute('d',`M${beamStart} ${beamY}H${beamEnd}`);beam.style.opacity=approachState.progress>.12&&beamY>0&&beamY<innerHeight?'1':'0';
 // Pointer depth is independent of the scroll transforms and never moves text.
 let pointerMoving=false;surfaces.forEach(s=>{const enabled=!paused&&!reduce.matches&&finePointer.matches;if(!enabled)s.tx=s.ty=0;const ease=enabled?1-Math.exp(-dt/170):1;s.x+=(s.tx-s.x)*ease;s.y+=(s.ty-s.y)*ease;if(Math.abs(s.tx-s.x)<.002)s.x=s.tx;if(Math.abs(s.ty-s.y)<.002)s.y=s.ty;pointerMoving||=s.x!==s.tx||s.y!==s.ty;s.scene.style.setProperty('--pointer-x',s.x.toFixed(4));s.scene.style.setProperty('--pointer-y',s.y.toFixed(4));});
 const footerTop=closing.offsetTop+closing.offsetHeight,opacity=1-smooth(footerTop-innerHeight*.65,footerTop,displayY);world.style.opacity=opacity;
 if(!reduce.matches&&opacity>0){if(displayY<=end){
   if(mobile.matches&&p>.55){const t=smooth(.55,.71,p),target=familyNodes(),nodes=row().map((n,i)=>({x:mix(n.x,target[i].x,t),y:mix(n.y,target[i].y,t),r:mix(n.r,target[i].r,t)}));window.telzaSculpture?.render(1,now,nodes);}
   else window.telzaSculpture?.render(split,now);
  }else{const state=journey(displayY);const exit=Math.max(0,(displayY-(closing.offsetTop+closing.offsetHeight-innerHeight))/innerHeight);state.nodes.forEach(n=>n.y-=exit);window.telzaSculpture?.render(1,now,state.nodes,state.join,state.glow,state.question,state.questionFrame,state.letterMorph)}}
 dirty=false;if(displayY!==targetY||pointerMoving||(!paused&&!reduce.matches&&displayY<end*.55))raf=requestAnimationFrame(frame);
 }
 function wake(){if(!raf)raf=requestAnimationFrame(frame)}
 function resetDepth(){surfaces.forEach(s=>s.tx=s.ty=0);wake()}
 surfaces.forEach(s=>{s.scene.addEventListener('pointermove',event=>{if(paused||reduce.matches||!finePointer.matches||event.pointerType==='touch')return;if(event.target.closest('button,a')){s.tx=s.ty=0;}else{s.tx=clamp(event.clientX/innerWidth)*2-1;s.ty=clamp(event.clientY/innerHeight)*2-1;}wake()},{passive:true});s.scene.addEventListener('pointerleave',()=>{s.tx=s.ty=0;wake()});});
 addEventListener('blur',resetDepth);finePointer.addEventListener('change',resetDepth);
 addEventListener('scroll',()=>{targetY=scrollY;resetDepth()},{passive:true});addEventListener('resize',measure);document.fonts.ready.then(measure);const layoutObserver=new ResizeObserver(measure);layoutObserver.observe(family);layoutObserver.observe(approachStage);layoutObserver.observe(faqStage);layoutObserver.observe(closingCopy);addEventListener('load',measure);document.addEventListener('visibilitychange',()=>{last=0;resetDepth();if(!document.hidden){targetY=scrollY;wake()}});
 function applyMotion(){motion.textContent=paused?'Resume motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));motion.setAttribute('aria-label',motion.textContent);motion.title=motion.textContent;root.dataset.motionPaused=String(paused);window.telzaSculpture?.setPaused(paused);resetDepth()}
 motion.addEventListener('click',()=>{paused=!paused;applyMotion()});reduce.addEventListener('change',()=>{paused=reduce.matches;applyMotion();measure()});
 document.querySelectorAll('a[href="#family"]').forEach(a=>a.addEventListener('click',e=>{if(reduce.matches)return;e.preventDefault();a.blur();scrollTo({top:end,behavior:'instant'});history.replaceState(null,'','#family')}));
 document.querySelectorAll('[data-route-choice]').forEach(b=>b.addEventListener('click',()=>{custom.dataset.route=b.dataset.routeChoice;custom.dataset.routePreview='true';document.querySelectorAll('[data-route-choice]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelector('#route-status').textContent=b.dataset.routeChoice==='team'?'The right enquiry, straight to your team.':'An exception, with a person in the loop.';}));
 document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-light]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelector('.commerce').style.setProperty('--light',{soft:.35,reading:.65,bright:1}[b.dataset.light]);document.querySelector('.lamp').setAttribute('aria-label',`Sculptural table lamp, ${b.dataset.light} brightness`)}));
 applyMotion();measure();if(location.hash==='#family'&&!reduce.matches)requestAnimationFrame(()=>scrollTo({top:end,behavior:'instant'}));
})();
