import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangeCinematicShot} from '../server/ai/layout.mjs';

const makeShot=()=>({groups:Array.from({length:4},(_,group)=>({
  motion:'spring',at:0,hold:7,
  elements:[
    {type:group===0?'tag':'subtitle',text:'ETIQUETA '+group,x:0,y:0,width:90,size:18},
    {type:group===0?'title':group===1?'orbit':'callout',
      text:'EL FUTURO ESTÁ EN MOVIMIENTO',x:0,y:0,width:90,size:18}
  ]
}))});

test('layout horizontal aplica jerarquía y zonas separadas sin cambiar textos',()=>{
  const input=makeShot();
  const output=arrangeCinematicShot(input,'landscape');
  assert.equal(output.groups.length,4);
  assert.equal(output.groups[0].elements[1].text,input.groups[0].elements[1].text);
  assert.equal(output.groups[0].elements[1].size>=72,true);
  assert.equal(output.groups[0].elements[1].x,8);
  assert.equal(output.groups[0].elements[1].y,24);
  assert.equal(output.groups[1].elements[1].x,67);
  assert.equal(output.groups[2].elements[0].y,61);
  assert.equal(output.groups[3].elements[0].x,59);
  assert.equal(input.groups[0].elements[1].x,0);
});

test('layout vertical emplea el ancho de pantalla y preserva datos',()=>{
  const input=makeShot();
  const output=arrangeCinematicShot(input,'portrait');
  assert.equal(output.groups[0].elements[1].width,84);
  assert.equal(output.groups[0].elements[1].y,19);
  assert.equal(output.groups[1].elements[1].x,64);
  assert.equal(output.groups[3].elements[0].y,83);
  assert.equal(output.groups[0].elements[1].text,input.groups[0].elements[1].text);
});
