import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAiCompatibleProvider} from '../server/ai/provider.mjs';

const brief={
  headline:'CAMBIA EL MUNDO',
  supportingCopy:'Un titular de prueba',
  visualDirection:'Texto blanco con acentos rojos y cian',
  layout:'Titular centrado y etiqueta arriba',
  animationPlan:'Etiqueta izquierda, título hacia arriba, cierre por fundido',
  assets:'globe'
};

test('la IA refina la idea antes de generar el JSON renderizable',async()=>{
 const calls=[];
 const responses=[brief,{elements:[{type:'title',text:'CAMBIA EL MUNDO'}]}];
 const ai=createOpenAiCompatibleProvider({baseUrl:'https://api.example.com/v1',apiKey:'secret',model:'test'},
   async (url,options)=>{
     calls.push({url,options,body:JSON.parse(options.body)});
     return {ok:true,status:200,text:async()=>JSON.stringify({
       choices:[{message:{content:JSON.stringify(responses[calls.length-1])}}]
     })};
   });
 const data=await ai.generateScene({model:'test',prompt:'Un titular sobre el mundo',duration:6,format:'landscape'});
 assert.deepEqual(data.brief,brief);
 assert.deepEqual(data.scene,responses[1]);
 assert.equal(calls.length,2);
 assert.equal(calls[0].options.headers.Authorization,'Bearer secret');
 assert.equal(calls[0].body.response_format.json_schema.name,'creative_brief');
 assert.equal(calls[1].body.response_format.json_schema.name,'overlay_scene');
 assert.equal(calls[0].body.messages[1].content,'Un titular sobre el mundo');
 assert.deepEqual(JSON.parse(calls[1].body.messages[1].content),{
   originalRequest:'Un titular sobre el mundo',creativeBrief:brief
 });
 assert.equal(calls[0].body.response_format.type,'json_schema');
 assert.equal(calls[1].body.response_format.type,'json_schema');
});

test('el proveedor no continúa a generar escena si el briefing es inválido',async()=>{
 let calls=0;
 const ai=createOpenAiCompatibleProvider({baseUrl:'https://api.example.com/v1',apiKey:''},
   async()=>{
     calls++;
     return {ok:true,status:200,text:async()=>JSON.stringify({
       choices:[{message:{content:'{"headline":"Solo un campo"}'}}]
     })};
   });
 await assert.rejects(
   ai.generateScene({model:'test',prompt:'Hola',format:'portrait',duration:6}),
   /briefing creativo válido/
 );
 assert.equal(calls,1);
});
