import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {estimateWordEm,fitTextSize} from '../src/shared/text-layout.js';
import {normalizeSpec} from '../src/shared/spec.js';
import {coverageGaps} from '../src/shared/motion.js';

test('never exceed the box width with the longest unbreakable word',()=>{
  for(const text of ['EN\\nEQUILIBRIO','ENFERMEDAD','NO\\nENCUENTRA','UN CUERPO']){
    const label=text.replace(/\\n/g,'\n');
    const size=fitTextSize({text:label,size:90,width:33,canvasWidth:1920});
    const longest=Math.max(...label.split(/\s+/).map(estimateWordEm));
    assert.ok(size*longest <= 1920*0.33*0.93,'Text overflow: '+text);
    assert.ok(size>60,'Text too small: '+text+' '+size);
  }
});

test('comfortable boxes preserve big titles without unnecessary shrinking',()=>{
  assert.equal(fitTextSize({text:'UN',size:100,width:33,canvasWidth:1920}),100);
  assert.ok(fitTextSize({text:'ENFERMEDAD',size:90,width:24,canvasWidth:1920}) <
    fitTextSize({text:'ENFERMEDAD',size:90,width:33,canvasWidth:1920}));
});

test('the centered-person example stays clear of screen edges and keeps its text',async()=>{
  const fixture=JSON.parse(await readFile(new URL('../examples/person-centered-typography.json',import.meta.url),'utf8'));
  const spec=normalizeSpec(fixture);
  assert.equal(spec.duration,9);
  assert.equal(spec.scenes.length,1);
  assert.equal(spec.scenes[0].groups.length,4);
  const labels=spec.scenes[0].groups.map(g=>g.elements[0]);
  assert.deepEqual(labels.map(e=>e.text),['UN\nCUERPO','EN\nEQUILIBRIO','NO\nENCUENTRA','ENFERMEDAD']);
  assert.ok(labels.every(e=>e.color==='white'&&e.x>=9&&e.x+e.width<=92));
  assert.ok(labels.filter(e=>e.x===10).every(e=>e.x+e.width<=43));
  assert.ok(labels.filter(e=>e.x===59).every(e=>e.x>=59));
  assert.deepEqual(coverageGaps(spec),[]);
});
