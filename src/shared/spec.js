export const VALID_TYPES=['title','subtitle','tag','stat','bar','icon','divider','ring','quote','pill','kinetic','orbit','callout','pulse','beam','ticker'];
export const VALID_COLORS=['white','lime','red','cyan','yellow','gray','orange','violet','pink'];
export const VALID_ANIMATIONS=['up','left','pop','fade','right','down','zoom','rotate','blur','wipe','spring'];
export const VALID_ICONS=['globe','chart','trend','alert','flag','bolt','shield','users','cpu','landmark','factory','satellite','rocket','network','pin','building','coins','news'];
export const VALID_TRANSITIONS=['fade','slide','zoom','cut'];
export const VALID_PRESETS=['hero','data','comparison','quote','lower-third','minimal'];
export const COLORS={
  white:'#f8fafc',lime:'#b9ff4e',red:'#ff5757',cyan:'#5ce1f1',yellow:'#ffd36b',
  gray:'#b0b9c8',orange:'#fb923c',violet:'#a78bfa',pink:'#f472b6'
};
const limit=(value,min,max,fallback)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?
  Math.max(min,Math.min(max,Number(value))):fallback;
const choose=(value,values,fallback)=>values.includes(value)?value:fallback;

const makeElement=(type,text,x,y,width,size,color,animation,at,hold,value=0,icon='globe')=>
  ({type,text,x,y,width,size,color,animation,at,hold,value,icon});

// A 12s storyboard with continuous coverage. Every group moves together; its
// children can also animate individually (all times are local to their parent).
export const sampleSpec={format:'landscape',duration:12,scenes:[
  {at:0,hold:4,transition:'fade',preset:'hero',groups:[
    {motion:'spring',at:0,hold:4,elements:[
      makeElement('tag','MODO DEMO',9,15,36,31,'red','left',0.2,3.5,0,'alert'),
      makeElement('title','EL FUTURO ESTÁ EN MOVIMIENTO',9,31,82,77,'white','spring',0.5,3.3),
      makeElement('subtitle','MOTION GRAPHICS',9,58,72,36,'cyan','blur',0.9,3)
    ]}
  ]},
  {at:4,hold:4,transition:'slide',preset:'data',groups:[
    {motion:'up',at:0,hold:4,elements:[
      makeElement('title','MOVIMIENTO Y PRECISIÓN',9,23,76,72,'white','wipe',0.2,3.5),
      makeElement('divider','',9,45,73,23,'orange','wipe',0.65,3.1),
      makeElement('orbit','',70,54,24,65,'cyan','zoom',1,2.7,0,'globe')
    ]}
  ]},
  {at:8,hold:4,transition:'zoom',preset:'data',groups:[
    {motion:'pop',at:0,hold:4,elements:[
      makeElement('tag','EJEMPLO FICTICIO',9,18,60,27,'orange','fade',0.1,3.7,0,'alert'),
      makeElement('ring','PROGRESO DEMO',60,29,30,58,'lime','spring',0.4,3.5,72),
      makeElement('kinetic','CADA FOTOGRAMA CUENTA',9,42,50,62,'white','up',0.7,3.1)
    ]}
  ]}
]};

function normalizeKeyframes(points,maxTime) {
  if(!Array.isArray(points)) return [];
  const frames=points.slice(0,12).filter(p=>p&&typeof p==='object').map(p=>({
    at:limit(p.at,0,maxTime,0),x:limit(p.x,-100,100,0),y:limit(p.y,-100,100,0),
    scale:limit(p.scale,0.05,5,1),rotate:limit(p.rotate,-360,360,0),
    opacity:limit(p.opacity,0,1,1),blur:limit(p.blur,0,60,0)
  })).sort((a,b)=>a.at-b.at);
  return frames;
}

function normalizeElement(e,maxTime,format) {
  if(!e||typeof e!=='object') return null;
  const at=limit(e.at,0,Math.max(0,maxTime-0.15),0);
  const hold=limit(e.hold,0.15,Math.max(0.15,maxTime-at),Math.max(0.15,maxTime-at));
  const x=limit(e.x,0,90,10);
  const width=limit(e.width,8,100-x,65);
  const maxSize=format==='portrait'?104:118;
  return {
    type:choose(e.type,VALID_TYPES,'subtitle'),text:String(e.text??'').slice(0,120),
    value:limit(e.value,0,999999,0),icon:choose(e.icon,VALID_ICONS,'globe'),
    x,y:limit(e.y,0,90,30),width,size:limit(e.size,18,maxSize,52),
    color:choose(e.color,VALID_COLORS,'white'),
    animation:choose(e.animation,VALID_ANIMATIONS,'up'),at,hold,
    ...(Array.isArray(e.keyframes)&&e.keyframes.length?{keyframes:normalizeKeyframes(e.keyframes,hold)}:{})
  };
}
function normalizeGroup(group,maxTime,format) {
  if(!group||!Array.isArray(group.elements)) return null;
  const at=limit(group.at,0,Math.max(0,maxTime-0.15),0);
  // Deliberately cover the rest of the shot to avoid the 3.5 second blank tail
  // seen in initial LLM outputs. Elements still use their own requested timing.
  const hold=limit(group.hold,0.15,maxTime-at,maxTime-at);
  const elements=group.elements.slice(0,10).map(e=>normalizeElement(e,hold,format)).filter(Boolean);
  if(!elements.length) return null;
  // Repair a quiet tail by keeping the latest active layer on screen until the shot ends.
  const latest=elements.reduce((best,e)=>e.at+e.hold>best.at+best.hold?e:best,elements[0]);
  if(hold-(latest.at+latest.hold)>0.4)latest.hold=Number((hold-latest.at).toFixed(3));
  return {
    at,hold,motion:choose(group.motion,VALID_ANIMATIONS,'fade'),elements,
    ...(Array.isArray(group.keyframes)&&group.keyframes.length?
      {keyframes:normalizeKeyframes(group.keyframes,hold)}:{})
  };
}
function normalizeScene(scene,at,hold,format) {
  const groups=Array.isArray(scene.groups)?scene.groups:[];
  const normalizedGroups=groups.slice(0,5).map(g=>normalizeGroup(g,hold,format)).filter(Boolean);
  if(!normalizedGroups.length)return null;
  // Leave room for staggered group exits, but never leave a shot completely empty.
  const latest=normalizedGroups.reduce((best,g)=>g.at+g.hold>best.at+best.hold?g:best,normalizedGroups[0]);
  if(hold-(latest.at+latest.hold)>0.4){
    latest.hold=Number((hold-latest.at).toFixed(3));
    const lastLayer=latest.elements.reduce((best,e)=>e.at+e.hold>best.at+best.hold?e:best,latest.elements[0]);
    lastLayer.hold=Number((latest.hold-lastLayer.at).toFixed(3));
  }
  return {
    at,hold,transition:choose(scene.transition,VALID_TRANSITIONS,'fade'),
    preset:choose(scene.preset,VALID_PRESETS,'hero'),groups:normalizedGroups
  };
}

/**
 * V2 is the canonical format. Legacy flat {elements:[...]} scenes are migrated
 * without executing arbitrary JS from a language model.
 */
export function normalizeSpec(raw,forced={}) {
  if(!raw||typeof raw!=='object')throw new Error('La IA no devolvió una escena válida.');
  const format=choose(forced.format??raw.format,['portrait','landscape'],'landscape');
  const duration=limit(forced.duration??raw.duration,3,60,12);
  let candidates;
  if(Array.isArray(raw.scenes)&&raw.scenes.length) {
    candidates=raw.scenes.slice(0,8).filter(s=>s&&typeof s==='object');
  } else if(Array.isArray(raw.elements)&&raw.elements.length){
    candidates=[{at:0,hold:duration,transition:'fade',preset:'hero',
      groups:[{at:0,hold:duration,motion:'fade',elements:raw.elements}]}];
  } else throw new Error('La IA no devolvió una escena con elementos válidos.');

  // A storyboard is scheduled contiguously: no accidental empty beginning/tail.
  // Scenes with overlapping requested times are treated as sequential beats.
  const scenes=[];
  for(let i=0;i<candidates.length;i++){
    const candidate=candidates[i];
    const at=scenes.length===0?0:scenes.at(-1).at+scenes.at(-1).hold;
    const remaining=duration-at;
    if(remaining<0.4)break;
    const isLast=i===candidates.length-1;
    const requested=limit(candidate.hold,0.4,remaining,Math.min(4,remaining));
    const hold=isLast?remaining:Math.min(requested,Math.max(0.4,remaining-(candidates.length-i-1)*0.4));
    const scene=normalizeScene(candidate,at,hold,format);
    if(scene)scenes.push(scene);
  }
  if(!scenes.length)throw new Error('No hay elementos para animar.');
  // Extend the final scene even if malformed groups were discarded.
  const last=scenes.at(-1);last.hold=Number((duration-last.at).toFixed(3));
  return {format,duration,scenes};
}

export function analyzeSpec(raw) {
  const spec=normalizeSpec(raw);
  const warnings=[];
  const last=spec.scenes.at(-1);
  if(last.at+last.hold<spec.duration-0.1)warnings.push('La animación termina antes de tiempo.');
  for(const [index,scene] of spec.scenes.entries()){
    const lastActive=Math.max(...scene.groups.flatMap(g=>g.elements.map(e=>g.at+e.at+e.hold)));
    if(lastActive<scene.hold-0.9)warnings.push('Escena '+(index+1)+': contenido ausente durante los últimos '+(scene.hold-lastActive).toFixed(1)+' s.');
    const items=scene.groups.flatMap(g=>g.elements.map(e=>({
      type:e.type,text:e.text,
      start:g.at+e.at,end:g.at+e.at+e.hold,
      x:e.x,y:e.y,width:e.width,height:Math.max(4,e.size/12)
    })));
    for(let a=0;a<items.length;a++)for(let b=a+1;b<items.length;b++){
      const p=items[a],q=items[b];
      if(p.type==='divider'||q.type==='divider'||p.type==='icon'||q.type==='icon')continue;
      const timeOverlap=Math.min(p.end,q.end)-Math.max(p.start,q.start)>0.6;
      const xOverlap=Math.min(p.x+p.width,q.x+q.width)-Math.max(p.x,q.x)>10;
      const yOverlap=Math.min(p.y+p.height,q.y+q.height)-Math.max(p.y,q.y)>2;
      if(timeOverlap&&xOverlap&&yOverlap)warnings.push('Escena '+(index+1)+': posible solapamiento entre "'+p.text.slice(0,24)+'" y "'+q.text.slice(0,24)+'".');
    }
  }
  return [...new Set(warnings)];
}

const elementProperties={
  type:{type:'string',enum:VALID_TYPES},text:{type:'string'},value:{type:'number'},
  icon:{type:'string',enum:VALID_ICONS},x:{type:'number'},y:{type:'number'},
  width:{type:'number'},size:{type:'number'},color:{type:'string',enum:VALID_COLORS},
  animation:{type:'string',enum:VALID_ANIMATIONS},at:{type:'number'},hold:{type:'number'}
};
const elementSchema={type:'object',additionalProperties:false,
  properties:elementProperties,required:Object.keys(elementProperties)};
const groupSchema={type:'object',additionalProperties:false,properties:{
  motion:{type:'string',enum:VALID_ANIMATIONS},at:{type:'number'},hold:{type:'number'},
  elements:{type:'array',minItems:1,maxItems:8,items:elementSchema}
},required:['motion','at','hold','elements']};
const sceneSchema={type:'object',additionalProperties:false,properties:{
  at:{type:'number'},hold:{type:'number'},transition:{type:'string',enum:VALID_TRANSITIONS},
  preset:{type:'string',enum:VALID_PRESETS},
  groups:{type:'array',minItems:1,maxItems:4,items:groupSchema}
},required:['at','hold','transition','preset','groups']};
export const sceneJsonSchema={type:'object',additionalProperties:false,properties:{
  scenes:{type:'array',minItems:1,maxItems:8,items:sceneSchema}
},required:['scenes']};
