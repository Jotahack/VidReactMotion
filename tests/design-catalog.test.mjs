import test from 'node:test';
import assert from 'node:assert/strict';
import {DESIGN_CATALOG,DESIGN_IDS,composeFromCatalog,rankDesigns} from '../src/shared/design-catalog.js';
import {resolveDesignIntent} from '../server/ai/creative-router.mjs';
import {chooseReviewedComposition} from '../server/ai/director.mjs';
import {normalizeSpec} from '../src/shared/spec.js';

const define={headline:'BIOTIPOS',description:
  'Un biotipo describe características físicas y biológicas compartidas. Hay diferentes clasificaciones históricas.',items:[]};
const list={headline:'',description:'',items:['Bilis amarilla','Bilis negra','Flema','Sangre']};
const words={headline:'',description:'',items:['UN CUERPO','EN EQUILIBRIO','NO ENCUENTRA','ENFERMEDAD']};

test('el catálogo tiene identificadores únicos y diseños de 5 familias',()=>{
  assert.equal(new Set(DESIGN_IDS).size,DESIGN_IDS.length);
  assert.ok(DESIGN_IDS.length>=13);
  for(const mode of ['card','list','typography','quote','comparison','timeline']){
    assert.ok(DESIGN_CATALOG.some(d=>d.mode===mode),mode);
  }
});

test('el director elige diseños compatibles sin aceptar una propuesta del modo incorrecto',()=>{
  const intent=resolveDesignIntent({prompt:'Explicación breve de los biotipos a la derecha con Montserrat'});
  const reviewed=chooseReviewedComposition({intent,content:{...define,templateId:'labels-indexed'},
    prompt:'Definición de los biotipos',duration:7});
  assert.equal(reviewed.scene.scenes.length,1);
  assert.equal(reviewed.scene.scenes[0].groups.length,1);
  assert.equal(reviewed.scene.scenes[0].groups[0].elements[0].type,'infoCard');
  assert.ok(reviewed.selection.id.startsWith('definition-'));
});

test('los diseños preservan texto, duraciones, márgenes y variantes',()=>{
  for(const d of DESIGN_CATALOG){
    for(const format of ['landscape','portrait']){
      const intent={mode:d.mode,placement:format==='landscape'?'right':'center',font:'Montserrat'};
      const content=['card','quote'].includes(d.mode)?define:d.mode==='typography'?words:list;
      const {spec,design}=composeFromCatalog({intent,content,format,duration:7,designId:d.id});
      const doc=normalizeSpec(spec);
      assert.equal(design.id,d.id);
      assert.equal(doc.duration,7);
      const elements=doc.scenes.flatMap(s=>s.groups.flatMap(g=>g.elements));
      assert.ok(elements.length>=1);
      assert.ok(elements.every(e=>e.x>=8&&e.x+e.width<=94));
      assert.ok(elements.every(e=>e.font==='Montserrat'));
      if(d.mode==='card')assert.equal(elements[0].text,define.description);
      if(d.mode==='typography')assert.ok(elements.every(e=>e.lineMode==='single'));
    }
  }
});

test('se preservan los cuatro líquidos, sin titular ni datos inventados',()=>{
  const intent={mode:'list',placement:'around-person',font:'Montserrat'};
  const {spec}=composeFromCatalog({intent,content:list,format:'landscape',duration:8,
    designId:'labels-ribbons'});
  const normalized=normalizeSpec(spec);
  const displayed=normalized.scenes[0].groups.flatMap(g=>g.elements.map(e=>e.text));
  assert.deepEqual(displayed,list.items);
});

test('frases a ambos lados duran exactamente 2 segundos y conservan centro libre',()=>{
  const intent={mode:'typography',placement:'around-person',font:'Montserrat'};
  const {spec}=composeFromCatalog({intent,content:words,format:'landscape',duration:2,
    designId:'type-sides'});
  const doc=normalizeSpec(spec);
  const g=doc.scenes[0].groups;
  assert.equal(doc.duration,2);
  assert.deepEqual(g.map(x=>x.elements[0].x),[9,59,9,59]);
  assert.ok(g.every(x=>x.exit==='none'&&x.elements[0].exit==='none'));
  assert.equal(g.at(-1).at+g.at(-1).hold,2);
});

test('el formato corto no puede perder ningún elemento de la lista de seis',()=>{
  const intent={mode:'list',placement:'right',font:'Oswald'};
  const content={items:['Uno','Dos','Tres','Cuatro','Cinco','Seis']};
  const {spec}=composeFromCatalog({intent,content,format:'portrait',duration:5,
    designId:'labels-indexed'});
  const doc=normalizeSpec(spec);
  assert.equal(doc.scenes[0].groups.flatMap(g=>g.elements).length,6);
});

test('el ranking explica al usuario la preferencia y deja alternativas',()=>{
  const intent={mode:'card',placement:'right',font:'Montserrat'};
  const ranking=rankDesigns({intent,content:define,prompt:'Documento editorial',preferred:'definition-editorial'});
  assert.equal(ranking[0].id,'definition-editorial');
  const result=chooseReviewedComposition({intent,content:define,format:'landscape',duration:7});
  assert.ok(result.selection.alternatives.length>=2);
  assert.ok(typeof result.selection.qualityScore==='number');
});

test('tarjetas breves ajustan su altura al contenido y se centran en vertical',()=>{
  const intent={mode:'card',placement:'right',font:'Montserrat'};
  for(const format of ['landscape','portrait']){
    const short=composeFromCatalog({intent,format,duration:7,
      content:{headline:'BIOTIPOS',description:'Clasificación de características físicas comunes.',items:[]},
      designId:'definition-editorial'});
    const long=composeFromCatalog({intent,format,duration:7,
      content:{headline:'BIOTIPOS',description:'Una clasificación histórica de características físicas y biológicas comunes que agrupaba a las personas en tipologías. Estas categorías no constituyen un diagnóstico médico actual.',items:[]},
      designId:'definition-editorial'});
    const a=normalizeSpec(short.spec).scenes[0].groups[0].elements[0];
    const b=normalizeSpec(long.spec).scenes[0].groups[0].elements[0];
    assert.ok(a.height<b.height,'La tarjeta de contenido breve no debe igualar la altura de una larga');
    assert.ok(a.height<=45,'La definición breve no debe ocupar casi toda la pantalla');
    assert.ok(Math.abs((a.y+a.height/2)-50)<0.2,'El panel debe quedar verticalmente centrado');
    assert.ok(a.y+a.height<88&&a.y>10);
  }
});
