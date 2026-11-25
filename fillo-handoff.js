/* Close Fillo's letter before returning it; the next specialist departs only after it clears. */
(() => {
  const motion=typeof module!=='undefined'&&module.exports?require('./journey-motion.js'):window.TelzaJourneyMotion;
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t*t*(3-2*t);};
  function sample(value,letter,holding,next,index=0){
    const p=clamp(value),closeEnd=.16;
    const start=holding.map(n=>({...n}));
    start[index]={...letter,y:letter.y-Math.min(p,closeEnd)};
    if(p<=closeEnd)return{nodes:start,join:0,letterMorph:1-ease(p/closeEnd)};
    return{nodes:motion.interpolate(start,next,(p-closeEnd)/(1-closeEnd)),join:0,letterMorph:0};
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={sample};
  else window.TelzaFilloHandoff={sample};
})();
