import path from 'node:path';
import os from 'node:os';
import {mkdir,readFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill} from '@remotion/renderer';
import pngjs from 'pngjs';
import {createStressDemo} from '../src/shared/stress-demo.js';
import {normalizeSpec} from '../src/shared/spec.js';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

const {PNG}=pngjs;
const spec=normalizeSpec(createStressDemo());
const output=path.join(os.tmpdir(),'vrm-stress-smoke');
await mkdir(output,{recursive:true});
const serveUrl=await bundle({
  entryPoint:path.resolve('src/remotion/index.jsx'),
  bundlerOverride:tailwindBundlerOverride
});
const inputProps={spec};
const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
if(composition.durationInFrames!==1800)throw new Error('Se esperaban 1800 fotogramas para el vídeo de 60 s.');

for(const frame of [45,315,855,1650]){
  const file=path.join(output,'stress-frame-'+String(frame).padStart(4,'0')+'.png');
  await renderStill({serveUrl,composition,inputProps,frame,imageFormat:'png',
    output:file,scale:0.25});
  const png=PNG.sync.read(await readFile(file));
  let visible=0,transparent=0;
  for(let i=3;i<png.data.length;i+=4){
    const alpha=png.data[i];
    if(alpha>15)visible++;
    if(alpha===0)transparent++;
  }
  if(visible<500)throw new Error('Fotograma '+frame+' parece vacío ('+visible+' píxeles visibles).');
  if(transparent<5000)throw new Error('Fotograma '+frame+' perdió la transparencia ('+transparent+' píxeles transparentes).');
  console.log('Frame '+frame+': '+png.width+'x'+png.height+' | visible '+visible+' | transparent '+transparent+' | '+file);
}
console.log('OK: renders reales de cuatro planos, contenido visible y canal alfa en PNG.');
