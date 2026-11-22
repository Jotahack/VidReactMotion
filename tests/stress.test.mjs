import test from 'node:test';
import assert from 'node:assert/strict';
import {createStressDemo} from '../src/shared/stress-demo.js';
import {normalizeSpec,sceneJsonSchema} from '../src/shared/spec.js';
import {coverageGaps} from '../src/shared/motion.js';

test('referencia 60s: 8 escenas, 32 grupos, 65 elementos y 96 keyframes',()=>{
  const fixture=createStressDemo();
  assert.equal(fixture.format,'landscape');
  assert.equal(fixture.duration,60);
  assert.equal(fixture.scenes.length,8);
  assert.equal(fixture.scenes.reduce((n,s)=>n+s.groups.length,0),32);
  assert.equal(fixture.scenes.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.elements.length,0),0),65);
  assert.equal(fixture.scenes.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.keyframes.length,0),0),96);
  assert.equal(sceneJsonSchema.properties.scenes.maxItems,8);
});

test('la referencia conserva duración, grupos y animaciones tras normalizar',()=>{
  const original=createStressDemo();
  const spec=normalizeSpec(original);
  assert.equal(spec.scenes.length,8);
  assert.equal(spec.scenes.at(-1).at+spec.scenes.at(-1).hold,60);
  assert.equal(spec.scenes.reduce((n,s)=>n+s.groups.length,0),32);
  assert.equal(spec.scenes.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+g.elements.length,0),0),65);
  assert.equal(spec.scenes.reduce((n,s)=>n+s.groups.reduce((m,g)=>m+(g.keyframes?.length||0),0),0),96);
  assert.deepEqual(coverageGaps(spec),[]);
  assert.deepEqual(normalizeSpec(spec),spec);
});
