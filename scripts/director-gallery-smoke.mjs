import path from 'node:path';
import os from 'node:os';
import {mkdir,readFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import pngjs from 'pngjs';
import {composeFromCatalog} from '../src/shared/design-catalog.js';
import {normalizeSpec,sampleSpec} from '../src/shared/spec.js';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

const {PNG}=pngjs;
const cases=[
  {name:'biotipos-editorial',format:'landscape',duration:7,intent:{mode:'card',placement:'right',font:'Montserrat'},
    designId:'definition-editorial',content:{headline:'BIOTIPOS',
      description:'Una clasificación que agrupa características físicas y biológicas comunes. Los modelos históricos no equivalen a diagnósticos.',items:[]}},
  {name:'biotipos-minimal',format:'landscape',duration:7,intent:{mode:'card',placement:'left',font:'Playfair Display'},
    designId:'definition-minimal',content:{headline:'BIOTIPOS',
      description:'Las clasificaciones biotipológicas describen conjuntos de rasgos. Su uso histórico debe distinguirse de la medicina actual.',items:[]}},
  {name:'humores-ribbons',format:'landscape',duration:7,intent:{mode:'list',placement:'around-person',font:'Montserrat'},
    designId:'labels-ribbons',content:{headline:'',description:'',items:['Bilis amarilla','Bilis negra','Flema','Sangre']}},
  {name:'palabras-centradas',format:'landscape',duration:2,intent:{mode:'typography',placement:'around-person',font:'Oswald'},
    designId:'type-sides',content:{headline:'',description:'',items:['UN CUERPO','EN EQUILIBRIO','NO ENCUENTRA','ENFERMEDAD']}},
  {name:'movil-tarjeta',format:'portrait',duration:7,intent:{mode:'card',placement:'center',font:'Montserrat'},
    designId:'definition-outline',content:{headline:'BIOTIPOS',
      description:'Las clasificaciones biotipológicas agrupan rasgos físicos y biológicos. Se deben interpretar en su contexto histórico.',items:[]}}
];
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.jsx'),
  bundlerOverride:tailwindBundlerOverride});
const directory=path.join(os.tmpdir(),'vrm-director-gallery');
await mkdir(directory,{recursive:true});
for(const item of cases){
  const {spec}=composeFromCatalog(item);
  const normalized=normalizeSpec(spec);
  const props={spec:normalized};
  const composition=await selectComposition({serveUrl,id:'Overlay',inputProps:props});
  const output=path.join(directory,item.name+'.png');
  await renderStill({serveUrl,composition,inputProps:props,
    frame:Math.max(0,Math.min(composition.durationInFrames-2,Math.round(item.duration*30*.75))),
    imageFormat:'png',output,scale:0.5});
  const {width,height,data}=PNG.sync.read(await readFile(output));
  let visible=0,transparent=0,left=0,right=0,center=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=data[(y*width+x)*4+3];
    if(a===0)transparent++;
    if(a>40){
      visible++;
      if(x<width*.45)left++;
      if(x>width*.55)right++;
      if(x>width*.45&&x<width*.55)center++;
    }
  }
  if(visible<600)throw new Error(item.name+': render vacío.');
  if(transparent<width*height*.24)throw new Error(item.name+': perdido el alfa.');
  if(item.name==='biotipos-editorial'&&left>350)throw new Error('Tarjeta invadió el centro/izquierda.');
  if(item.name==='humores-ribbons'&&(left<500||right<500))throw new Error('Faltan rótulos a un lado.');
  if(item.name==='palabras-centradas'&&(left<500||right<500))throw new Error('Faltan titulares a un lado.');
  console.log('VISUAL OK',item.name,{visible,transparent,left,right,center,output});
}

const nativeProps={spec:normalizeSpec({...sampleSpec,transitionEngine:'remotion'})};
const nativeComposition=await selectComposition({serveUrl,id:'Overlay',inputProps:nativeProps});
const transitionOutput=path.join(directory,'native-transitions.png');
await renderStill({serveUrl,composition:nativeComposition,inputProps:nativeProps,
  frame:123,imageFormat:'png',output:transitionOutput,scale:0.5});
const frame=PNG.sync.read(await readFile(transitionOutput));
let active=0,clear=0;
for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
  const a=frame.data[(y*frame.width+x)*4+3];
  if(a>30)active++;
  if(a===0)clear++;
}
if(active<600||clear<frame.width*frame.height*0.2)
  throw new Error('Transición nativa sin contenido visible o sin transparencia.');
console.log('VISUAL OK native-transitions',{active,clear,transitionOutput});


// Exact regression for the screenshot where an old normalizer erased
// " bilis negra." (the final 13 characters of a 133-character paragraph).
const humores=JSON.parse(await readFile(path.resolve('examples/humores-explanation.json'),'utf8'));
const fullCopy=humores.scenes[0].groups[0].elements[0].text;
const checked=normalizeSpec(humores);
if(fullCopy.length!==133||checked.scenes[0].groups[0].elements[0].text!==fullCopy)
  throw new Error('Regresión: explicación de humores truncada.');
const humoresProps={spec:checked};
const humoresComp=await selectComposition({serveUrl,id:'Overlay',inputProps:humoresProps});
const humoresOutput=path.join(directory,'humores-explanation.png');
await renderStill({serveUrl,composition:humoresComp,inputProps:humoresProps,frame:120,
  imageFormat:'png',output:humoresOutput,scale:0.5});
const humoresImage=PNG.sync.read(await readFile(humoresOutput));
let ink=0,transparentHumores=0;
for(let y=0;y<humoresImage.height;y++)for(let x=0;x<humoresImage.width;x++){
  const alpha=humoresImage.data[(y*humoresImage.width+x)*4+3];
  if(alpha===0)transparentHumores++;
  if(x>humoresImage.width*.52&&alpha>80)ink++;
}
if(ink<3000||transparentHumores<humoresImage.width*humoresImage.height*.25)
  throw new Error('El ejemplo de los humores no tiene tarjeta visible y alfa.');
console.log('VISUAL OK humores-explanation',{ink,transparentHumores,humoresOutput});
