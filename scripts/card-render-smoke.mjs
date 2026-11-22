import path from 'node:path';
import os from 'node:os';
import {readFile} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import pngjs from 'pngjs';
import {normalizeSpec} from '../src/shared/spec.js';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

const {PNG}=pngjs;
const source=JSON.parse(await readFile(path.resolve('examples/biotipos-info-card.json'),'utf8'));
const spec=normalizeSpec(source);
const inputProps={spec};
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.jsx'),
  bundlerOverride:tailwindBundlerOverride});
const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
const output=path.join(os.tmpdir(),'vrm-biotipos-card.png');
await renderStill({serveUrl,composition,inputProps,frame:90,imageFormat:'png',output,scale:0.5});
const png=PNG.sync.read(await readFile(output));
let visibleRight=0,visibleLeft=0,transparent=0;
for(let y=0;y<png.height;y++){
  for(let x=0;x<png.width;x++){
    const alpha=png.data[(y*png.width+x)*4+3];
    if(alpha===0)transparent++;
    if(alpha>20){
      if(x>png.width*0.52&&x<png.width*0.97)visibleRight++;
      if(x<png.width*0.48)visibleLeft++;
    }
  }
}
if(visibleRight<10000)throw new Error('Tarjeta ilegible o vacía a la derecha.');
if(visibleLeft>300)throw new Error('La tarjeta ha invadido la zona de la persona.');
if(transparent<png.width*png.height*0.3)throw new Error('El render ha perdido transparencia.');
console.log('OK: tarjeta a la derecha, centro libre y alfa:',{visibleRight,visibleLeft,transparent,output});
