import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAiCompatibleProvider} from '../server/ai/provider.mjs';
test('el proveedor usa auth del servidor y salida JSON estructurada',async()=>{
 let captured;
 const ai=createOpenAiCompatibleProvider({baseUrl:'https://api.example.com/v1',apiKey:'secret',model:'test'},
   async (url,options)=>{captured={url,options};return {ok:true,status:200,text:async()=>JSON.stringify({choices:[{message:{content:'{"elements":[]}'}}]})};});
 const data=await ai.generateScene({model:'test',prompt:'Hola',duration:6,format:'landscape'});
 assert.deepEqual(data,{elements:[]});
 assert.equal(captured.options.headers.Authorization,'Bearer secret');
 assert.equal(JSON.parse(captured.options.body).response_format.type,'json_schema');
});
