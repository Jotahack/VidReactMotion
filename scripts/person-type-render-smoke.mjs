import path from 'node:path';
import os from 'node:os';
import {readFile,mkdir} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {renderStill,selectComposition} from '@remotion/renderer';
import pngjs from 'pngjs';
import {normalizeSpec} from '../src/shared/spec.js';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

const {PNG}=pngjs;
const fixture=JSON.parse(await readFile(path.resolve('examples/person-centered-typography.json'),'utf8'));
const spec=normalizeSpec(fixture);
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.jsx'),bundlerOverride:tailwindBundlerOverride});
const inputProps={spec};
const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
const output=path.join(os.tmpdir(),'vrm-person-type-smoke.png');
await mkdir(path.dirname(output),{recursive:true});
await renderStill({serveUrl,composition,inputProps,frame:220,imageFormat:'png',output,scale:0.5});
const png=PNG.sync.read(await readFile(output));
const quadrants=[0,0,0,0];
let minX=png.width,maxX=0,centerPixels=0;
for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){
  const alpha=png.data[(y*png.width+x)*4+3];
  if(alpha<=32)continue;
  const isLeft=x<png.width*0.48, isRight=x>png.width*0.52;
  const isTop=y<png.height*0.52;
  if(isLeft)quadrants[isTop?0:2]++;
  if(isRight)quadrants[isTop?1:3]++;
  if(x>=png.width*0.46&&x<=png.width*0.54)centerPixels++;
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);
}
if(quadrants.some(n=>n<400))throw new Error('Falta una frase en una columna: '+JSON.stringify(quadrants));
if(minX<png.width*0.05||maxX>png.width*0.95)throw new Error('El texto toca bordes: '+minX+'..'+maxX);
if(centerPixels>400)throw new Error('La columna central no quedó libre: '+centerPixels);
console.log('OK: cuatro frases visibles, palabras completas y pasillo central libre en '+output,quadrants);
