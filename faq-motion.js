/* The same five pieces: spheres -> rounded question mark -> spheres -> logo. */
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => {const t=clamp(value);return t*t*(3-2*t);};
  const mix = (a,b,t) => a+(b-a)*t;
  // Keep the question's spatial order: left arc, upper arc, right arc, stem, dot.
  // Matching nearby logo positions prevents the upper pieces exchanging places.
  const logoPoints=(typeof module!=='undefined'&&module.exports?require('./logo-geometry.js'):window.TelzaLogoGeometry).points;
  const geometry=typeof module!=='undefined'&&module.exports?require('./question-geometry.js'):window.TelzaQuestionGeometry;
  function shape(width,height,small=width<=760) {
    const frame={x:small?.75:.75,y:small?.24:.52,k:small?.087:Math.min(.21,width/height*.145)};
    const nodes=geometry.points.map(([x,y],i)=>({x:frame.x+x*frame.k*height/width,y:frame.y-y*frame.k,r:frame.k*(i===4?geometry.dotRadius:.21)}));
    return {nodes,frame};
  }
  function create({top,stageEnd,height,question,logo,closeAt}) {
    const start=top+height*.15;
    const formedAt=top+height*.49;
    const splitStart=stageEnd-height*.40,splitEnd=stageEnd-height*.04;
    // Follow the departing FAQ until the logo sits below every released piece.
    const releaseShift=Math.max(0,...question.nodes.map((node,i)=>node.y-logo[i].y+.06));
    const releaseAt=stageEnd+releaseShift*height;
    function sample(y) {
      const shift=Math.min(0,(stageEnd-y)/height);
      const morph=ease((y-start)/(formedAt-start))*(1-ease((y-splitStart)/(splitEnd-splitStart)));
      const departure=ease((y-releaseAt)/Math.max(1,closeAt-releaseAt));
      const nodes=question.nodes.map((node,i)=>y<=releaseAt?{...node,y:node.y+shift}:{
        x:mix(node.x,logo[i].x,departure),
        y:mix(node.y-releaseShift,logo[i].y,departure),
        r:mix(node.r,logo[i].r,departure)
      });
      return {nodes,join:0,question:morph,questionFrame:{...question.frame,y:question.frame.y+shift},
        phase:y>=closeAt?'logo-ready':y>releaseAt?'travelling':y>=splitStart?'separating':y>=formedAt?'question':'assembling'};
    }
    return {sample,start,formedAt,splitStart,splitEnd,releaseAt,releaseShift,closeAt};
  }
  const api={shape,create,logoPoints};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.TelzaFaqMotion=api;
})();
