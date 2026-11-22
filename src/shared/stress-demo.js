// Curated, deterministic 60-second reference to test the real renderer.
// Eight narrative shots, 32 coordinated groups, 65 elements, 96 keyframes.
// All counters and percentages are labelled as simulated demo values.
const HEADLINES=['UN NUEVO RITMO','DATOS EN VIVO','COMPARA Y DECIDE','TIPOGRAFÍA VIVA',
  'CAPAS EN ACCIÓN','DISEÑO DINÁMICO','PODER VISUAL','TODO EN MOVIMIENTO'];
const SUBTITLES=['MOTION GRAPHICS SIN LÍMITES','GRÁFICOS Y NARRATIVA','UNA HISTORIA VISUAL',
  'PALABRAS QUE COBRAN VIDA','ELEMENTOS COORDINADOS','COMPOSICIÓN EN TIEMPO REAL',
  'RITMO, CLARIDAD Y PRECISIÓN','CREADO EN VIDREACTMOTION'];
const COLORS=['cyan','lime','violet','yellow','orange','pink','red','cyan'];
const ICONS=['rocket','chart','network','bolt','cpu','satellite','trend','globe'];
const RECIPES=[
  [['tag','title','divider'],['subtitle','orbit'],['callout','beam'],['pill','icon']],
  [['tag','kinetic'],['subtitle','ring'],['callout','divider'],['stat','pill']],
  [['tag','title'],['subtitle','pulse'],['quote','divider'],['bar','beam']],
  [['tag','kinetic'],['subtitle','orbit'],['callout','beam'],['pill','ticker']],
  [['tag','title','divider'],['subtitle','ring'],['callout','beam'],['pill','icon']],
  [['tag','kinetic'],['subtitle','pulse'],['callout','divider'],['bar','ticker']],
  [['tag','title'],['subtitle','orbit'],['quote','beam'],['stat','pill']],
  [['tag','kinetic'],['subtitle','ring'],['callout','divider'],['pill']]
];
const MOTIONS=['spring','zoom','left','right'];
const TRANSITIONS=['fade','slide','zoom','cut','fade','slide','zoom','fade'];
const PRESETS=['hero','data','comparison','minimal','comparison','lower-third','data','hero'];

function placement(type,group,index,format){
  if(format==='portrait'){
    if(group===0){
      if(type==='tag')return [8,8,84,41];
      if(type==='divider')return [8,38,72,19];
      return [8,19,84,93];
    }
    if(group===1){
      if(index===0)return [8,44,84,46];
      return [65,51,27,66];
    }
    if(group===2){
      if(index===0)return [8,70,80,39];
      return [8,64,75,22];
    }
    if(index===0){
      if(type==='stat'||type==='bar')return [8,81,80,40];
      return [8,87,80,32];
    }
    if(type==='icon')return [75,8,15,58];
    if(type==='ticker')return [8,80,82,26];
    return [8,77,80,28];
  }
  if(group===0){
    if(type==='tag')return [8,10,46,36];
    if(type==='divider')return [8,48,47,21];
    return [8,23,65,104];
  }
  if(group===1){
    if(index===0)return [8,53,52,48];
    return [67,26,27,90];
  }
  if(group===2){
    if(index===0)return [8,73,46,38];
    return [8,65,43,24];
  }
  if(index===0){
    if(type==='stat'||type==='bar')return [58,68,34,44];
    return [58,80,34,31];
  }
  if(type==='icon')return [79,11,14,65];
  if(type==='ticker')return [55,60,39,29];
  return [56,61,36,28];
}
function caption(type,scene){
  if(type==='tag')return 'DEMO / SECUENCIA '+String(scene+1).padStart(2,'0');
  if(type==='title'||type==='kinetic')return HEADLINES[scene];
  if(type==='subtitle')return SUBTITLES[scene];
  if(type==='callout')return ['PRECISIÓN EN CADA CAPA','DATOS DE PRUEBA','CONTRASTE Y EQUILIBRIO',
    'MOVIMIENTO SINCRONIZADO','PROFUNDIDAD VISUAL','ESTILO EDITORIAL','NARRATIVA CINÉTICA','UN FINAL CON IMPACTO'][scene];
  if(type==='quote')return 'EL DISEÑO TAMBIÉN CUENTA HISTORIAS';
  if(type==='pill')return ['REMOTION · SVG','RENDER LOCAL','EFECTOS PREMIUM','TIPOGRAFÍA CINÉTICA',
    'TRANSICIONES FLUIDAS','ALFA TRANSPARENTE','COMPOSICIÓN INTELIGENTE','FIN DE DEMOSTRACIÓN'][scene];
  if(type==='ticker')return 'VIDREACTMOTION · LABORATORIO VISUAL';
  if(type==='stat'||type==='bar'||type==='ring')return 'VALOR FICTICIO · DEMO';
  return '';
}
const mockValue=(scene,type)=>['ring','bar'].includes(type)?[72,64,53,87,91,56,68,79][scene]:
  type==='stat'?[860,124,390,42,720,315,96,204][scene]:0;

export function createStressDemo(format='landscape'){
  const orientation=format==='portrait'?'portrait':'landscape';
  const scenes=[];
  for(let scene=0;scene<8;scene++){
    const hold=7.5;
    const groups=RECIPES[scene].map((types,group)=>{
      const at=[0,0.45,1,1.45][group];
      const length=hold-at;
      const elements=types.map((type,index)=>{
        const [x,y,width,size]=placement(type,group,index,orientation);
        const start=index*0.25+0.08;
        return {
          type,text:caption(type,scene),value:mockValue(scene,type),icon:ICONS[scene],
          x,y,width,size,color:type==='title'||type==='kinetic'?'white':COLORS[(scene+group)%8],
          animation:['spring','blur','wipe','pop','zoom','left','right'][((scene+group+index)%7)],
          at:start,hold:Number((length-start-0.08).toFixed(3))
        };
      });
      const x=[-48,36,-30,35][group],y=[32,-18,20,12][group];
      return {motion:MOTIONS[group],at,hold:length,elements,keyframes:[
        {at:0,x,y,scale:group===1?1.13:0.93,rotate:group%2?-3:3,opacity:0,blur:9},
        {at:0.72,x:0,y:0,scale:1,rotate:0,opacity:1,blur:0},
        {at:length,x:0,y:0,scale:1,rotate:0,opacity:1,blur:0}
      ]};
    });
    scenes.push({at:Number((scene*7.5).toFixed(2)),hold,transition:TRANSITIONS[scene],
      preset:PRESETS[scene],groups});
  }
  return {format:orientation,duration:60,scenes};
}
