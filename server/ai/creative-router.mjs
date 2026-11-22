// Deterministic intent routing. This removes the old rule that every request,
// even a single phrase, must produce four animated groups per shot.
export const MODES=['auto','typography','card','list','advanced'];
export const PLACEMENTS=['auto','left','right','center','around-person'];
export const FONTS=['Montserrat','Inter','Arial'];

export function resolveDesignIntent({prompt='',mode='auto',placement='auto',font='auto'}={}){
  const p=String(prompt);
  const chosenMode=MODES.includes(mode)?mode:'auto';
  const inferredMode=/\b(contenedor|tarjeta|ficha|definici[oó]n|qu[eé] es|explicaci[oó]n breve|recuadro)\b/i.test(p)?
    'card':/\b(lista|enumera|enumeraci[oó]n|cuatro humores|bilis amarilla|bilis negra)\b/i.test(p)?
    'list':/\b(frase|palabras|solo texto|tipograf[ií]a|un cuerpo en equilibrio|en una l[ií]nea)\b/i.test(p)?
    'typography':'advanced';
  const resolvedMode=chosenMode==='auto'?inferredMode:chosenMode;
  const requestedPlacement=PLACEMENTS.includes(placement)?placement:'auto';
  let position=requestedPlacement;
  if(position==='auto'){
    position=/\b(a la derecha|lado derecho|parte derecha)\b/i.test(p)?'right':
      /\b(a la izquierda|lado izquierdo|parte izquierda)\b/i.test(p)?'left':
      /\b(persona|silueta|alrededor de)\b/i.test(p)?'around-person':'center';
  }
  let family=FONTS.includes(font)?font:
    /montserrat/i.test(p)?'Montserrat':/arial/i.test(p)?'Arial':'Inter';
  if(!FONTS.includes(family))family='Inter';
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
    items:{type:'array',minItems:0,maxItems:6,items:{type:'string'}}
  },
  required:['headline','description','items']
};

export function buildSimpleContentPrompt(intent,format,duration){
  return 'Eres editor de texto para overlays profesionales. Responde SOLO JSON con headline,description,items. '+
    'Modo '+intent.mode+'. Formato '+format+'. Duración '+duration+' segundos. '+
    (intent.mode==='card'?
      'Un titular breve y una definición o explicación breve, clara y rigurosa (máximo 170 caracteres). items siempre []. ':
      intent.mode==='list'?
      'items es una lista exacta de los conceptos aportados por el usuario, en su mismo orden. No añadas conceptos. headline y description opcionales pero de tipo string. ':
      'items contiene las frases o segmentos que deben mostrarse sucesivamente, hasta cuatro, sin alterar palabras ni inventar otras. No añadas conceptos. ')+
    'Respeta el idioma y todas las palabras originales expresamente indicadas. '+
    'No afirmes que una clasificación histórica sea un hecho científico vigente. '+
    'No inventes cifras, estudios, hechos, propiedades ni personas. No devuelvas coordenadas ni animaciones.';
}
