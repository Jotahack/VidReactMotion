// Deterministic intent routing. This removes the old rule that every request,
// even a single phrase, must produce four animated groups per shot.
import {DESIGN_IDS,candidatesForMode} from '../../src/shared/design-catalog.js';
export const MODES=['auto','typography','card','list','quote','comparison','timeline','advanced'];
export const PLACEMENTS=['auto','left','right','center','around-person'];
export const FONTS=['Montserrat','Inter','Arial','Oswald','Playfair Display'];

export function resolveDesignIntent({prompt='',mode='auto',placement='auto',font='auto'}={}){
  const p=String(prompt);
  const plain=p.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const explicit=MODES.includes(mode)?mode:'auto';
  const inferred=
    /(comparativa|compara|frente a|vs[.\s]|diferencias entre)/.test(plain)?'comparison':
    /(cronologia|linea de tiempo|paso a paso|etapas|timeline)/.test(plain)?'timeline':
    /(cita|reflexion|frase celebre|entre comillas)/.test(plain)?'quote':
    /(contenedor|tarjeta|ficha|definicion|que es|explicacion breve|recuadro|biotipos)/.test(plain)?'card':
    /(lista|enumera|enumeracion|cuatro humores|bilis amarilla|bilis negra|flema y sangre)/.test(plain)?'list':
    /(frase|palabras|solo texto|tipografia|una linea|en equilibrio)/.test(plain)?'typography':
    'advanced';
  const resolvedMode=explicit==='auto'?inferred:explicit;
  const requestedPlacement=PLACEMENTS.includes(placement)?placement:'auto';
  const position=requestedPlacement!=='auto'?requestedPlacement:
    /(a la derecha|lado derecho|parte derecha)/.test(plain)?'right':
    /(a la izquierda|lado izquierdo|parte izquierda)/.test(plain)?'left':
    /(persona|silueta|alrededor de|centro libre)/.test(plain)?'around-person':'center';
  const family=FONTS.includes(font)?font:
    /montserrat/.test(plain)?'Montserrat':
    /playfair/.test(plain)?'Playfair Display':
    /oswald/.test(plain)?'Oswald':
    /arial/.test(plain)?'Arial':'Inter';
  return {mode:resolvedMode,placement:position,font:family};
}

// All position maps are frame-safe percentages, never exact assumptions about
// the person silhouette. The preview's center remains available for footage.
function region(format,placement){
  if(format==='portrait'){
    if(placement==='left')return {x:8,y:24,width:67,height:51};
    if(placement==='right')return {x:22,y:24,width:70,height:51};
    return {x:8,y:24,width:84,height:51};
  }
  if(placement==='left')return {x:9,y:21,width:38,height:59};
  if(placement==='center')return {x:27,y:23,width:46,height:55};
  return {x:55,y:21,width:38,height:59};
}
function element(type,text,{x,y,width,height,at,hold,font,size=66,heading='',lineMode='wrap',animation='fade'}){
  return {type,text,heading,icon:'globe',value:0,x,y,width,height,size,
    color:'white',font,lineMode,animation,exit:'none',at,hold};
}
function group(e,duration,start=0){
  return {motion:'none',exit:'none',at:start,hold:duration-start,elements:[e]};
}
const clean=(v,max=200)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);

export function buildSimpleStoryboard({intent,content,format='landscape',duration=7}){
  const direction=intent||resolveDesignIntent({});
  const family=direction.font;
  const portrait=format==='portrait';
  const groups=[];
  if(direction.mode==='card'){
    const box=region(format,direction.placement);
    const title=clean(content?.headline,70);
    const description=clean(content?.description,340);
    if(!title||!description)throw new Error('La tarjeta necesita título y explicación.');
    const at=Math.min(0.22,duration*0.1);
    groups.push(group(element('infoCard',description,{
      ...box,at:0,hold:duration-at,font:family,heading:title,
      size:portrait?61:75
    }),duration,at));
  } else {
    const data=Array.isArray(content?.items)?content.items.map(s=>clean(s,80)).filter(Boolean):[];
    const labels=data.length?data:[clean(content?.headline,100)];
    if(!labels.length||!labels[0])throw new Error('La escena necesita texto.');
    const list=labels.slice(0,direction.mode==='list'?6:4);
    for(const [i,text] of list.entries()){
      const start=Number((0.12+(duration*0.65)*(i/Math.max(1,list.length))).toFixed(3));
      const y=portrait?(19+i*14):(list.length>2?25+i*13:29+i*24);
      let x,width;
      if(direction.placement==='around-person'||direction.mode==='list'){
        x=portrait?8:(i%2===0?9:59);
        width=portrait?84:33;
      }else{
        const r=region(format,direction.placement);
        x=r.x;width=r.width;
      }
      const type=direction.mode==='list'?'callout':'title';
      groups.push(group(element(type,text,{
        x,y,width,height:13,at:0,hold:duration-start,font:family,
        size:portrait?64:87,lineMode:'single',animation:'fade'
      }),duration,start));
    }
  }
  return {format,duration,scenes:[{
    at:0,hold:duration,preset:direction.mode==='card'?'minimal':'hero',
    transition:'cut',groups
  }]};
}

export const simpleContentSchema={
  type:'object',additionalProperties:false,
  properties:{
    headline:{type:'string'},
    description:{type:'string'},
    items:{type:'array',minItems:0,maxItems:6,items:{type:'string'}},
    templateId:{type:'string',enum:DESIGN_IDS},
    designReason:{type:'string'}
  },
  required:['headline','description','items','templateId','designReason']
};

export function buildSimpleContentPrompt(intent,format,duration){
  const options=candidatesForMode(intent.mode);
  const descriptions=options.map(d=>d.id+' = '+d.summary).join('; ');
  return 'Actúa como director de arte y editor para vídeos con fondo transparente. '+
    'Elige SOLO UNO de los diseños permitidos y explica brevemente por qué es mejor. '+
    'Responde JSON con headline, description, items, templateId y designReason. '+
    'Diseños compatibles: '+descriptions+'. '+
    'Modo '+intent.mode+'. Formato '+format+'. Duración '+duration+' s. '+
    'Posición solicitada: '+intent.placement+'. Fuente: '+intent.font+'. '+
    (intent.mode==='card'||intent.mode==='quote'?
      'Redacta un título corto y una explicación completa pero breve (máximo 165 caracteres). items debe ser []. ':
      'items contiene SOLO los conceptos o fragmentos que el usuario ha indicado, en orden, hasta seis. Sin añadir palabras ajenas. ')+
    'Conserva los nombres, hechos y cifras exactos. No inventes datos, fuentes, citas ni valores. '+
    'No generes coordenadas, código ni CSS: el motor elegirá composición, tamaños y ritmo. '+
    'templateId DEBE ser uno de los diseños compatibles; designReason máximo 100 caracteres.';
}
