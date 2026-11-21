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
const output=path.join(os.tmpdir(),'vrm-stress-smoke');
await mkdir(output,{recursive:true});
const serveUrl=await bundle({
  entryPoint:path.resolve('src/remotion/index.jsx'),
  bundlerOverride:tailwindBundlerOverride
});

async function renderAndVerify(format,frames){
  const spec=normalizeSpec(createStressDemo(format));
  const inputProps={spec};
  const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
  if(composition.durationInFrames!==1800)throw new Error('El vídeo de '+format+' debe tener 1800 fotogramas.');
  if(format==='portrait'&&composition.height!==1920)throw new Error('No se aplicó formato vertical 9:16.');
  for(const frame of frames){
    const file=path.join(output,'stress-'+format+'-'+String(frame).padStart(4,'0')+'.png');
    await renderStill({serveUrl,composition,inputProps,frame,imageFormat:'png',
      output:file,scale:0.25});
    const png=PNG.sync.read(await readFile(file));
    let visible=0,transparent=0;
    for(let i=3;i<png.data.length;i+=4){
      if(png.data[i]>15)visible++;
      if(png.data[i]===0)transparent++;
    }
    if(visible<500)throw new Error('El fotograma '+format+' '+frame+' parece vacío.');
    if(transparent<5000)throw new Error('El fotograma '+format+' '+frame+' no conserva alfa.');
    console.log(format,frame,'visible:',visible,'transparent:',transparent,'PNG:',file);
  }
}
await renderAndVerify('landscape',[45,315,855,1650]);
await renderAndVerify('portrait',[45,855]);
console.log('OK: seis renders reales en 16:9 y 9:16 con canal alfa PNG.');
