import test from 'node:test';
import assert from 'node:assert/strict';
import {readConfig} from '../server/config.mjs';
test('LM Studio sin clave por defecto',()=>{const c=readConfig({});assert.equal(c.provider,'lmstudio');});
test('API remota requiere API key',()=>assert.throws(()=>readConfig({AI_PROVIDER:'compatible'}),/AI_API_KEY/));
test('API remota con credenciales válidas',()=>{
 const c=readConfig({AI_PROVIDER:'compatible',AI_BASE_URL:'https://api.example.com/v1',AI_API_KEY:'test'});
 assert.equal(c.apiKey,'test');assert.equal(c.baseUrl,'https://api.example.com/v1');
});
