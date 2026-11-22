import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createApiRouter} from '../server/routes/api.mjs';
import {createStressDemo} from '../src/shared/stress-demo.js';

test('la API transmite progreso y devuelve una escena V2 de 60s por NDJSON',async()=>{
  const app=express();
  app.use(express.json({limit:'256kb'}));
  const ai={
    listModels:async()=>['gpt-oss-20b'],
    async generateScene({onProgress}){
      onProgress({stage:'brief',completed:0,total:10,detail:'Briefing'});
      onProgress({stage:'shot',completed:8,total:10,detail:'Plano 7/8'});
      return {scene:createStressDemo(),brief:{headline:'DEMO'},metrics:{shots:8,groups:32,elements:65,keyframes:96}};
    }
  };
  const renderer={async render(_spec,_codec,{onProgress}={}){
    onProgress?.({stage:'render',percent:63});
    return {filename:'sample.mov',url:'/api/files/sample.mov'};
  }};
  app.use('/api',createApiRouter({config:{provider:'lmstudio',model:''},ai,renderer}));
  const server=await new Promise(resolve=>{const current=app.listen(0,'127.0.0.1',()=>resolve(current));});
  const base='http://127.0.0.1:'+server.address().port;
  try{
    const generation=await fetch(base+'/api/generate/stream',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'gpt-oss-20b',prompt:'Demo',format:'landscape',duration:60})});
    assert.equal(generation.status,200);
    const events=(await generation.text()).trim().split('\n').map(JSON.parse);
    assert.deepEqual(events.map(event=>event.type),['progress','progress','result']);
    assert.equal(events.at(-1).spec.scenes.length,8);
    assert.equal(events.at(-1).metrics.elements,65);

    const render=await fetch(base+'/api/render/stream',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({spec:createStressDemo(),codec:'mov'})});
    assert.equal(render.status,200);
    const renderEvents=(await render.text()).trim().split('\n').map(JSON.parse);
    assert.equal(renderEvents[0].percent,63);
    assert.equal(renderEvents.at(-1).url,'/api/files/sample.mov');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
