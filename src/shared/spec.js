export const VALID_TYPES=['title','subtitle','tag','stat','bar','icon'];
export const VALID_COLORS=['white','lime','red','cyan','yellow','gray'];
export const VALID_ANIMATIONS=['up','left','pop','fade'];
export const VALID_ICONS=['globe','chart','trend','alert','flag','bolt','shield','users'];
export const COLORS={white:'#f8fafc',lime:'#b9ff4e',red:'#ff5757',cyan:'#5ce1f1',yellow:'#ffd36b',gray:'#b0b9c8'};

export const sampleSpec={format:'landscape',duration:6,elements:[
 {type:'tag',text:'ÚLTIMA HORA',value:0,icon:'alert',x:9,y:18,width:50,size:32,color:'red',animation:'left',at:0.2,hold:5.4},
 {type:'title',text:'EL MUNDO CAMBIA',value:0,icon:'globe',x:9,y:32,width:82,size:82,color:'white',animation:'up',at:0.7,hold:4.7},
 {type:'subtitle',text:'Animaciones listas para superponer',value:0,icon:'globe',x:9,y:53,width:80,size:34,color:'cyan',animation:'fade',at:1.2,hold:4.1},
 {type:'bar',text:'AVANCE',value:72,icon:'chart',x:9,y:72,width:72,size:26,color:'lime',animation:'left',at:1.7,hold:3.5}
]};

const bounded=(n,min,max,fallback)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback;
const choice=(v,options,fallback)=>options.includes(v)?v:fallback;
export function normalizeSpec(raw,forced={}) {
 if (!raw||typeof raw!=='object'||!Array.isArray(raw.elements)||!raw.elements.length)
   throw new Error('La IA no devolvió una escena con elementos válidos.');
 const format=choice(forced.format??raw.format,['portrait','landscape'],'landscape');
 const duration=bounded(forced.duration??raw.duration,3,12,6);
 const elements=raw.elements.slice(0,10).map(e=>{
   if (!e||typeof e!=='object') return null;
   const at=bounded(e.at,0,duration-0.5,0);
   const hold=bounded(e.hold,0.5,duration-at,Math.max(1,duration-at));
   return {
    type:choice(e.type,VALID_TYPES,'subtitle'),text:String(e.text??'').slice(0,120),
    value:bounded(e.value,0,999999,0),icon:choice(e.icon,VALID_ICONS,'globe'),
    x:bounded(e.x,0,95,10),y:bounded(e.y,0,90,30),width:bounded(e.width,10,95,65),
    size:bounded(e.size,18,118,52),color:choice(e.color,VALID_COLORS,'white'),
    animation:choice(e.animation,VALID_ANIMATIONS,'up'),at,hold
   };
 }).filter(Boolean);
 if (!elements.length) throw new Error('No hay elementos para animar.');
 return {format,duration,elements};
}
export const sceneJsonSchema={
 type:'object',additionalProperties:false,
 properties:{elements:{
   type:'array',minItems:1,maxItems:8,
   items:{type:'object',additionalProperties:false,
    properties:{
     type:{type:'string',enum:VALID_TYPES},text:{type:'string'},value:{type:'number'},
     icon:{type:'string',enum:VALID_ICONS},x:{type:'number'},y:{type:'number'},
     width:{type:'number'},size:{type:'number'},color:{type:'string',enum:VALID_COLORS},
     animation:{type:'string',enum:VALID_ANIMATIONS},at:{type:'number'},hold:{type:'number'}
    },
    required:['type','text','value','icon','x','y','width','size','color','animation','at','hold']
   }
 }},required:['elements']
};
