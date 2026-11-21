import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderMedia} from '@remotion/renderer';

export function createRenderService({root,outputDir}) {
  let bundlePromise;
  let rendering=false;
  async function getBundle() {
    if (!bundlePromise) bundlePromise=bundle({entryPoint:path.join(root,'src/remotion/index.jsx')})
      .catch(error=>{bundlePromise=undefined;throw error;});
    return bundlePromise;
  }
  return {async render(spec,codec) {
    if (rendering) {const error=new Error('Ya hay un render en curso.');error.status=429;throw error;}
    rendering=true;
    try {
      const extension=codec==='webm'?'webm':'mov';
      const filename='overlay-'+Date.now()+'-'+randomUUID().slice(0,8)+'.'+extension;
      const serveUrl=await getBundle();
      const inputProps={spec};
      const composition=await selectComposition({serveUrl,id:'Overlay',inputProps});
      await renderMedia({
        composition,serveUrl,inputProps,outputLocation:path.join(outputDir,filename),
        codec:extension==='mov'?'prores':'vp8',
        ...(extension==='mov'?{proResProfile:'4444',pixelFormat:'yuva444p10le'}:{pixelFormat:'yuva420p'}),
        imageFormat:'png'
      });
      return {filename,url:'/api/files/'+filename};
    } finally {rendering=false;}
  }};
}
