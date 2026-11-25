/* Original round question mark, with a fuller stroke and a longer stem. */
(() => {
  const arc={x:0,y:.4,rx:.68,ry:.68,start:Math.PI,end:-1.05};
  const shoulder=[arc.rx*Math.cos(arc.end),arc.y+arc.ry*Math.sin(arc.end)];
  const stem=[shoulder,[.08,-.338],[0,-.47],[0,-.70]];
  const point=t=>{
    const s=1-t,weights=[s*s*s,3*s*s*t,3*s*t*t,t*t*t];
    return [0,1].map(axis=>stem.reduce((value,p,i)=>value+p[axis]*weights[i],0));
  };
  const points=Array.from({length:3},(_,i)=>{
    const angle=arc.start+(arc.end-arc.start)*(i+.5)/3;
    return [arc.x+arc.rx*Math.cos(angle),arc.y+arc.ry*Math.sin(angle)];
  });
  points.push(point(.5),[0,-1.17]);
  const geometry={arc,stem,points,radius:.18,dotRadius:.20};
  if(typeof module!=='undefined'&&module.exports)module.exports=geometry;
  else window.TelzaQuestionGeometry=geometry;
})();
