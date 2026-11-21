import test from 'node:test';
import assert from 'node:assert/strict';
import {creativeBriefSchema,validateCreativeBrief,buildCreativeBriefPrompt,buildSystemPrompt} from '../server/ai/prompt.mjs';

test('el briefing requiere dirección creativa completa y sin campos arbitrarios',()=>{
 assert.equal(creativeBriefSchema.additionalProperties,false);
 assert.equal(creativeBriefSchema.required.length,6);
 assert.throws(()=>validateCreativeBrief({headline:'Hola'}),/briefing creativo válido/);
 const full=Object.fromEntries(creativeBriefSchema.required.map(field=>[field,'texto']));
 assert.deepEqual(validateCreativeBrief(full),full);
});

test('se respetan formato, transparencia y límites visuales del motor',()=>{
 const prompt=buildCreativeBriefPrompt({format:'portrait',duration:8});
 assert.match(prompt,/9:16/);
 assert.match(prompt,/8 segundos/);
 assert.match(prompt,/No hay fondo opaco/);
 assert.match(prompt,/NO inventes|no añadas una cifra/);
 const scene=buildSystemPrompt({format:'landscape',duration:6});
 assert.match(scene,/16:9/);
 assert.match(scene,/SIN fondo/);
 assert.match(scene,/type, text, value/);
});
