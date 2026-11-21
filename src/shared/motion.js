// Pure, deterministic motion math; every output depends only on frame time.
// Keyframes use seconds relative to the current group and never execute code.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const mix=(a,b,t)=>a+(b-a)*t;
const easing=t=>t*t*(3-2*t);
const DEFAULT={x:0,y:0,scale:1,rotate:0,opacity:1,blur:0};

export function interpolateKeyframes(keyframes,seconds) {
  if(!Array.isArray(keyframes)||!keyframes.length)return null;
  const points=[...keyframes].sort((a,b)=>a.at-b.at);
  if(seconds<=points[0].at)return {...DEFAULT,...points[0]};
  if(seconds>=points.at(-1).at)return {...DEFAULT,...points.at(-1)};
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1];
    if(seconds<=b.at){
      const t=easing(clamp((seconds-a.at)/Math.max(0.001,b.at-a.at),0,1));
      return Object.fromEntries(Object.keys(DEFAULT).map(k=>[k,mix(a[k]??DEFAULT[k],b[k]??DEFAULT[k],t)]));
    }
  }
  return {...DEFAULT};
}
export function keyframesToStyle(keyframes,seconds) {
  const p=interpolateKeyframes(keyframes,seconds);
  if(!p)return null;
  return {
    transform:'translate('+p.x.toFixed(2)+'px,'+p.y.toFixed(2)+'px) rotate('+p.rotate.toFixed(2)+'deg) scale('+p.scale.toFixed(4)+')',
    opacity:p.opacity,filter:'blur('+p.blur.toFixed(2)+'px)'
  };
}
export function presetTransform(effect,progress,springProgress=progress) {
  const p=clamp(progress,0,1);
  switch(effect) {
    case 'left':return {transform:'translateX('+Math.round((1-p)*-95)+'px)'};
    case 'right':return {transform:'translateX('+Math.round((1-p)*95)+'px)'};
    case 'up':return {transform:'translateY('+Math.round((1-p)*80)+'px)'};
    case 'down':return {transform:'translateY('+Math.round((1-p)*-80)+'px)'};
    case 'pop':return {transform:'scale('+(0.72+springProgress*0.28).toFixed(4)+')'};
    case 'zoom':return {transform:'scale('+(1.2-p*0.2).toFixed(4)+')'};
    case 'rotate':return {transform:'rotate('+((1-p)*-18).toFixed(2)+'deg)'};
    case 'spring':return {transform:'translateY('+((1-springProgress)*92).toFixed(2)+'px)'};
    case 'blur':return {filter:'blur('+((1-p)*14).toFixed(2)+'px)'};
    case 'wipe':return {clipPath:'inset(0 '+((1-p)*100).toFixed(2)+'% 0 0)'};
    default:return {};
  }
}
export function coverageGaps(spec) {
  const intervals=(spec.scenes||[]).flatMap(scene=>
    (scene.groups||[]).flatMap(group=>
      (group.elements||[]).map(e=>[
        scene.at+group.at+e.at,
        Math.min(spec.duration,scene.at+group.at+e.at+e.hold)
      ])
    )
  ).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  const gaps=[];let end=0;
  for(const [a,b] of intervals){
    if(a-end>0.85)gaps.push({start:end,end:a});
    end=Math.max(end,b);
  }
  if(spec.duration-end>0.85)gaps.push({start:end,end:spec.duration});
  return gaps;
}
