import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderService} from '../server/render/render-service.mjs';

test('exportar MOV avisa progreso, conserva alfa y limita concurrencia',async()=>{
  const progress=[];let renderOptions;
  const service=createRenderService({root:'/tmp',outputDir:'/tmp',
    createBundle:async()=>'/tmp/bundle',select:async()=>({id:'Overlay'}),
    makeCancel:()=>({cancelSignal:{token:true},cancel:()=>{}}),
    renderMediaFn:async options=>{
      renderOptions=options;
      options.onProgress({progress:0.2});
      options.onProgress({progress:0.61});
      options.onProgress({progress:1});
    }
  });
  const result=await service.render({format:'landscape',duration:60,scenes:[]},'mov',{
    onProgress:p=>progress.push(p)
  });
  assert.match(result.filename,/\.mov$/);
  assert.equal(renderOptions.codec,'prores');
  assert.equal(renderOptions.proResProfile,'4444');
  assert.equal(renderOptions.pixelFormat,'yuva444p10le');
  assert.equal(renderOptions.imageFormat,'png');
  assert.equal(renderOptions.concurrency,2);
  assert.ok(progress.some(p=>p.percent===61));
  assert.equal(progress.at(-1).percent,100);
});

test('render simultáneo devuelve 429 y acepta cancelación',async()=>{
  let unlock;let cancelled=false;
  const service=createRenderService({root:'/tmp',outputDir:'/tmp',
    createBundle:async()=>'/tmp/bundle',select:async()=>({id:'Overlay'}),
    makeCancel:()=>({cancelSignal:{},cancel:()=>{cancelled=true;}}),
    renderMediaFn:async()=>new Promise(resolve=>{unlock=resolve;})
  });
  const abort=new AbortController();
  const first=service.render({duration:60},'webm',{signal:abort.signal});
  while(!unlock)await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(service.render({},'webm'),error=>error.status===429);
  abort.abort();
  assert.equal(cancelled,true);
  unlock();
  await first;
});
