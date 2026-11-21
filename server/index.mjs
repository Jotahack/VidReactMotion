import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readConfig} from './config.mjs';
import {createOpenAiCompatibleProvider} from './ai/provider.mjs';
import {createRenderService} from './render/render-service.mjs';
import {createApiRouter} from './routes/api.mjs';

const config=readConfig();
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outputDir=path.join(root,'outputs');
await mkdir(outputDir,{recursive:true});
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'256kb'}));
app.use('/api/files',express.static(outputDir,{index:false}));
app.use('/api',createApiRouter({
  config,ai:createOpenAiCompatibleProvider(config),renderer:createRenderService({root,outputDir})
}));
app.listen(config.port,'127.0.0.1',()=>console.log('VidReactMotion en http://127.0.0.1:'+config.port+' · '+config.provider));
