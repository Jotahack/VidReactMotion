import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,stat} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';
import {createStressDemo} from '../src/shared/stress-demo.js';
import {normalizeSpec} from '../src/shared/spec.js';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

const execFileAsync=promisify(execFile);
const spec=normalizeSpec(createStressDemo());
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.jsx'),
  bundlerOverride:tailwindBundlerOverride});
const inputProps={spec};
const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
const outputLocation=path.join(os.tmpdir(),'vrm-alpha-smoke.mov');
await renderMedia({composition,serveUrl,inputProps,outputLocation,
  codec:'prores',proResProfile:'4444',pixelFormat:'yuva444p10le',
  imageFormat:'png',frames:[0,29],scale:0.25,concurrency:2});
const info=await stat(outputLocation);
if(info.size<4000)throw new Error('El MOV exportado está vacío.');
const {stdout}=await execFileAsync('ffprobe',[
  '-v','error','-select_streams','v:0',
  '-show_entries','stream=codec_name,profile,pix_fmt',
  '-of','json',outputLocation
]);
const stream=JSON.parse(stdout).streams?.[0];
if(stream?.codec_name!=='prores'||!String(stream.pix_fmt).startsWith('yuva')){
  throw new Error('El MOV no conserva canal alfa: '+JSON.stringify(stream));
}
console.log('ProRes alpha comprobado:',stream,'bytes:',info.size,'archivo:',outputLocation);
