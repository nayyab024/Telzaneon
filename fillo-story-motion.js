/* Pure, reversible choreography: one lead, one address and one selected IP. */
(() => {
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{const t=clamp(x);return t*t*(3-2*t);},smooth=(a,b,x)=>ease((x-a)/(b-a));
  // The opening and the demonstration share one pinned scene and one clock.
  // Keep the original 570 viewport-heights of travel, then add 150 for the finale.
  const narrativeEnd=570/720,playDuration=49000/narrativeEnd,demonstrationStart=.22;
  const toNarrativeTimeline=value=>narrativeEnd*clamp(value);
  const toTimeline=value=>toNarrativeTimeline(demonstrationStart+(1-demonstrationStart)*clamp(value));
  const closingProgress=value=>clamp((value-narrativeEnd)/(1-narrativeEnd));
  function sequence(value){const p=clamp(value/narrativeEnd),c=closingProgress(value),introMorph=smooth(.065,.082,p)*(1-smooth(.115,.14,p)),closingMorph=smooth(.42,.54,c);return{
    storyP:clamp((p-demonstrationStart)/(1-demonstrationStart)),
    introPresence:1-smooth(.145,.195,p),storyPresence:smooth(.165,demonstrationStart,p)*(1-smooth(.04,.28,c)),
    closingP:c,closingPresence:smooth(.04,.34,c),invitationPresence:smooth(.36,.54,c),contactPresence:smooth(.54,.72,c),
    confirmationPresence:1-smooth(0,.08,c),introMorph,closingMorph,
    // Land first, open into a letter, then close completely before departure.
    letterMorph:introMorph+closingMorph,
    watermarkPresence:1-.65*smooth(.145,demonstrationStart,p)
  };}
  function openingNode(value,entry,letter,setup){
    const p=clamp(value/narrativeEnd),leaving=p>.145,t=leaving?smooth(.145,demonstrationStart,p):smooth(.005,.065,p),a=leaving?letter:entry,b=leaving?setup:letter;
    return Object.fromEntries(['x','y','r'].map(key=>[key,a[key]+(b[key]-a[key])*t]));
  }
  function closingNode(value,success,letter){
    const t=smooth(.08,.42,closingProgress(value));
    return Object.fromEntries(['x','y','r'].map(key=>[key,success[key]+(letter[key]-success[key])*t]));
  }
  const targets=[0,.285,.602,.833,.99];
  const waypoints=[[0,'setup'],[.12,'setup'],[.21,'receive-start'],[.29,'receive-end'],[.44,'match-origin'],[.515,'match-origin'],[.585,'match-selected'],[.62,'match-selected'],[.70,'submit-start'],[.837,'submit-end'],[.94,'success'],[1,'success']];
  function sample(value){
    const p=clamp(value),a=smooth(.12,.18,p),b=smooth(.34,.42,p),c=smooth(.62,.70,p),d=smooth(.866,.926,p);
    const weights=[1-a,a*(1-b),b*(1-c),c*(1-d),d];
    return {p,weights,stage:weights.indexOf(Math.max(...weights)),receiveIn:a,extract:smooth(.31,.44,p),toSubmit:c,resultIn:d,
      received:smooth(.20,.27,p),located:smooth(.44,.475,p),filtered:smooth(.475,.515,p),matched:smooth(.515,.585,p),deviceReady:smooth(.668,.695,p),formFilled:smooth(.704,.800,p),
      pressed:smooth(.812,.826,p)*(1-smooth(.834,.846,p)),acknowledged:smooth(.846,.856,p),confirmed:smooth(.944,.98,p),
      addressPresence:smooth(.135,.18,p)*(1-smooth(.62,.68,p)),ipPresence:smooth(.55,.585,p)*(1-smooth(.866,.916,p))};
  }
  function position(value,anchors){const p=clamp(value);let a=waypoints[0],b=waypoints[1];for(let i=1;i<waypoints.length;i++){b=waypoints[i];if(p<=b[0])break;a=b;}const t=a[0]===b[0]?1:smooth(a[0],b[0],p),from=anchors[a[1]],to=anchors[b[1]];return{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t};}
  const mixRect=(a,b,t)=>Object.fromEntries(['x','y','width','height'].map(key=>[key,a[key]+(b[key]-a[key])*t]));
  function objects(value,source){const s=sample(value);return{address:mixRect(source,{x:38,y:342,width:245,height:110},s.extract),ip:mixRect({x:323,y:215,width:235,height:88},{x:310,y:8,width:262,height:70},s.toSubmit)};}
  function fieldProgress(i,p){return smooth(.704+i*.014,.730+i*.014,p);}
  function radius(scale){return Math.max(13,33*scale);}
  const api={clamp,ease,smooth,sequence,toTimeline,toNarrativeTimeline,narrativeEnd,playDuration,openingNode,closingNode,targets,waypoints,sample,position,objects,radius,fieldProgress};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.FilloStory=api;
})();
