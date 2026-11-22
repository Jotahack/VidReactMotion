import path from 'node:path';
import os from 'node:os';
import {mkdir,readFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import pngjs from 'pngjs';
import {composeFromCatalog} from '../src/shared/design-catalog.js';
import {normalizeSpec} from '../src/shared/spec.js';
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
