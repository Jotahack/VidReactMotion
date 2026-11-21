// Deterministic reference scene to stress the actual renderer independently of GPT-OSS.
// No external fonts, media or model requests are required.
const palette=['white','cyan','orange','lime','violet','yellow','red','pink'];
const effects=['spring','wipe','zoom','blur','left','right','pop','rotate','up','down','fade'];
const kinds=['title','tag','kinetic','orbit','pill','callout','divider','icon','ring','bar','stat','quote','subtitle'];
const names=[
  'MOTION LAB / APERTURA','ENERGÍA Y MOVIMIENTO','COMPARATIVA VISUAL','TIPOGRAFÍA CINÉTICA',
  'COMPOSICIÓN Y RITMO','DISEÑO EN CAPAS','DATOS EN MOVIMIENTO','GRAN CIERRE'
];
const locations=[[9,12,57,52],[9,25,56,40],[56,35,35,42],[56,49,35,34],
  [9,57,40,35],[9,68,39,29],[56,63,35,30],[56,75,35,25],[9,37,37,25]];
const mockText=(type,shot,i)=>{
  if(type==='divider'||type==='icon'||type==='orbit')return '';
  if(type==='ring'||type==='bar'||type==='stat')return 'VALOR FICTICIO · DEMO';
  return i===0?names[shot]:(['SECUENCIA '+(shot+1),'VECTOR EN ACCIÓN','EFECTO DINÁMICO',
    'CAPAS SIN FONDO','TRANSICIÓN FLUIDA','MOTION GRAPHICS','PROGRESO VISUAL','CAPTURA DE ATENCIÓN'][i-1]);
};
export function createStressDemo(){
  const scenes=[];let at=0;
  const distribution=[9,8,8,8,9,8,8,7];
  for(let s=0;s<8;s++){
    const hold=7.5;
    const groups=[];
    let id=0;
    for(let g=0;g<4;g++){
      const start=[0,0.3,0.6,1][g];
      const life=hold-start;
      const count=s===7&&g===3?1:(distribution[s]===9&&g===0?3:2);
      const elements=[];
      for(let i=0;i<count;i++,id++){
        const [x,y,width,size]=locations[id];
        const type=kinds[(s*3+id)%kinds.length];
        const icon=['globe','rocket','chart','network','cpu','satellite','trend','landmark'][s];
        elements.push({
          type,text:mockText(type,s,id),value:['ring','bar','stat'].includes(type)?(s*9+42)%99:0,
          icon,x,y,width,size,color:palette[(s+g+i)%palette.length],
          animation:effects[(s*3+id)%effects.length],at:i*0.22,
          hold:Number((life-i*0.22-0.06).toFixed(3))
        });
      }
      groups.push({
        motion:effects[(s+g)%effects.length],at:start,hold:life,elements,
        keyframes:[
          {at:0,x:g%2?-45:45,y:g%2?25:-25,scale:0.89,rotate:g%2?-4:4,opacity:0,blur:8},
          {at:0.65,x:0,y:0,scale:1,rotate:0,opacity:1,blur:0},
          {at:life,x:0,y:0,scale:1,rotate:0,opacity:1,blur:0}
        ]
      });
    }
    scenes.push({at,hold,transition:['fade','slide','zoom','cut'][s%4],
      preset:['hero','data','comparison','minimal','comparison','lower-third','data','hero'][s],groups});
    at+=hold;
  }
  return {format:'landscape',duration:60,scenes};
}
