import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSpec,analyzeSpec,sampleSpec,sceneJsonSchema} from '../src/shared/spec.js';
import {coverageGaps} from '../src/shared/motion.js';

test('el storyboard de muestra cubre los 12 segundos con 3 escenas',()=>{
  const s=normalizeSpec(sampleSpec);
  assert.equal(s.duration,12);
  assert.equal(s.scenes.length,3);
  assert.equal(s.scenes[0].at,0);
  assert.equal(s.scenes[2].at+s.scenes[2].hold,12);
  assert.deepEqual(coverageGaps(s),[]);
});

test('migración compatible con JSON anterior y reparación de cola vacía',()=>{
  const previous={
    duration:12,format:'landscape',elements:[
      {type:'tag',text:'MODO DEMO',x:8,y:10,at:0,hold:1.5},
      {type:'title',text:'EL FUTURO ESTÁ EN MOVIMIENTO',x:20,y:25,at:1.5,hold:3},
      {type:'icon',text:'',icon:'globe',x:85,y:20,at:2.5,hold:3},
      {type:'subtitle',text:'MOTION GRAPHICS',x:20,y:45,at:3.5,hold:2},
      {type:'divider',text:'',x:10,y:60,at:5.5,hold:1},
      {type:'ring',text:'PRUEBA TÉCNICA',value:72,x:45,y:70,at:6.5,hold:2}
    ]
  };
  const result=normalizeSpec(previous);
  const elements=result.scenes[0].groups[0].elements;
  assert.equal(result.scenes.length,1);
  assert.equal(elements.at(-1).at+elements.at(-1).hold,12);
  assert.deepEqual(coverageGaps(result),[]);
  assert.equal(elements.at(-1).value,72);
});

test('el normalizador respeta formato y limita valores peligrosos',()=>{
  const s=normalizeSpec({duration:200,elements:[
    {type:'title',text:'Hola',x:-5,y:200,width:1000,size:800,at:-2,hold:200}
  ]},{format:'portrait'});
  assert.equal(s.duration,60);
  assert.equal(s.format,'portrait');
  const e=s.scenes[0].groups[0].elements[0];
  assert.equal(e.x,0);assert.equal(e.y,90);assert.equal(e.width,100);assert.equal(e.size,104);
});

test('grupos con keyframes manuales se normalizan sin ejecución dinámica',()=>{
  const scene=normalizeSpec({duration:6,scenes:[{
    at:0,hold:6,transition:'fade',preset:'hero',groups:[{
      motion:'spring',at:0,hold:6,keyframes:[
        {at:1,x:15,y:10,scale:1.2,rotate:5,opacity:1,blur:0},
        {at:0,x:-50,y:0,scale:0.5,rotate:0,opacity:0,blur:10}
      ],
      elements:[{type:'title',text:'TEST',at:0,hold:5.7}]
    }]
  }]});
  const k=scene.scenes[0].groups[0].keyframes;
  assert.equal(k[0].at,0);assert.equal(k[1].at,1);
  assert.equal(k[0].opacity,0);
  assert.deepEqual(analyzeSpec(scene),[]);
});

test('se rechazan documentos vacíos y el esquema exige escenas agrupadas',()=>{
  assert.throws(()=>normalizeSpec({elements:[]}),/escena/);
  assert.deepEqual(sceneJsonSchema.required,['scenes']);
  assert.ok(sceneJsonSchema.properties.scenes.items.properties.groups);
});
