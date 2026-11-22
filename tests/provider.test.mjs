import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAiCompatibleProvider} from '../server/ai/provider.mjs';

const brief={headline:'EL FUTURO SE MUEVE',supportingCopy:'Prueba técnica',
  visualDirection:'Estilo editorial con transparencias',layout:'Grupos por zonas',
  animationPlan:'Ocho beats coordinados',assets:'orbit, kinetic, callout'};

function plan(count){return {shots:Array.from({length:count},(_,i)=>({
  title:'PLANO '+(i+1),intent:'Desarrollo de demo',visual:'SVG y tipografía cinética',
  preset:'hero',transition:'fade'
}))};}

function shot(target){
  const distribution=target===9?[3,2,2,2]:target===7?[2,2,2,1]:target===6?[2,2,1,1]:target===4?[1,1,1,1]:[2,2,2,2];
  return {groups:distribution.map((count,group)=>({
    motion:['spring','left','right','blur'][group],at:group*0.2,hold:7.5-group*0.2,
    elements:Array.from({length:count},(_,i)=>({
      type:'title',text:'TEXTO DEMO '+group+' '+i,value:0,icon:'globe',
      x:10+group*20,y:12+i*12,width:17,size:32,color:'white',
      animation:'fade',at:0,hold:6
    }))
  }))};
}

function fakeProvider(responses){
  const calls=[];
  const provider=createOpenAiCompatibleProvider({baseUrl:'https://provider.example/v1',apiKey:'private'},
    async(_url,options)=>{
      const json=JSON.parse(options.body);calls.push({options,body:json});
      const content=responses[calls.length-1];
      if(!content)throw new Error('Mock sin respuesta número '+calls.length);
      return {ok:true,status:200,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify(content)}}]})};
    });
  return {provider,calls};
}

test('genera briefing, storyboard y planos independientes con progreso',async()=>{
  const {provider,calls}=fakeProvider([brief,plan(2),shot(4),shot(4)]);
  const progress=[];
  const result=await provider.generateScene({
    model:'gpt-oss-20b',prompt:'Un titular de demo',format:'landscape',duration:6,
    onProgress:p=>progress.push(p)
  });
  assert.equal(calls.length,4);
  assert.deepEqual(calls.map(c=>c.body.response_format.json_schema.name),
    ['creative_brief','storyboard_plan','motion_shot','motion_shot']);
  assert.equal(calls[0].options.headers.Authorization,'Bearer private');
  assert.equal(calls[0].body.messages[1].content,'Un titular de demo');
  assert.equal(result.scene.scenes.length,2);
  assert.equal(result.metrics.groups,8);
  assert.equal(result.metrics.elements,8);
  assert.equal(result.metrics.keyframes,24);
  assert.equal(progress[0].stage,'brief');
  assert.equal(progress.at(-1).stage,'complete');
  assert.equal(progress.at(-1).completed,4);
});

test('una generación de 60s produce referencia de 8 escenas, 32 grupos, 65 elementos y 96 keyframes',async()=>{
  const counts=[9,8,8,8,9,8,8,7];
  const {provider,calls}=fakeProvider([brief,plan(8),...counts.map(shot)]);
  const result=await provider.generateScene({model:'gpt-oss-20b',
    prompt:'Demo de 60 segundos',format:'landscape',duration:60});
  assert.equal(calls.length,10);
  assert.deepEqual(result.metrics,{shots:8,groups:32,elements:65,keyframes:96});
  assert.equal(result.scene.scenes.at(-1).at+result.scene.scenes.at(-1).hold,60);
});

test('el proveedor se detiene si el briefing es inválido',async()=>{
  const {provider,calls}=fakeProvider([{headline:'Solo un campo'}]);
  await assert.rejects(provider.generateScene({model:'test',prompt:'Hola',format:'portrait',duration:6}),
    /briefing creativo válido/);
  assert.equal(calls.length,1);
});

test('un plano insuficiente se reintenta y falla sin esconder elementos faltantes',async()=>{
  const incomplete={groups:[{motion:'fade',at:0,hold:6,elements:[{type:'title',text:'TEST'}]}]};
  const {provider,calls}=fakeProvider([brief,plan(2),incomplete,incomplete]);
  await assert.rejects(provider.generateScene({model:'test',prompt:'Hola',format:'portrait',duration:6}),
    /cuatro grupos en el plano 1/);
  assert.equal(calls.length,4);
});


test('GPT-OSS genera una tarjeta sencilla con una sola llamada, sin inventar cuatro grupos',async()=>{
  const content={headline:'BIOTIPOS',description:'Clasificación según características físicas y biológicas.',items:[]};
  const {provider,calls}=fakeProvider([content]);
  const result=await provider.generateScene({model:'gpt-oss-20b',
    prompt:'Explicación breve de biotipos en contenedor vertical a la derecha con Montserrat',
    format:'landscape',duration:7});
  assert.equal(calls.length,1);
  assert.equal(calls[0].body.response_format.json_schema.name,'simple_content');
  assert.equal(result.metrics.groups,1);
  assert.equal(result.metrics.elements,1);
  const e=result.scene.scenes[0].groups[0].elements[0];
  assert.equal(e.type,'infoCard');
  assert.equal(e.heading,'BIOTIPOS');
  assert.equal(e.font,'Montserrat');
  assert.equal(e.x,55);
});

test('modo explícito de tipografía no genera planes innecesarios',async()=>{
  const {provider,calls}=fakeProvider([{headline:'',description:'',
    items:['UN CUERPO','EN EQUILIBRIO','NO ENCUENTRA','ENFERMEDAD']}]);
  const result=await provider.generateScene({model:'gpt-oss-20b',
    prompt:'Pon estas cuatro frases alrededor de una persona',mode:'typography',
    placement:'around-person',font:'Montserrat',format:'landscape',duration:2});
  assert.equal(calls.length,1);
  assert.equal(result.scene.duration,2);
  assert.equal(result.scene.scenes[0].groups.length,4);
  assert.equal(result.scene.scenes[0].groups.at(-1).elements[0].text,'ENFERMEDAD');
});
