import {VALID_TYPES,VALID_COLORS,VALID_ANIMATIONS,VALID_ICONS,VALID_TRANSITIONS,VALID_PRESETS} from '../../src/shared/spec.js';

// A small schema is easier for GPT-OSS to fill reliably than 65 full elements in one response.
const shotPlanShape={
  title:{type:'string'},intent:{type:'string'},visual:{type:'string'},
  preset:{type:'string',enum:VALID_PRESETS},transition:{type:'string',enum:VALID_TRANSITIONS}
};
export const storyboardPlanSchema={type:'object',additionalProperties:false,properties:{
  shots:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,
    properties:shotPlanShape,required:Object.keys(shotPlanShape)}}
},required:['shots']};

const elementProperties={
  type:{type:'string',enum:VALID_TYPES},text:{type:'string'},value:{type:'number'},
  icon:{type:'string',enum:VALID_ICONS},x:{type:'number'},y:{type:'number'},
  width:{type:'number'},size:{type:'number'},color:{type:'string',enum:VALID_COLORS},
  animation:{type:'string',enum:VALID_ANIMATIONS},at:{type:'number'},hold:{type:'number'}
};
const elementSchema={type:'object',additionalProperties:false,properties:elementProperties,required:Object.keys(elementProperties)};
const groupSchema={type:'object',additionalProperties:false,properties:{
  motion:{type:'string',enum:VALID_ANIMATIONS},at:{type:'number'},hold:{type:'number'},
  elements:{type:'array',minItems:1,maxItems:3,items:elementSchema}
},required:['motion','at','hold','elements']};
export const shotJsonSchema={type:'object',additionalProperties:false,properties:{
  groups:{type:'array',minItems:1,maxItems:4,items:groupSchema}
},required:['groups']};

export function targetShotCount(duration){
  if(duration<=5)return 1;
  if(duration<=10)return 2;
  if(duration<=18)return 3;
  if(duration<=30)return 4;
  if(duration<=44)return 6;
  return 8;
}
export function targetGroupCount(shotCount){return shotCount>=6?4:shotCount>=3?3:2;}
export function targetElementCount(index,count){
  if(count===8)return [9,8,8,8,9,8,8,7][index]??8;
  if(count===6)return 7;
  if(count===3||count===4)return 6;
  return 4;
}

export function normalizeStoryboardPlan(raw,duration,brief){
  const count=targetShotCount(duration);
  const given=Array.isArray(raw?.shots)?raw.shots:[];
  const shots=[];let at=0;
  for(let i=0;i<count;i++){
    const rawShot=given[i]||{};
    const hold=i===count-1?duration-at:Number((duration/count).toFixed(3));
    shots.push({
      index:i,at:Number(at.toFixed(3)),hold,
      title:String(rawShot.title||brief.headline||'SECUENCIA VISUAL').slice(0,90),
      intent:String(rawShot.intent||'Desarrollar el mensaje con jerarquía visual').slice(0,350),
      visual:String(rawShot.visual||brief.visualDirection||'Animaciones limpias y legibles').slice(0,500),
      preset:VALID_PRESETS.includes(rawShot.preset)?rawShot.preset:['hero','data','comparison','minimal','data','lower-third','quote','hero'][i%8],
      transition:VALID_TRANSITIONS.includes(rawShot.transition)?rawShot.transition:['fade','slide','zoom','cut'][i%4]
    });
    at+=hold;
  }
  return {shots};
}

// A consistent motion vocabulary creates rich group keyframes without asking
// the local model to emit hundreds of extra JSON numbers.
export function generateGroupKeyframes(motion,hold,index){
  const entrances={
    left:{x:-72,y:0,scale:0.94,rotate:-3},right:{x:72,y:0,scale:0.94,rotate:3},
    up:{x:0,y:66,scale:0.96,rotate:0},down:{x:0,y:-66,scale:0.96,rotate:0},
    pop:{x:0,y:15,scale:0.75,rotate:0},zoom:{x:0,y:0,scale:1.23,rotate:0},
    rotate:{x:0,y:14,scale:0.9,rotate:index%2?-7:7},
    blur:{x:0,y:0,scale:1,rotate:0},wipe:{x:-32,y:0,scale:1,rotate:0},
    spring:{x:0,y:58,scale:0.87,rotate:0},fade:{x:0,y:0,scale:1,rotate:0}
  };
  const from=entrances[motion]||entrances.fade;
  const reveal=Number(Math.min(0.6,hold*0.25).toFixed(3));
  const final=Number(hold.toFixed(3));
  const make=(at,x,y,scale,rotate,opacity,blur)=>({at,x,y,scale,rotate,opacity,blur});
  return [
    make(0,from.x,from.y,from.scale,from.rotate,0,motion==='blur'?14:5),
    make(reveal,0,0,1,0,1,0),
    make(final,0,0,1,0,1,0)
  ];
}

export function assembleStoryboard(plan,shots,format,duration){
  if(!Array.isArray(shots)||shots.length!==plan.shots.length)throw new Error('Faltan escenas en el storyboard.');
  const scenes=plan.shots.map((planned,index)=>{
    const generated=shots[index];
    if(!Array.isArray(generated?.groups)||!generated.groups.length)
      throw new Error('La escena '+(index+1)+' no tiene grupos.');
    const groups=generated.groups.slice(0,4).map((g,j)=>({
      ...g,at:Number(g.at??0),hold:Number(g.hold??planned.hold),
      keyframes:generateGroupKeyframes(g.motion,Math.min(planned.hold,Math.max(0.2,Number(g.hold??planned.hold))),j)
    }));
    return {at:planned.at,hold:planned.hold,transition:planned.transition,preset:planned.preset,groups};
  });
  return {format,duration,scenes,transitionEngine:scenes.length>1?'remotion':undefined};
}

export function buildStoryboardPlanPrompt({format,duration,count}){
  return 'Eres director de arte de motion graphics. Divide un overlay de '+duration+' segundos ('+(format==='portrait'?'9:16':'16:9')+') en EXACTAMENTE '+count+' planos distintos. '+
    'Para cada plano devuelve title, intent, visual, preset y transition según el esquema JSON. '+
    'Cada plano debe introducir un avance del mensaje, sin repetir titulares ni datos. '+
    'Distribuye el contenido proporcionalmente; usa el idioma del usuario. '+
    'Incluye motivos gráficos realizables: kinetic, orbit, ring, pill, tag, stat, bar, callout, quote, divider, icon, title, subtitle. '+
    'NO inventes porcentajes, noticias, datos, estadísticas ni citas. '+
    'El resultado es transparente, sin fondo, imágenes externas ni audio. Entrega SOLO JSON.';
}

export function buildShotPrompt({planned,count,index,format,elementCount,groupCount=4}){
  const parts=Array.from({length:groupCount},(_,i)=>Math.floor(elementCount/groupCount)+(i<elementCount%groupCount?1:0));
  return 'Eres animador senior de Remotion. Diseña SOLO el plano '+(index+1)+' de '+count+' de un storyboard '+
    (format==='portrait'?'VERTICAL 9:16':'HORIZONTAL 16:9')+'. Duración local '+planned.hold+' segundos. '+
    'Devuelve SOLO un JSON con groups[] siguiendo shotJsonSchema; NO escribas at/hold de escena. '+
    'Crea EXACTAMENTE '+groupCount+' grupos, '+elementCount+' elementos en total ('+parts.join(',')+'). '+
    'Usa las regiones visuales necesarias: jerarquía de título, contenido y acento. No añadas gráficos si el mensaje no los necesita. '+
    'No coloques todos los elementos en el centro ni superpongas bloques grandes. '+
    'Cada grupo exige motion,at,hold,elements. Empieza el primer grupo en at=0; escalona los demás entre 0.15 y 1.3 s. '+
    'Todos los hold deben terminar antes del final de este plano; mantén una capa visible hasta el final. '+
    'Cada elemento exige type,text,value,icon,x,y,width,size,color,animation,at,hold. '+
    'x,y,width porcentajes. Posiciones seguras: x>=8, x+width<=92 y y entre 10 y 76. '+
    'Los 4 grupos tienen suficiente espacio propio y el texto grande necesita ancho suficiente. '+
    'Tipos disponibles title,subtitle,tag,stat,bar,icon,divider,ring,quote,pill,kinetic,orbit,callout,infoCard,pulse,beam,ticker. '+
    'Efectos up,left,pop,fade,right,down,zoom,rotate,blur,wipe,spring,none. '+
    'Colores white,lime,red,cyan,yellow,gray,orange,violet,pink. '+
    'Iconos globe,chart,trend,alert,flag,bolt,shield,users,cpu,landmark,factory,satellite,rocket,network,pin,building,coins,news. '+
    'Genera texto breve y contrastado, composición cinematográfica y ritmo fluido. '+
    'NO inventes porcentajes, afirmaciones, citas ni datos concretos; usa números SOLO si el usuario los proporcionó o pidió explícitamente datos ficticios. '+
    'Sin fondo opaco, ni audio, ni recursos externos ni código JavaScript. SOLO JSON.';
}
