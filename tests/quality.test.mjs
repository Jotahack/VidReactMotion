import test from 'node:test';
import assert from 'node:assert/strict';
import {assessComposition} from '../src/shared/quality.js';
import {normalizeSpec} from '../src/shared/spec.js';
import {readFile} from 'node:fs/promises';

test('tarjeta biotipos pasa auditoría básica de márgenes y texto',async()=>{
  const raw=JSON.parse(await readFile(new URL('../examples/biotipos-info-card.json',import.meta.url),'utf8'));
  const spec=normalizeSpec(raw);
  assert.deepEqual(assessComposition(spec),[]);
});

test('avisa si el texto obliga a quedar ilegible en una sola línea',()=>{
  const spec=normalizeSpec({duration:5,format:'landscape',elements:[{
    type:'title',text:'UN TEXTO LARGUÍSIMO QUE NO CABE EN ESTA CAJA',
    x:81,y:25,width:12,size:118,color:'white',lineMode:'single',at:0,hold:5
  }]});
  const issues=assessComposition(spec);
  assert.ok(issues.some(i=>i.code==='small-text'));
});

test('avisa si un elemento invade el centro de la persona',()=>{
  const spec=normalizeSpec({duration:4,elements:[{
    type:'title',text:'TEXTO',x:38,y:35,width:42,size:50,at:0,hold:4
  }]});
  assert.ok(assessComposition(spec,{reserveCenter:true}).some(i=>i.code==='person-zone'));
});

test('diagnostica huecos largos entre las entradas',()=>{
  const spec=normalizeSpec({duration:7,elements:[{
    type:'title',text:'BREVE',x:8,y:20,width:60,size:55,at:3.4,hold:1
  }]});
  assert.ok(assessComposition(spec).some(i=>i.code==='gap'));
});
