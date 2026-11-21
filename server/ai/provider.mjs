import {sceneJsonSchema} from '../../src/shared/spec.js';
import {creativeBriefSchema,buildCreativeBriefPrompt,buildSystemPrompt,validateCreativeBrief} from './prompt.mjs';

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

  async function completeJson({model,system,user,schema,name,temperature,maxTokens}) {
    const body=await call('/chat/completions',{
      method:'POST',timeoutMs:180000,
      body:JSON.stringify({
        model,temperature,max_tokens:maxTokens,stream:false,
        messages:[{role:'system',content:system},{role:'user',content:user}],
        response_format:{type:'json_schema',json_schema:{name,strict:true,schema}}
      })
    });
    const content=body.choices?.[0]?.message?.content;
    if (typeof content!=='string') throw new Error('El modelo no devolvió texto. Usa un modelo instruct compatible con JSON.');
    try {return JSON.parse(content.replace(/^`{3}(?:json)?\\s*/,'').replace(/\\s*`{3}$/,''));}
    catch {throw new Error('JSON inválido devuelto por el modelo.');}
  }

  return {
    async listModels() {
      if (config.model) return [config.model];
      const body=await call('/models');
      return (Array.isArray(body.data)?body.data:[]).map(m=>m?.id).filter(x=>typeof x==='string');
    },
    async generateScene({model,prompt,format,duration}) {
      // Dos pasos: dirección creativa -> especificación técnica validable.
      // Ambos usan el mismo proveedor configurado, sin exponer claves al navegador.
      const brief=validateCreativeBrief(await completeJson({
        model,
        system:buildCreativeBriefPrompt({format,duration}),
        user:prompt,
        schema:creativeBriefSchema,
        name:'creative_brief',
        temperature:0.6,
        maxTokens:900
      }));
      const scene=await completeJson({
        model,
        system:buildSystemPrompt({format,duration}),
        user:JSON.stringify({originalRequest:prompt,creativeBrief:brief}),
        schema:sceneJsonSchema,
        name:'overlay_scene',
        temperature:0.25,
        maxTokens:1800
      });
      return {brief,scene};
    }
  };
}
