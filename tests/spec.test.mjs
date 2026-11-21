import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSpec,sampleSpec} from '../src/shared/spec.js';
test('la escena de ejemplo es válida',()=>{
 const s=normalizeSpec(sampleSpec);assert.equal(s.duration,6);assert.equal(s.elements.length,4);
});
test('normaliza límites procedentes del LLM',()=>{
 const s=normalizeSpec({duration:60,elements:[{type:'title',text:'Hola',x:-5,y:200}]});
 assert.equal(s.duration,12);assert.equal(s.elements[0].x,0);assert.equal(s.elements[0].y,90);
});
test('rechaza escenas vacías',()=>assert.throws(()=>normalizeSpec({elements:[]}),/escena/));
