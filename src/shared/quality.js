import {estimateWordEm,fitParagraphSize} from './text-layout.js';
import {coverageGaps} from './motion.js';

const TEXT_TYPES=new Set(['title','subtitle','kinetic','callout','pill','tag','quote']);
function label(text){return String(text||'').replace(/\s+/g,' ').slice(0,28);}
function textFit(element,canvasWidth){
  const phrase=String(element.text||'');
  const units=estimateWordEm(element.lineMode==='single'?phrase:
    phrase.split(/\s+/u).sort((a,b)=>estimateWordEm(b)-estimateWordEm(a))[0]||'');
  const padding=element.type==='callout'?64:0;
  return Math.min(element.size,(canvasWidth*element.width/100*0.88-padding)/Math.max(units,0.1));
}
export function assessComposition(spec,{reserveCenter=false}={}){
  const warnings=[];
  const width=spec.format==='portrait'?1080:1920;
  const height=spec.format==='portrait'?1920:1080;
  for(const [i,scene] of (spec.scenes||[]).entries()){
    const entries=scene.groups.flatMap(group=>group.elements.map(e=>({
      e,start:scene.at+group.at+e.at,
      end:scene.at+group.at+e.at+e.hold
    })));
    for(const {e} of entries){
      if(e.x<6||e.x+e.width>94||e.y<5||e.y+Math.min(e.height||10,15)>96){
        warnings.push({level:'warning',code:'safe-area',message:
          'Escena '+(i+1)+': "'+label(e.heading||e.text)+'" está demasiado cerca del borde.'});
      }
      if(reserveCenter&&spec.format==='landscape'&&
         e.type!=='divider'&&e.type!=='beam'&&e.x<56&&e.x+e.width>44){
        warnings.push({level:'warning',code:'person-zone',message:
          'Escena '+(i+1)+': "'+label(e.text)+'" puede cruzar la zona de la persona.'});
      }
      if(TEXT_TYPES.has(e.type)){
        const actual=textFit(e,width);
        if(actual<27)warnings.push({level:'warning',code:'small-text',
          message:'Escena '+(i+1)+': "'+label(e.text)+'" puede resultar demasiado pequeño ('+
          Math.round(actual)+' px). Amplía el bloque o acorta el texto.'});
      }
      if(e.type==='infoCard'){
        const bodySize=fitParagraphSize({text:e.text,widthPx:width*e.width/100-110,
          heightPx:height*e.height/100-180,requested:40,min:23});
        if(bodySize<=23&&e.text.length>170)warnings.push({
          level:'warning',code:'long-card',message:'Escena '+(i+1)+
            ': la tarjeta de "'+label(e.heading)+'" tiene demasiado texto.'});
      }
    }
    // Use actual time ranges to avoid false alarms between sequential titles.
    for(let a=0;a<entries.length;a++){
      const p=entries[a];
      if(!TEXT_TYPES.has(p.e.type)&&p.e.type!=='infoCard')continue;
      for(let b=a+1;b<entries.length;b++){
        const q=entries[b];
        if(!TEXT_TYPES.has(q.e.type)&&q.e.type!=='infoCard')continue;
        const overlap=Math.min(p.end,q.end)-Math.max(p.start,q.start);
        if(overlap<0.3)continue;
        const horizontal=Math.min(p.e.x+p.e.width,q.e.x+q.e.width)-Math.max(p.e.x,q.e.x);
        const vertical=Math.min(p.e.y+(p.e.type==='infoCard'?p.e.height:10),
          q.e.y+(q.e.type==='infoCard'?q.e.height:10))-Math.max(p.e.y,q.e.y);
        if(horizontal>12&&vertical>6)warnings.push({
          level:'warning',code:'overlap',message:'Escena '+(i+1)+
          ': posible solapamiento entre "'+label(p.e.text)+'" y "'+label(q.e.text)+'".'
        });
      }
    }
  }
  for(const g of coverageGaps(spec)){
    if(g.end-g.start>0.8)warnings.push({level:'warning',code:'gap',
      message:'Sin contenido entre '+g.start.toFixed(1)+' s y '+g.end.toFixed(1)+' s.'});
  }
  return warnings.slice(0,20);
}
