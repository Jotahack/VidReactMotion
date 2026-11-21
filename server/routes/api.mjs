import {Router} from 'express';
import {normalizeSpec} from '../../src/shared/spec.js';

export function createApiRouter({config,ai,renderer}) {
  const router=Router();
  router.get('/health',(_req,res)=>res.json({ok:true,provider:config.provider}));
  router.get('/models',async (_req,res)=>{
    try {res.json({models:await ai.listModels(),provider:config.provider});}
    catch(error){res.status(503).json({error:error.message});}
  });
  router.post('/generate',async (req,res)=>{
    try {
      const {model,prompt,format,duration}=req.body||{};
      const chosen=config.model||model;
      if (typeof chosen!=='string'||!chosen.trim()||chosen.length>200||
          typeof prompt!=='string'||!prompt.trim()||prompt.length>2500)
        return res.status(400).json({error:'Selecciona modelo y prompt válido (máximo 2500 caracteres).'});
      const options=normalizeSpec({elements:[{type:'title',text:'test'}]},{format,duration});
      const {scene,brief}=await ai.generateScene({model:chosen,prompt:prompt.trim(),format:options.format,duration:options.duration});
      res.json({spec:normalizeSpec(scene,{format:options.format,duration:options.duration}),brief});
    } catch(error){res.status(502).json({error:error.message});}
  });
  router.post('/render',async (req,res)=>{
    try {
      if (!['mov','webm'].includes(req.body?.codec)) return res.status(400).json({error:'Usa mov o webm.'});
      const spec=normalizeSpec(req.body.spec);
      res.json(await renderer.render(spec,req.body.codec));
    } catch(error){res.status(error.status||500).json({error:error.message});}
  });
  return router;
}
