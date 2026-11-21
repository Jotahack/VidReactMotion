import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {rm} from 'node:fs/promises';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia,makeCancelSignal} from '@remotion/renderer';
import {tailwindBundlerOverride} from './tailwind-bundler.mjs';

export function createRenderService({root,outputDir,
  createBundle=bundle,select=selectComposition,renderMediaFn=renderMedia,
  makeCancel=makeCancelSignal}) {
  let bundlePromise;
  let rendering=false;
  async function getBundle(){
    if(!bundlePromise)bundlePromise=createBundle({
      entryPoint:path.join(root,'src/remotion/index.jsx'),
      bundlerOverride:tailwindBundlerOverride
    }).catch(error=>{bundlePromise=undefined;throw error;});
    return bundlePromise;
  }
  return {
    async render(spec,codec,{onProgress=()=>{},signal}={}){
      if(rendering){const error=new Error('Ya hay un render en curso.');error.status=429;throw error;}
      if(!['mov','webm'].includes(codec))throw new Error('Códec de vídeo no admitido.');
      rendering=true;
      let outputLocation;
      let completed=false;
      const {cancelSignal,cancel}=makeCancel();
      const abort=()=>cancel();
      if(signal?.aborted)abort();
      signal?.addEventListener('abort',abort,{once:true});
      try{
        onProgress({stage:'bundle',percent:0});
        const extension=codec==='webm'?'webm':'mov';
        const filename='overlay-'+Date.now()+'-'+randomUUID().slice(0,8)+'.'+extension;
        const serveUrl=await getBundle();
        if(signal?.aborted)throw new Error('Render cancelado.');
        const inputProps={spec};
        const composition=await select({serveUrl,id:'Overlay',inputProps});
        outputLocation=path.join(outputDir,filename);
        let lastPercent=-1;
        onProgress({stage:'render',percent:0});
        await renderMediaFn({
          composition,serveUrl,inputProps,outputLocation,cancelSignal,
          codec:extension==='mov'?'prores':'vp8',
          ...(extension==='mov'?{proResProfile:'4444',pixelFormat:'yuva444p10le'}:{pixelFormat:'yuva420p'}),
          imageFormat:'png',concurrency:2,
          onProgress:({progress})=>{
            const percent=Math.min(100,Math.floor(progress*100));
            if(percent>lastPercent&&(percent>=lastPercent+2||percent===100)){
              lastPercent=percent;onProgress({stage:'render',percent});
            }
          }
        });
        completed=true;
        onProgress({stage:'done',percent:100});
        return {filename,url:'/api/files/'+filename};
      }finally{
        signal?.removeEventListener('abort',abort);
        rendering=false;
        if(!completed&&outputLocation)await rm(outputLocation,{force:true}).catch(()=>{});
      }
    }
  };
}
