import {Router} from 'express';
import {normalizeSpec} from '../../src/shared/spec.js';

export function createApiRouter({config,ai,renderer}) {
  const router=Router();
  router.get('/health',(_req,res)=>res.json({ok:true,provider:config.provider}));
  router.get('/models',async (_req,res)=>{
    try{res.json({models:await ai.listModels(),provider:config.provider});}
    catch(error){res.status(503).json({error:error.message});}
  });

  function generationArgs(req){
    const {model,prompt,format,duration}=req.body||{};
    const chosen=config.model||model;
    if(typeof chosen!=='string'||!chosen.trim()||chosen.length>200||
       typeof prompt!=='string'||!prompt.trim()||prompt.length>2500){
      const err=new Error('Selecciona modelo y prompt válido (máximo 2500 caracteres).');
      err.status=400;throw err;
    }
    // Use the exact same bounds and format as export and preview.
    const options=normalizeSpec({elements:[{type:'title',text:'test'}]},{format,duration});
    return {model:chosen,prompt:prompt.trim(),format:options.format,duration:options.duration};
  }
  function resultPayload(result,options){
    return {spec:normalizeSpec(result.scene,{format:options.format,duration:options.duration}),
      brief:result.brief,plan:result.plan,metrics:result.metrics};
  }
  router.post('/generate',async (req,res)=>{
    try{
      const options=generationArgs(req);
      res.json(resultPayload(await ai.generateScene(options),options));
    }catch(error){res.status(error.status||502).json({error:error.message});}
  });

  // Streaming progress uses newline-delimited JSON; it keeps a 10-call local
  // GPT-OSS generation understandable without requiring websockets or a queue.
  router.post('/generate/stream',async(req,res)=>{
    let options;
    try{options=generationArgs(req);}catch(error){res.status(error.status||400).json({error:error.message});return;}
    res.status(200);
    res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('X-Accel-Buffering','no');
    res.flushHeaders();
    const controller=new AbortController();
    res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    const send=data=>{if(!res.destroyed&&!res.writableEnded)res.write(JSON.stringify(data)+'\n');};
    try{
      const result=await ai.generateScene({
        ...options,signal:controller.signal,
        onProgress:progress=>send({type:'progress',...progress})
      });
      send({type:'result',...resultPayload(result,options)});
    }catch(error){
      if(!controller.signal.aborted)send({type:'error',message:String(error.message).slice(0,450)});
    }finally{if(!res.writableEnded)res.end();}
  });

  router.post('/render/stream',async(req,res)=>{
    let spec,codec;
    try{
      codec=req.body?.codec;
      if(!['mov','webm'].includes(codec)){const e=new Error('Usa mov o webm.');e.status=400;throw e;}
      spec=normalizeSpec(req.body.spec);
    }catch(error){res.status(error.status||400).json({error:error.message});return;}
    res.status(200);
    res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control','no-cache, no-transform');
    res.setHeader('X-Accel-Buffering','no');
    res.flushHeaders();
    const controller=new AbortController();
    res.on('close',()=>{if(!res.writableEnded)controller.abort();});
    const send=data=>{if(!res.destroyed&&!res.writableEnded)res.write(JSON.stringify(data)+'\n');};
    try{
      const result=await renderer.render(spec,codec,{
        signal:controller.signal,onProgress:progress=>send({type:'progress',...progress})
      });
      send({type:'result',...result});
    }catch(error){
      if(!controller.signal.aborted)send({type:'error',message:String(error.message).slice(0,450)});
    }finally{if(!res.writableEnded)res.end();}
  });
  router.post('/render',async(req,res)=>{
    try{
      if(!['mov','webm'].includes(req.body?.codec))return res.status(400).json({error:'Usa mov o webm.'});
      const spec=normalizeSpec(req.body.spec);
      res.json(await renderer.render(spec,req.body.codec));
    }catch(error){res.status(error.status||500).json({error:error.message});}
  });
  return router;
}
