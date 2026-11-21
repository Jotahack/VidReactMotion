export const VALID_TYPES=['title','subtitle','tag','stat','bar','icon','divider','ring','quote','pill'];
export const VALID_COLORS=['white','lime','red','cyan','yellow','gray','orange','violet','pink'];
export const VALID_ANIMATIONS=['up','left','pop','fade','right','down','zoom','rotate','blur','wipe','spring'];
export const VALID_ICONS=['globe','chart','trend','alert','flag','bolt','shield','users','cpu','landmark','factory','satellite','rocket','network','pin','building','coins','news'];
export const COLORS={
 white:'#f8fafc',lime:'#b9ff4e',red:'#ff5757',cyan:'#5ce1f1',yellow:'#ffd36b',
 gray:'#b0b9c8',orange:'#fb923c',violet:'#a78bfa',pink:'#f472b6'
};

// A frame-driven showcase that needs no LLM or external assets.
export const sampleSpec={format:'landscape',duration:6,elements:[
 {type:'tag',text:'ÚLTIMA HORA',value:0,icon:'alert',x:8,y:16,width:40,size:30,color:'red',animation:'left',at:0.2,hold:5.3},
 {type:'title',text:'EL MUNDO CAMBIA',value:0,icon:'globe',x:8,y:30,width:80,size:83,color:'white',animation:'spring',at:0.7,hold:4.8},
 {type:'subtitle',text:'Motion graphics con transparencia real',value:0,icon:'globe',x:8,y:48,width:72,size:35,color:'cyan',animation:'blur',at:1.2,hold:4.3},
 {type:'divider',text:'',value:0,icon:'chart',x:8,y:68,width:49,size:24,color:'orange',animation:'wipe',at:1.6,hold:3.8},
 {type:'ring',text:'AVANCE',value:72,icon:'trend',x:71,y:61,width:23,size:36,color:'lime',animation:'zoom',at:1.9,hold:3.5}
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
   const x=bounded(e.x,0,90,10);
   const width=bounded(e.width,8,100-x,65);
   return {
    type:choice(e.type,VALID_TYPES,'subtitle'),text:String(e.text??'').slice(0,120),
    value:bounded(e.value,0,999999,0),icon:choice(e.icon,VALID_ICONS,'globe'),
    x,y:bounded(e.y,0,90,30),width,
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
   type:'array',minItems:1,maxItems:10,
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
