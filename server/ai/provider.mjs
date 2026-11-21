import {sceneJsonSchema} from '../../src/shared/spec.js';
import {buildSystemPrompt} from './prompt.mjs';

export function createOpenAiCompatibleProvider(config,request=fetch) {
  const headers={'Content-Type':'application/json'};
  if (config.apiKey) headers.Authorization='Bearer '+config.apiKey;
  async function call(endpoint,options={}) {
    const {timeoutMs=10000,...fetchOptions}=options;
    const response=await request(config.baseUrl+endpoint,{
      ...fetchOptions,headers:{...headers,...fetchOptions.headers},signal:AbortSignal.timeout(timeoutMs)
    });
    const text=await response.text();
    let data;
    try {data=JSON.parse(text);} catch {throw new Error('Respuesta no JSON (HTTP '+response.status+').');}
    if (!response.ok) throw new Error('Error del proveedor (HTTP '+response.status+'): '+String(data.error?.message||'Petición rechazada').slice(0,200));
    return data;
  }
  return {
    async listModels() {
      if (config.model) return [config.model];
      const body=await call('/models');
      return (Array.isArray(body.data)?body.data:[]).map(m=>m?.id).filter(x=>typeof x==='string');
    },
    async generateScene({model,prompt,format,duration}) {
      const body=await call('/chat/completions',{
        method:'POST',timeoutMs:180000,
        body:JSON.stringify({
          model,temperature:0.35,max_tokens:1600,stream:false,
          messages:[{role:'system',content:buildSystemPrompt({format,duration})},{role:'user',content:prompt}],
          response_format:{type:'json_schema',json_schema:{name:'overlay_scene',strict:true,schema:sceneJsonSchema}}
        })
      });
      const content=body.choices?.[0]?.message?.content;
      if (typeof content!=='string') throw new Error('El modelo no devolvió texto. Usa un modelo instruct compatible con JSON.');
      try {return JSON.parse(content.replace(/^`{3}(?:json)?\s*/,'').replace(/\s*`{3}$/,''));}
      catch {throw new Error('JSON inválido devuelto por el modelo.');}
    }
  };
}
