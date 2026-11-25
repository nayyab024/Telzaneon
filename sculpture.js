/* Telza's actual mark: an independent top dot and two connected pairs.
   Round matte spheres, connected only within the two pairs, split on scroll. */
(() => {
  const model=window.TelzaLogoGeometry,questionModel=window.TelzaQuestionGeometry,scalar=value=>Number.isInteger(value)?`${value}.0`:String(value),vector=point=>`vec3(${point.map(scalar).join(',')})`,vector2=point=>`vec2(${point.map(scalar).join(',')})`;
  const canvas = document.querySelector('#sculpture');
  const gl = canvas.getContext('webgl', { alpha:true, antialias:false, powerPreference:'high-performance', premultipliedAlpha:false });
  if (!gl) { document.body.classList.add('no-webgl'); return; }
  const vertex = `attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}`;
  const fragment = `
  precision highp float;
  uniform vec4 uFrame;
  uniform float uTime;
  uniform float uSplit;
  uniform vec2 uPointer;
  uniform vec3 uBrandColor;
  uniform vec3 uRimColor;
  uniform float uJourney;
  uniform float uJoin;
  uniform float uQuestion;
  uniform float uLetterMorph;
  uniform float uLetterIndex;
  uniform vec3 uQuestionFrame;
  uniform vec3 uNodes[5];
  uniform float uNodeGlow[5];
  const vec3 MARK_LEFT=${vector(model.points[0])};
  const vec3 MARK_TOP=${vector(model.points[1])};
  const vec3 MARK_RIGHT=${vector(model.points[2])};
  const vec3 MARK_CENTRE=${vector(model.points[3])};
  const vec3 MARK_BOTTOM=${vector(model.points[4])};
  const float CAMERA_DEPTH=${scalar(model.camera.depth)};
  const float CAMERA_FOCAL=${scalar(model.camera.focal)};
  const float CAMERA_PLANE=${scalar(model.camera.plane)};
  const float MARK_YAW=${scalar(model.pose.yaw)};
  const float MARK_PITCH=${scalar(model.pose.pitch)};
  const vec2 QUESTION_CENTRE=${vector2([questionModel.arc.x,questionModel.arc.y])};
  const float QUESTION_ARC_RADIUS=${scalar(questionModel.arc.rx)};
  const vec2 STEM_A=${vector2(questionModel.stem[0])};
  const vec2 STEM_B=${vector2(questionModel.stem[1])};
  const vec2 STEM_C=${vector2(questionModel.stem[2])};
  const vec2 STEM_D=${vector2(questionModel.stem[3])};
  const float QUESTION_RADIUS=${scalar(questionModel.radius)};
  float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
  float capsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),.00000001),0.,1.);return length(pa-ba*h)-r;}
  float logoPair(vec3 p,vec3 a,vec3 b,float connection,float extraBlend){
    float pair=min(length(p-vec3(a.xy,0.))-a.z,length(p-vec3(b.xy,0.))-b.z);
    if(connection>0.){
      float bar=${scalar(model.joint.radius)}*connection,cut=(1.-connection)*${scalar(model.joint.cut)};
      float blend=(${scalar(model.joint.blend)}+extraBlend)*connection+${scalar(model.joint.epsilon)};
      pair=smin(pair,capsule(p,vec3(a.xy,0.),vec3(b.xy,0.),bar)+cut,blend);
    }
    return pair;
  }
  vec3 splitNode(vec3 node,float slot,float spacing,float travel,float settle){
    return vec3(mix(node.x,slot*spacing,travel),mix(node.y,.12,settle),mix(node.z,MARK_TOP.z,travel));
  }
  mat2 rotate(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
  float questionArc(vec3 p,float index,float radius){
    float scale=uQuestionFrame.z;
    vec3 q=p-vec3(uQuestionFrame.xy+QUESTION_CENTRE*scale,0.);
    float span=(${scalar(questionModel.arc.start)}-(${scalar(questionModel.arc.end)}))/3.;
    float mid=${scalar(questionModel.arc.start)}-(index+.5)*span;
    float lo=mid-span*.5*uQuestion,hi=mid+span*.5*uQuestion;
    float angle=atan(q.y,q.x),arcRadius=QUESTION_ARC_RADIUS*scale;
    float d=length(vec2(length(q.xy)-arcRadius,q.z));
    if(angle<lo||angle>hi){
      d=min(length(q-vec3(cos(lo)*arcRadius,sin(lo)*arcRadius,0.)),length(q-vec3(cos(hi)*arcRadius,sin(hi)*arcRadius,0.)));
    }
    return d-mix(radius,QUESTION_RADIUS*scale,uQuestion);
  }
  vec2 questionStem(float t){
    float s=1.-t;
    return s*s*s*STEM_A+3.*s*s*t*STEM_B+3.*s*t*t*STEM_C+t*t*t*STEM_D;
  }
  float questionShape(vec3 p){
    float body=min(questionArc(p,0.,uNodes[0].z),min(questionArc(p,1.,uNodes[1].z),questionArc(p,2.,uNodes[2].z)));
    // Closest point on the continuous cubic keeps the stem smoothly shaded.
    float lo=0.,hi=1.,t=.5;
    for(int i=0;i<12;i++){
      vec2 curve=mix(uNodes[3].xy,uQuestionFrame.xy+questionStem(t)*uQuestionFrame.z,uQuestion);
      float s=1.-t;
      vec2 tangent=3.*s*s*(STEM_B-STEM_A)+6.*s*t*(STEM_C-STEM_B)+3.*t*t*(STEM_D-STEM_C);
      if(dot(curve-p.xy,tangent)>0.)hi=t;else lo=t;
      t=(lo+hi)*.5;
    }
    vec3 nearest=vec3(mix(uNodes[3].xy,uQuestionFrame.xy+questionStem(t)*uQuestionFrame.z,uQuestion),0.);
    vec3 start=vec3(mix(uNodes[3].xy,uQuestionFrame.xy+STEM_A*uQuestionFrame.z,uQuestion),0.);
    vec3 finish=vec3(mix(uNodes[3].xy,uQuestionFrame.xy+STEM_D*uQuestionFrame.z,uQuestion),0.);
    body=min(body,min(length(p-nearest),min(length(p-start),length(p-finish)))-mix(uNodes[3].z,QUESTION_RADIUS*uQuestionFrame.z,uQuestion));
    return min(body,length(p-vec3(uNodes[4].xy,0.))-uNodes[4].z);
  }
  // A sphere, or Fillo's sphere opening into the letter o.
  float nodeShape(vec3 p,vec3 node,float morph){
    vec3 q=p-vec3(node.xy,0.);
    if(morph<=0.)return length(q)-node.z;
    float majorRadius=node.z*.79*morph;
    return length(vec2(length(q.xy)-majorRadius,q.z))-(node.z-majorRadius);
  }
  vec3 orient(vec3 p){
    float s=smoothstep(0.,${scalar(model.heroSplit.spreadEnd)},uSplit),motion=1.-smoothstep(0.,.65,uSplit);
    p.x-=uPointer.x*.065*motion;
    p.y-=(.05*sin(uTime*.72)-uPointer.y*.05)*motion;
    p.xz=rotate(MARK_YAW*(1.-s)+(.08*sin(uTime*.55)-uPointer.x*.28)*motion)*p.xz;
    p.yz=rotate(MARK_PITCH*(1.-s)+(.04*sin(uTime*.63)+uPointer.y*.18)*motion)*p.yz;
    p.xy=rotate(.018*sin(uTime*.43)*motion)*p.xy;
    return p;
  }
  float scene(vec3 p){
    if(uJourney>.5){
      if(uQuestion>0.)return questionShape(p);
      if(uJoin>0.){
        // Work in the hero's model units, so joints scale with the whole mark.
        float scale=uNodes[3].z/MARK_CENTRE.z;
        vec2 centre=uNodes[3].xy-MARK_CENTRE.xy*scale;
        vec3 q=(p-vec3(centre,0.))/scale;
        q.xz=rotate(MARK_YAW*uJoin)*q.xz;
        q.yz=rotate(MARK_PITCH*uJoin)*q.yz;
        vec3 a=vec3((uNodes[0].xy-centre)/scale,uNodes[0].z/scale);
        vec3 b=vec3((uNodes[1].xy-centre)/scale,uNodes[1].z/scale);
        vec3 c=vec3((uNodes[2].xy-centre)/scale,uNodes[2].z/scale);
        vec3 d=vec3((uNodes[3].xy-centre)/scale,uNodes[3].z/scale);
        vec3 e=vec3((uNodes[4].xy-centre)/scale,uNodes[4].z/scale);
        float left=logoPair(q,a,d,uJoin,0.);
        float right=logoPair(q,c,e,uJoin,${scalar(model.joint.rightBlend)});
        return min(length(q-vec3(b.xy,0.))-b.z,min(left,right))*scale;
      }
      float a=nodeShape(p,uNodes[0],abs(uLetterIndex)<.5?uLetterMorph:0.);
      float b=nodeShape(p,uNodes[1],abs(uLetterIndex-1.)<.5?uLetterMorph:0.);
      float c=nodeShape(p,uNodes[2],abs(uLetterIndex-2.)<.5?uLetterMorph:0.);
      float d=nodeShape(p,uNodes[3],abs(uLetterIndex-3.)<.5?uLetterMorph:0.);
      float e=nodeShape(p,uNodes[4],abs(uLetterIndex-4.)<.5?uLetterMorph:0.);
      return min(a,min(b,min(c,min(d,e))));
    }
    float s=smoothstep(0.,${scalar(model.heroSplit.spreadEnd)},uSplit);
    vec3 q=orient(p);
    float spacing=.36*(uFrame.z/uFrame.w)*CAMERA_PLANE;
    float settle=smoothstep(${scalar(model.heroSplit.settleStart)},1.,uSplit);
    // Proportions sampled from assets/telza-icon.png (256 × 256).
    // The bottom dot travels left; the right dot stays on the outside.
    // Keep vertical clearance until the horizontal spacing can fit the spheres.
    vec3 a=splitNode(MARK_LEFT,${scalar(model.heroSplit.rowSlots[0])},spacing,s,settle);
    vec3 b=splitNode(MARK_CENTRE,${scalar(model.heroSplit.rowSlots[3])},spacing,s,settle);
    vec3 c=splitNode(MARK_TOP,${scalar(model.heroSplit.rowSlots[1])},spacing,s,settle);
    vec3 d=splitNode(MARK_RIGHT,${scalar(model.heroSplit.rowSlots[2])},spacing,s,settle);
    vec3 e=splitNode(MARK_BOTTOM,${scalar(model.heroSplit.rowSlots[4])},spacing,s,settle);
    float connection=1.-smoothstep(.05,.40,s);
    float leftPair=logoPair(q,a,b,connection,0.);
    float rightPair=logoPair(q,d,e,connection,${scalar(model.joint.rightBlend)});
    float topDot=length(q-vec3(c.xy,0.))-c.z;
    // Union only the two approved connections. Keep the three pieces separate.
    return min(topDot,min(leftPair,rightPair));
  }
  vec3 normal(vec3 p){float scale=uJourney>.5?mix(1.,uNodes[3].z/MARK_CENTRE.z,uJoin):1.;vec2 e=vec2(.002*scale,0.);return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));}
  void main(){
    vec2 local=gl_FragCoord.xy-uFrame.xy;
    if(local.x<0.||local.y<0.||local.x>uFrame.z||local.y>uFrame.w){gl_FragColor=vec4(0.);return;}
    vec2 uv=(local*2.-uFrame.zw)/uFrame.w;
    float halo=0.,surfaceGlow=0.;
    if(uJourney>.5&&(uNodeGlow[0]+uNodeGlow[1]+uNodeGlow[2]+uNodeGlow[3]+uNodeGlow[4])>0.){
      vec2 plane=uv*CAMERA_PLANE;
      for(int i=0;i<5;i++){
        float radius=uNodes[i].z,d=length(plane-uNodes[i].xy);
        float falloff=max(0.,d-radius)/max(radius*.55,.001);
        halo=max(halo,uNodeGlow[i]*exp(-falloff*falloff)*.32);
        surfaceGlow=max(surfaceGlow,uNodeGlow[i]*(1.-smoothstep(radius*.98,radius*1.08,d)));
      }
    }
    vec3 ro=vec3(0.,0.,CAMERA_DEPTH);vec3 rd=normalize(vec3(uv,-CAMERA_FOCAL));
    float cameraScale=1.;
    if(uJourney>.5&&uJoin>0.){
      float scale=uNodes[3].z/MARK_CENTRE.z;
      vec2 centre=uNodes[3].xy-MARK_CENTRE.xy*scale;
      // Ease from the travelling camera to a centred, proportionally scaled
      // hero camera. Off-axis perspective must not distort the closing mark.
      cameraScale=mix(1.,scale,uJoin);
      ro=vec3(centre*uJoin,CAMERA_DEPTH*cameraScale);
      rd=normalize(vec3(uv*CAMERA_PLANE,0.)-ro);
    }
    // A ray can graze the silhouette without hitting its centre. Track its
    // closest approach in pixel units, retaining fractional edge coverage.
    // Multisampling the fullscreen triangle alone cannot smooth an SDF edge.
    float travel=0.,dist=0.,nearest=1e6,edgeTravel=0.;bool hit=false;
    for(int i=0;i<80;i++){
      vec3 samplePoint=ro+rd*travel;dist=scene(samplePoint);
      float footprint=max(travel/(2.*uFrame.w*cameraScale),.0001);
      float proximity=dist/footprint;
      if(proximity<nearest){nearest=proximity;edgeTravel=travel;}
      if(dist<.00035*cameraScale){hit=true;break;}
      travel+=max(dist*.85,.00015);if(travel>14.)break;
    }
    float coverage=hit?1.:1.-smoothstep(0.,1.25,nearest);
    if(coverage<=0.){gl_FragColor=vec4(uRimColor,halo);return;}
    if(!hit)travel=edgeTravel;
    vec3 p=ro+rd*travel,n=normal(p),v=-rd;
    float motion=1.-smoothstep(0.,.65,uSplit);
    vec3 light=normalize(vec3(-.85+uPointer.x*.22*motion,1.2-uPointer.y*.16*motion,1.3));
    float diffuse=max(dot(n,light),0.);
    float fresnel=pow(1.-max(dot(n,v),0.),2.8);
    // Broad matte lighting describes spherical volume without chrome bands.
    vec3 lime=uBrandColor;
    float fill=max(dot(n,normalize(vec3(.8,.2,.6))),0.);
    vec3 base=lime*(.22+.66*diffuse+.12*fill);
    float softLight=pow(max(dot(reflect(-light,n),v),0.),28.);
    base+=mix(lime,vec3(1.),.45)*softLight*.09;
    base+=uRimColor*fresnel*.035;
    // Illuminate the opaque surface itself. Only the exterior bloom has alpha.
    base+=uRimColor*surfaceGlow*(.19+fresnel*.13);
    base=pow(base,vec3(.94));
    gl_FragColor=vec4(base,coverage);
  }`;
  function shader(type, source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  try {
    const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Sculpture program unavailable');
    gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const frameUniform=gl.getUniformLocation(program,'uFrame'),time=gl.getUniformLocation(program,'uTime'),split=gl.getUniformLocation(program,'uSplit'),pointer=gl.getUniformLocation(program,'uPointer');
    const journeyUniform=gl.getUniformLocation(program,'uJourney'),joinUniform=gl.getUniformLocation(program,'uJoin'),nodesUniform=gl.getUniformLocation(program,'uNodes[0]'),glowUniform=gl.getUniformLocation(program,'uNodeGlow[0]'),noGlow=new Float32Array(5);
    const questionUniform=gl.getUniformLocation(program,'uQuestion'),questionFrameUniform=gl.getUniformLocation(program,'uQuestionFrame');
    const letterUniform=gl.getUniformLocation(program,'uLetterMorph');
    gl.uniform1f(gl.getUniformLocation(program,'uLetterIndex'),Number(document.querySelector('#fillo')?.dataset.chapter)||0);
    const maxDimension=Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),gl.getParameter(gl.MAX_TEXTURE_SIZE));
    const brandStyles=getComputedStyle(document.documentElement),rgb=(name,fallback)=>{const hex=brandStyles.getPropertyValue(name).trim()||fallback;return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);};
    gl.uniform3fv(gl.getUniformLocation(program,'uBrandColor'),rgb('--sculpture-color','#2ef006'));gl.uniform3fv(gl.getUniformLocation(program,'uRimColor'),rgb('--sculpture-rim','#14c9b8'));
    const stacked=matchMedia('(max-width:760px)'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),finePointer=matchMedia('(hover: hover) and (pointer: fine)'),stage=document.querySelector('.opening-stage');
    let paused=reduce.matches,last=0,clock=0,pointerX=0,pointerY=0,targetX=0,targetY=0,currentSplit=0,hitArea=null;
    const resetPointer=()=>{targetX=0;targetY=0;};
    stage.addEventListener('pointermove',event=>{
      if(paused||reduce.matches||!finePointer.matches||event.pointerType==='touch'||currentSplit>=.65||!hitArea){resetPointer();return;}
      const {left,top,width,height}=hitArea,x=event.clientX-left,y=event.clientY-top;
      if(x<0||x>width||y<0||y>height||event.target.closest('a,button')){resetPointer();return;}
      targetX=Math.max(-1,Math.min(1,x/width*2-1));targetY=Math.max(-1,Math.min(1,y/height*2-1));
    },{passive:true});
    stage.addEventListener('pointerleave',resetPointer);window.addEventListener('blur',resetPointer);finePointer.addEventListener('change',resetPointer);
    document.addEventListener('visibilitychange',()=>{last=0;resetPointer();});
    reduce.addEventListener('change',()=>{resetPointer();pointerX=0;pointerY=0;last=0;});
    // Buffer dimensions change only with the actual viewport, never with scroll.
    // Resize and draw are synchronous in the same callback; no cleared frame can paint.
    function productFrame(width){
      const spread=(Math.min(1100,width*.9)+12)/(.9*width);
      return stacked.matches?[0,.35,1,.24]:[(1-spread)/2,.29,spread,.55];
    }
    function productAnchors(width,height){
      const f=productFrame(width),radius=.43,depth=8.5,centerY=.12;
      // Project the bottom tangent of the actual sphere, rather than its centre.
      const lowerSlope=(centerY*depth-radius*Math.sqrt(depth*depth+centerY*centerY-radius*radius))/(depth*depth-radius*radius);
      const y=(f[1]+f[3]*.5-2*f[3]*lowerSlope)*height;
      return Array.from({length:5},(_,i)=>({x:(f[0]+f[2]*(.14+.18*i))*width,y}));
    }
    function render(value,now,nodes=null,join=0,glow=null,question=0,questionFrame=null,letterMorph=0){
      const width=canvas.clientWidth,height=canvas.clientHeight;
      if(!width||!height)return;
      // Render at 2x CSS resolution, including ordinary displays. Fractional
      // edge coverage keeps silhouettes sharp without a post-process blur.
      const ratio=Math.min(2,Math.sqrt(8000000/(width*height)),maxDimension/width,maxDimension/height);
      const w=Math.round(width*ratio),h=Math.round(height*ratio);
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      const dt=last?Math.min(Math.max((now-last)/1000,0),.1):0;last=now;currentSplit=value;
      if(value>=.65)resetPointer();
      if(!paused&&!reduce.matches){clock+=dt;const ease=1-Math.exp(-dt/.22);pointerX+=(targetX-pointerX)*ease;pointerY+=(targetY-pointerY)*ease;}
      const mobile=stacked.matches,short=height<=760;
      const initial=window.TelzaJourneyMotion.heroFrame(width,height,mobile);
      hitArea={left:initial[0]*width,top:initial[1]*height,width:initial[2]*width,height:initial[3]*height};
      const final=productFrame(width);
      const spreadT=Math.min(1,Math.max(0,value/model.heroSplit.spreadEnd)),spread=spreadT*spreadT*(3-2*spreadT);
      const frame=nodes?[0,0,1,1]:initial.map((v,i)=>v+(final[i]-v)*spread);
      gl.uniform1f(journeyUniform,nodes?1:0);
      gl.uniform1f(joinUniform,join);
      gl.uniform1f(questionUniform,question);
      gl.uniform1f(letterUniform,Math.max(0,Math.min(1,letterMorph)));
      if(questionFrame)gl.uniform3f(questionFrameUniform,(questionFrame.x-.5)*width/height*4.25,(.5-questionFrame.y)*4.25,questionFrame.k*4.25);
      gl.uniform1fv(glowUniform,glow||noGlow);
      if(nodes)gl.uniform3fv(nodesUniform,new Float32Array(nodes.flatMap(n=>[(n.x-.5)*width/height*4.25,(.5-n.y)*4.25,n.r*4.25])));
      gl.viewport(0,0,w,h);
      gl.uniform4f(frameUniform,frame[0]*w,(1-frame[1]-frame[3])*h,frame[2]*w,frame[3]*h);
      gl.uniform1f(time,clock);gl.uniform1f(split,value);gl.uniform2f(pointer,pointerX,pointerY);gl.drawArrays(gl.TRIANGLES,0,6);
    }
    window.telzaSculpture={render,productAnchors,setPaused(p){paused=p;last=0;if(p)resetPointer();}};
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();document.body.classList.add('no-webgl');});
  }catch(error){console.warn('Using static Telza sculpture:',error.message);document.body.classList.add('no-webgl');}
})();
