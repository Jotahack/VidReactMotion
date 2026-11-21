import test from 'node:test';
import assert from 'node:assert/strict';
import {interpolateKeyframes,keyframesToStyle,presetTransform,coverageGaps} from '../src/shared/motion.js';

test('keyframes son continuos y reproducibles',()=>{
 const frames=[
  {at:0,x:-100,y:0,scale:0.7,opacity:0,rotate:0,blur:12},
  {at:2,x:0,y:0,scale:1,opacity:1,rotate:0,blur:0}
 ];
 const mid=interpolateKeyframes(frames,1);
 assert.equal(mid.x,-50);assert.equal(mid.opacity,0.5);
 assert.deepEqual(interpolateKeyframes(frames,1),mid);
 const css=keyframesToStyle(frames,1);
 assert.match(css.transform,/translate/);
 assert.equal(css.opacity,0.5);
});

test('todos los movimientos permitidos devuelven estilos, sin temporizadores',()=>{
 for(const effect of ['up','left','pop','fade','right','down','zoom','rotate','blur','wipe','spring']){
  assert.equal(typeof presetTransform(effect,0.5),'object');
 }
 assert.match(presetTransform('wipe',0).clipPath,/100/);
 assert.match(presetTransform('wipe',1).clipPath,/0/);
});

test('el analizador identifica huecos reales en el timeline',()=>{
 const gaps=coverageGaps({duration:12,scenes:[{at:0,groups:[{
  at:0,elements:[{at:0,hold:3},{at:5,hold:2}]
 }]}]});
 assert.deepEqual(gaps,[{start:3,end:5},{start:7,end:12}]);
});
