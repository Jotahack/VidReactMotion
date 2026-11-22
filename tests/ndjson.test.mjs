import test from 'node:test';
import assert from 'node:assert/strict';
import {readNdjsonResponse} from '../src/shared/ndjson.js';

test('parser NDJSON reconstruye eventos aunque los paquetes se corten a mitad del JSON',async()=>{
  const encoder=new TextEncoder();
  const chunks=['{"type":"progress","percent":30}\n{"type":','"result","url":"/api/files/test.mov"}\n'];
  const body=new ReadableStream({start(controller){
    chunks.forEach(text=>controller.enqueue(encoder.encode(text)));
    controller.close();
  }});
  const events=[];
  await readNdjsonResponse(new Response(body,{status:200}),e=>events.push(e));
  assert.deepEqual(events.map(e=>e.type),['progress','result']);
  assert.equal(events[1].url,'/api/files/test.mov');
});

test('parser convierte error de servidor en excepción',async()=>{
  const encoder=new TextEncoder();
  const body=new ReadableStream({start(controller){
    controller.enqueue(encoder.encode('{"type":"error","message":"falló plano 4"}\n'));
    controller.close();
  }});
  await assert.rejects(readNdjsonResponse(new Response(body,{status:200}),()=>{}),/falló plano 4/);
});
