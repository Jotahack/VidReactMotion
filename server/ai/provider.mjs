import {creativeBriefSchema,buildCreativeBriefPrompt,validateCreativeBrief} from './prompt.mjs';
import {storyboardPlanSchema,shotJsonSchema,targetShotCount,targetElementCount,
  normalizeStoryboardPlan,assembleStoryboard,buildStoryboardPlanPrompt,buildShotPrompt} from './storyboard.mjs';
import {normalizeSpec} from '../../src/shared/spec.js';
import {arrangeCinematicShot} from './layout.mjs';

export function createOpenAiCompatibleProvider(config,request=fetch) {
  const headers={'Content-Type':'application/json'};
  if(config.apiKey)headers.Authorization='Bearer '+config.apiKey;

  async function call(endpoint,{timeoutMs=10000,signal,...fetchOptions}={}) {
    const timeout=AbortSignal.timeout(timeoutMs);
    const combined=signal?AbortSignal.any([signal,timeout]):timeout;
    const response=await request(config.baseUrl+endpoint,{
      ...fetchOptions,headers:{...headers,...fetchOptions.headers},signal:combined
    });
    const text=await response.text();
    let data;
    try{data=JSON.parse(text);}catch{throw new Error('Respuesta no JSON (HTTP '+response.status+').');}
    if(!response.ok)throw new Error('Proveedor HTTP '+response.status+': '+String(data.error?.message||'Petición rechazada').slice(0,240));
    return data;
  }

  async function completeJson({model,system,user,schema,name,temperature=0.35,maxTokens=2400,signal}) {
    const body=await call('/chat/completions',{
      method:'POST',timeoutMs:300000,signal,body:JSON.stringify({
        model,temperature,max_tokens:maxTokens,stream:false,
        messages:[{role:'system',content:system},{role:'user',content:user}],
        response_format:{type:'json_schema',json_schema:{name,strict:true,schema}}
      })
    });
    const message=body.choices?.[0]?.message;
    if(message?.refusal)throw new Error('El modelo rechazó la petición.');
    const content=message?.content;
    if(typeof content!=='string'||!content.trim())throw new Error('Respuesta vacía: revisa límite de tokens y modo de razonamiento en LM Studio.');
    const stripped=content.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');
    try{return JSON.parse(stripped);}catch{throw new Error('El modelo devolvió un JSON incompleto o inválido; revisa max_tokens.');}
  }

  return {
    async listModels(){
      if(config.model)return [config.model];
      const body=await call('/models');
      return (Array.isArray(body.data)?body.data:[]).map(m=>m?.id).filter(x=>typeof x==='string');
    },

    async generateScene({model,prompt,format,duration,onProgress=()=>{},signal}) {
      const count=targetShotCount(duration);
      const steps=count+2;
      const notify=(stage,completed,detail)=>onProgress({stage,completed,total:steps,detail});
      notify('brief',0,'Desarrollando dirección creativa');
      const brief=validateCreativeBrief(await completeJson({
        model,system:buildCreativeBriefPrompt({format,duration}),
        user:prompt,schema:creativeBriefSchema,name:'creative_brief',
        temperature:0.5,maxTokens:1900,signal
      }));
      notify('plan',1,'Organizando '+count+' planos con continuidad visual');
      const rawPlan=await completeJson({
        model,system:buildStoryboardPlanPrompt({format,duration,count}),
        user:JSON.stringify({originalRequest:prompt,brief,requiredShots:count}),
        schema:storyboardPlanSchema,name:'storyboard_plan',
        temperature:0.4,maxTokens:3200,signal
      });
      const plan=normalizeStoryboardPlan(rawPlan,duration,brief);
      const shots=[];
      for(let index=0;index<count;index++){
        const planned=plan.shots[index];
        const target=targetElementCount(index,count);
        notify('shot',index+2,'Preparando plano '+(index+1)+'/'+count+' · '+planned.title);
        let shot;
        for(let attempt=0;attempt<2;attempt++){
          const generated=await completeJson({
            model,system:buildShotPrompt({planned,count,index,format,elementCount:target}),
            user:JSON.stringify({originalRequest:prompt,brief,globalPlan:plan.shots.map(s=>({title:s.title,intent:s.intent})),
              shot:planned,expectedGroups:4,expectedElements:target,
              ...(attempt?{correction:'Necesitas CUATRO grupos completos con elementos válidos y tiempos dentro del plano.'}:{})}),
            schema:shotJsonSchema,name:'motion_shot',
            temperature:attempt?0.2:0.38,maxTokens:4400,signal
          });
          if(Array.isArray(generated?.groups)&&generated.groups.length===4&&
              generated.groups.every(g=>Array.isArray(g.elements)&&g.elements.length>0)&&
              generated.groups.reduce((n,g)=>n+g.elements.length,0)>=target){
            shot=generated;
            break;
          }
        }
        if(!shot)throw new Error('El modelo no pudo construir cuatro grupos en el plano '+(index+1)+'.');
        shots.push(arrangeCinematicShot(shot,format));
        notify('shot',index+3,'Plano '+(index+1)+'/'+count+' terminado');
      }
      const assembled=assembleStoryboard(plan,shots,format,duration);
      const scene=normalizeSpec(assembled,{format,duration});
      notify('complete',steps,'Storyboard completo y validado');
      const groups=scene.scenes.reduce((n,s)=>n+s.groups.length,0);
      const elements=scene.scenes.reduce((n,s)=>n+s.groups.reduce((a,g)=>a+g.elements.length,0),0);
      const keyframes=scene.scenes.reduce((n,s)=>n+s.groups.reduce((a,g)=>a+(g.keyframes?.length||0),0),0);
      return {brief,plan,scene,metrics:{shots:scene.scenes.length,groups,elements,keyframes}};
    }
  };
}
