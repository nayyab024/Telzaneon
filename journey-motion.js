/* Deterministic handoffs: the returning specialist clears before the next leaves. */
(() => {
  const clamp=x=>Math.max(0,Math.min(1,x));
  const ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
  const mix=(a,b,t)=>a+(b-a)*t;
  function interpolate(from,to,progress){
    return from.map((node,i)=>{
      const next=to[i],returning=node.r>.02&&next.r<.015,departing=node.r<.015&&next.r>.02;
      const phase=clamp(returning?progress/.48:departing?(progress-.52)/.48:progress);
      const t=ease(phase),x=departing?ease(phase*phase):t,y=returning?ease(phase*phase):t;
      // Clear the holding row at its small radius before expanding; shrink
      // before returning so adjacent parked spheres also keep their clearance.
      const size=ease(returning?progress/.25:departing?(progress-.68)/.32:progress);
      return {x:mix(node.x,next.x,x),y:mix(node.y,next.y,y),r:mix(node.r,next.r,size)};
    });
  }
  function holding(mobile,height){
    // Leave room beneath the fixed mobile header on short phones.
    const y=Math.max(mobile?.12:.14,82/height);
    return Array.from({length:5},(_,i)=>({x:mobile?.70+i*.047:.81+i*.027,y,r:.007}));
  }
  function product(active,mobile,height,exiting=false){
    // Order: Voice Agent, Fillo, WhatsApp, E-commerce, Custom. Voice, Fillo and
    // WhatsApp own their docking; these targets remain their safe fallbacks.
    const targets=mobile?[[.50,height<700?.58:.55,.072],[.53,.62,.044],[.30,height<700?.58:.62,.041],[.13,.43,.032],[.50,height<700?.55:.57,.048]]:[[.50,.58,.105],[.67,.50,.053],[.30,.52,.066],[.26,.48,.052],[.50,.58,.062]];
    let [x,y,r]=targets[active];
    const nodes=holding(mobile,height);nodes[active]={x,y,r};return nodes;
  }
  function heroFrame(width,height,mobile){
    if(mobile)return [0,height<=760?.59:.55,1,height<=760?.27:.32];
    const h=Math.min(.72,width*.53/height);
    return [width<=1100?.48:.46,.5-h/2,width<=1100?.52:.54,h];
  }
  const api={interpolate,holding,product,heroFrame};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.TelzaJourneyMotion=api;
})();
