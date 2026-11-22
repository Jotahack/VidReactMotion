// Curated, first-party composition catalog.
// Inspiration references are research links, not copied third-party source code.
// The LLM selects a recipe; it never creates arbitrary CSS, JS or coordinates.
export const DESIGN_CATALOG=Object.freeze([
  {id:'definition-editorial',mode:'card',name:'Editorial',summary:'Panel vertical de documental con línea de acento',variant:'editorial',impact:88},
  {id:'definition-glass',mode:'card',name:'Cristal',summary:'Ficha elegante translúcida con profundidad',variant:'glass',impact:79},
  {id:'definition-outline',mode:'card',name:'Contorno',summary:'Ficha de borde fino sin fondos pesados',variant:'outline',impact:73},
  {id:'definition-minimal',mode:'card',name:'Tipográfica',summary:'Definición editorial sin caja',variant:'minimal',impact:69},
  {id:'labels-ribbons',mode:'list',name:'Rótulos',summary:'Conceptos en etiquetas horizontales elegantes',variant:'ribbon',impact:85},
  {id:'labels-clean',mode:'list',name:'Palabras',summary:'Nombres grandes sin cajas ni iconos',variant:'minimal',impact:84},
  {id:'labels-indexed',mode:'list',name:'Índice',summary:'Lista numerada con líneas discretas',variant:'indexed',impact:79},
  {id:'type-sides',mode:'typography',name:'A ambos lados',summary:'Frases de una línea alrededor de una persona',variant:'sides',impact:94},
  {id:'type-stack',mode:'typography',name:'Columna',summary:'Frases apiladas y alineadas',variant:'stack',impact:82},
  {id:'type-keyword',mode:'typography',name:'Palabra clave',summary:'Titulares grandes con pausa cinematográfica',variant:'keyword',impact:78},
  {id:'quote-editorial',mode:'quote',name:'Cita documental',summary:'Cita sobria con acento tipográfico',variant:'quote',impact:80},
  {id:'compare-split',mode:'comparison',name:'Comparativa',summary:'Dos conceptos enfrentados sin gráficos inventados',variant:'compare',impact:83},
  {id:'timeline-steps',mode:'timeline',name:'Secuencia',summary:'Conceptos o pasos sucesivos y legibles',variant:'timeline',impact:78}
]);
const byId=new Map(DESIGN_CATALOG.map(d=>[d.id,d]));
export const DESIGN_IDS=Object.freeze(DESIGN_CATALOG.map(d=>d.id));
export function getDesign(id){return byId.get(id)||null;}
export function candidatesForMode(mode){
  const actual=mode==='advanced'?'typography':mode;
  return DESIGN_CATALOG.filter(d=>d.mode===actual);
}
export function rankDesigns({intent,format='landscape',duration=7,prompt='',content={},preferred='auto'}){
  const mode=intent?.mode||'card';
  const choices=candidatesForMode(mode);
  if(!choices.length)return [];
  const words=String(content.description||'').trim().split(/\s+/).filter(Boolean).length;
  const count=Array.isArray(content.items)?content.items.length:0;
  const p=String(prompt).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return choices.map(d=>{
    let score=d.impact;
    // Explicit user choices win, but only within the compatible content family.
    if(preferred===d.id)score+=250;
    if(/sin (caja|fondo|contenedor)|solo texto/.test(p)&&/minimal|clean|sides/.test(d.id))score+=100;
    if(/elegante|documental|editorial|profesional/.test(p)&&/editorial/.test(d.id))score+=35;
    if(/translucid|transparente|cristal|glass/.test(p)&&d.variant==='glass')score+=30;
    if(/numerad/.test(p)&&d.variant==='indexed')score+=50;
    if(/persona|centro libre|ambos lados/.test(p)&&d.id==='type-sides')score+=60;
    if(format==='portrait'&&d.id==='type-sides')score-=32;
    if(words>28&&d.id==='definition-outline')score-=25;
    if(count>=5&&d.id==='labels-indexed')score-=12;
    if(duration<=2&&/glass|ribbon/.test(d.id))score-=5;
    return {...d,score};
  }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
}
function cleaned(value,max=360){
  const text=String(value??'').replace(/\s+/g,' ').trim();
  if(text.length>max)throw new Error('Texto demasiado largo para la composición ('+text.length+' caracteres, máximo '+max+'). Acorta o divide el contenido.');
  return text;
}
function region(format,placement){
  if(format==='portrait'){
    return placement==='left'?{x:8,y:23,width:75,height:54}:
      placement==='right'?{x:16,y:23,width:76,height:54}:{x:8,y:23,width:84,height:54};
  }
  if(placement==='left')return{x:9,y:20,width:37,height:60};
  if(placement==='center')return{x:27,y:20,width:46,height:60};
  return{x:55,y:20,width:37,height:60};
}
function element(type,text,{x,y,width,height=12,size=74,font='Montserrat',variant='editorial',
    heading='',at=0,hold,animation='fade',lineMode='wrap',color='white'}){
  return{type,text,x,y,width,height,size,heading,font,variant,
    icon:'globe',value:0,color,animation,exit:'none',lineMode,at,hold};
}
function group(element,start,duration){
  return{at:start,hold:duration-start,motion:'none',exit:'none',elements:[element]};
}
export function composeFromCatalog({intent,content,format='landscape',duration=7,designId='auto',prompt=''}) {
  const choices=rankDesigns({intent,format,duration,prompt,content,preferred:designId});
  const chosen=choices[0];
  if(!chosen)throw new Error('No hay composiciones compatibles con la petición.');
  const font=intent.font||'Montserrat';
  const place=intent.placement==='auto'?'center':intent.placement;
  const portrait=format==='portrait',items=Array.isArray(content.items)?
    content.items.map(s=>cleaned(s,84)).filter(Boolean).slice(0,6):[];
  const headline=cleaned(content.headline,100);
  const description=cleaned(content.description,360);
  const groups=[];
  if(chosen.mode==='card'||chosen.mode==='quote'){
    const area=region(format,place);
    const heading=headline||'INFORMACIÓN';
    const body=description||items.join('. ');
    // Base panel height on actual amount of content instead of filling the
    // presenter's entire vertical side with an almost-empty container.
    const wordCount=body.trim().split(/\s+/u).filter(Boolean).length;
    const cardHeight=portrait?
      Math.min(48,26+Math.max(0,wordCount-10)*0.55):
      Math.min(60,39+Math.max(0,wordCount-10)*1.3);
    area.height=Number(cardHeight.toFixed(1));
    area.y=Number(((100-cardHeight)/2).toFixed(1));
    if(!body)throw new Error('Falta el texto explicativo.');
    const start=Math.min(0.22,duration*0.09);
    const isQuote=chosen.mode==='quote';
    groups.push(group(element(isQuote?'infoCard':'infoCard',body,{
      ...area,heading,size:portrait?60:76,
      variant:chosen.variant,at:0,hold:duration-start,font
    }),start,duration));
  }else{
    const labels=items.length?items:[headline||description].filter(Boolean);
    if(!labels.length)throw new Error('No hay texto para la animación.');
    if(chosen.mode==='comparison'&&labels.length<2)throw new Error('La comparativa necesita dos conceptos.');
    const limit=chosen.mode==='comparison'?2:chosen.mode==='typography'?4:6;
    const selected=labels.slice(0,limit);
    const count=selected.length;
    for(let i=0;i<count;i++){
      const start=Math.max(0,Math.min(duration-0.18,0.1+(duration*0.65)*i/Math.max(count,1)));
      const isLeft=i%2===0;
      const alternating=place==='around-person'||['sides','ribbon','minimal','indexed','compare'].includes(chosen.variant)&&
        chosen.mode!=='typography';
      const regionForText=region(format,place);
      let x=regionForText.x,width=regionForText.width;
      if(alternating&&!portrait){x=isLeft?9:59;width=33;}
      if(portrait){x=8;width=84;}
      const y=portrait?(16+i*(chosen.mode==='comparison'?26:Math.min(14,68/Math.max(count,1)))) :
        chosen.mode==='typography'&&chosen.variant==='sides'?
          (count>2?(i<2?27:56):38):
        chosen.mode==='comparison'?31+i*30 :
        count>=5?17+i*13:24+i*(count>=4?16:24);
      const typographic=chosen.mode==='typography'||chosen.variant==='minimal';
      const kind=typographic?'title':chosen.mode==='comparison'?'callout':'callout';
      const variant=chosen.variant;
      const text=chosen.variant==='indexed'?String(i+1).padStart(2,'0')+'  '+selected[i]:selected[i];
      groups.push(group(element(kind,text,{x,y,width,height:13,
        size:portrait?65:chosen.mode==='typography'?92:62,
        lineMode:'single',font,variant,at:0,hold:duration-start
      }),start,duration));
    }
  }
  // Up to six staggered rows may be grouped in a single motion group to avoid
  // silent truncation by the legacy five-group limit.
  let safeGroups=groups;
  if(groups.length>5){
    safeGroups=[{at:0,hold:duration,motion:'none',exit:'none',
      elements:groups.map(g=>({...g.elements[0],at:g.at,hold:g.hold}))}];
  }
  return {design:{id:chosen.id,name:chosen.name,score:chosen.score,
      alternatives:choices.slice(1,3).map(x=>({id:x.id,name:x.name,score:x.score}))},
    spec:{format,duration,scenes:[{at:0,hold:duration,transition:'cut',
      preset:chosen.mode==='card'?'minimal':'hero',groups:safeGroups}]}};
}
