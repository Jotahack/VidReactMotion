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

const narrow=JSON.parse(JSON.stringify(fixture));
narrow.scenes[0].groups=[narrow.scenes[0].groups[3]];
const element=narrow.scenes[0].groups[0].elements[0];
element.x=62;element.y=54;element.width=24;element.size=90;
const narrowSpec=normalizeSpec(narrow);
const narrowLocation=path.join(os.tmpdir(),'vrm-legacy-longword-smoke.png');
const narrowProps={spec:narrowSpec};
const narrowComposition=await selectComposition({serveUrl,id:'Overlay',inputProps:narrowProps});
await renderStill({serveUrl,composition:narrowComposition,inputProps:narrowProps,
  frame:220,imageFormat:'png',output:narrowLocation,scale:0.5});
const narrowPng=PNG.sync.read(await readFile(narrowLocation));
let left=narrowPng.width,right=0,top=narrowPng.height,bottom=0,count=0;
for(let y=0;y<narrowPng.height;y++)for(let x=0;x<narrowPng.width;x++){
  if(narrowPng.data[(y*narrowPng.width+x)*4+3]<96)continue;
  left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
}
if(count<200)throw new Error('El texto ENFERMEDAD ha desaparecido.');
if(bottom-top>narrowPng.height*0.12)throw new Error('ENFERMEDAD se ha dividido en dos líneas: altura '+(bottom-top)+'px.');
if(right>narrowPng.width*0.92)throw new Error('ENFERMEDAD invade el margen derecho.');
console.log('OK: ENFERMEDAD cabe en una sola línea incluso en una columna del 24%:',{left,right,top,bottom},narrowLocation);
