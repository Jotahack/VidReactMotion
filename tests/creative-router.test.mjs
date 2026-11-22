import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveDesignIntent,buildSimpleStoryboard,buildSimpleContentPrompt} from '../server/ai/creative-router.mjs';
import {normalizeSpec} from '../src/shared/spec.js';
import {fitTextSize,fitParagraphSize} from '../src/shared/text-layout.js';
import {readFile} from 'node:fs/promises';

test('prompt de biotipos -> tarjeta, Montserrat y zona derecha sin cuatro grupos innecesarios',()=>{
  const prompt='Crea una explicación breve de los biotipos en contenedor vertical a la derecha con Montserrat.';
  const intent=resolveDesignIntent({prompt});
  assert.deepEqual(intent,{mode:'card',placement:'right',font:'Montserrat'});
  const spec=normalizeSpec(buildSimpleStoryboard({intent,format:'landscape',duration:7,
    content:{headline:'BIOTIPOS',description:'Clasificación según características físicas y biológicas.',items:[]}}));
  assert.equal(spec.scenes.length,1);
  assert.equal(spec.scenes[0].groups.length,1);
  const element=spec.scenes[0].groups[0].elements[0];
  assert.equal(element.type,'infoCard');
  assert.equal(element.font,'Montserrat');
  assert.equal(element.heading,'BIOTIPOS');
  assert.equal(element.x,55);
  assert.equal(element.exit,'none');
  assert.equal(spec.scenes[0].groups[0].motion,'none');
  assert.equal(spec.scenes[0].groups[0].exit,'none');
  assert.match(buildSimpleContentPrompt(intent,'landscape',7),/máximo 165/);
});

test('una frase en dos columnas puede durar exactamente 2 segundos',()=>{
  const intent=resolveDesignIntent({mode:'typography',placement:'around-person',font:'Montserrat'});
  const spec=normalizeSpec(buildSimpleStoryboard({intent,duration:2,format:'landscape',
    content:{items:['UN CUERPO','EN EQUILIBRIO','NO ENCUENTRA','ENFERMEDAD']}}));
  assert.equal(spec.duration,2);
  assert.equal(spec.scenes[0].groups.length,4);
  const items=spec.scenes[0].groups.map(g=>g.elements[0]);
  assert.deepEqual(items.map(e=>e.x),[9,59,9,59]);
  assert.ok(items.every(e=>e.lineMode==='single'&&e.font==='Montserrat'));
  assert.equal(items.at(-1).text,'ENFERMEDAD');
  assert.equal(spec.scenes[0].groups.at(-1).at+spec.scenes[0].groups.at(-1).hold,2);
});

test('modo lista solo devuelve los conceptos solicitados, sin título inventado',()=>{
  const intent=resolveDesignIntent({prompt:'Lista de bilis amarilla, bilis negra, flema y sangre'});
  assert.equal(intent.mode,'list');
  const spec=normalizeSpec(buildSimpleStoryboard({intent,duration:8,
    content:{items:['Bilis amarilla','Bilis negra','Flema','Sangre'],headline:'',description:''}}));
  assert.equal(spec.scenes[0].groups.length,4);
  assert.deepEqual(spec.scenes[0].groups.map(g=>g.elements[0].text),
    ['Bilis amarilla','Bilis negra','Flema','Sangre']);
});

test('el autoajuste de frases en una sola línea respeta el ancho disponible',()=>{
  const opts={text:'EN EQUILIBRIO',size:92,width:34,canvasWidth:1920,fontFamily:'Arial,sans-serif'};
  const wrap=fitTextSize(opts);
  const single=fitTextSize({...opts,singleLine:true});
  assert.ok(single<=wrap);
  assert.ok(single>10);
  assert.ok(fitParagraphSize({text:'Un biotipo se define como un conjunto de características comunes.',
    widthPx:600,heightPx:240,requested:40})>=22);
});

test('ejemplo de tarjeta Montserrat mantiene alfa y caja segura',async()=>{
  const raw=JSON.parse(await readFile(new URL('../examples/biotipos-info-card.json',import.meta.url),'utf8'));
  const spec=normalizeSpec(raw);
  const e=spec.scenes[0].groups[0].elements[0];
  assert.equal(e.heading,'BIOTIPOS');
  assert.equal(e.type,'infoCard');
  assert.equal(e.font,'Montserrat');
  assert.ok(e.x>=8&&e.x+e.width<=94);
  assert.ok(e.y+e.height<=90);
});


test('los párrafos de información conservan todas las palabras, incluso después del carácter 120',async()=>{
  const raw=JSON.parse(await readFile(new URL('../examples/biotipos-info-card.json',import.meta.url),'utf8'));
  const original=raw.scenes[0].groups[0].elements[0].text;
  assert.ok(original.length>120,'El fixture debe superar el antiguo límite');
  const spec=normalizeSpec(raw);
  assert.equal(spec.scenes[0].groups[0].elements[0].text,original);
  assert.ok(spec.scenes[0].groups[0].elements[0].text.endsWith('clasificación.'));
});
