import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {TimelineStage} from './remotion/TimelineStage.jsx';
import {sampleSpec,normalizeSpec,analyzeSpec} from './shared/spec.js';
import {coverageGaps} from './shared/motion.js';
import './styles/tailwind.css';
import './style.css';

function App() {
 const [spec,setSpec]=useState(sampleSpec);
 const [format,setFormat]=useState('landscape');
 const [duration,setDuration]=useState(sampleSpec.duration);
 const [prompt,setPrompt]=useState('Crea un titular de última hora sobre la economía mundial. Etiqueta roja y contador animado hasta 72%. Sin fondo.');
 const [brief,setBrief]=useState(null);
 const [models,setModels]=useState([]);
 const [model,setModel]=useState('');
 const [provider,setProvider]=useState('LM Studio');
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('La escena de prueba funciona sin conectar una IA.');
 const [file,setFile]=useState('');
 const [jsonDraft,setJsonDraft]=useState(JSON.stringify(sampleSpec,null,2));
 const [codec,setCodec]=useState('mov');
 const dimensions=useMemo(()=>spec.format==='portrait'?{width:1080,height:1920}:{width:1920,height:1080},[spec.format]);
 const warnings=useMemo(()=>analyzeSpec(spec),[spec]);
 const gaps=useMemo(()=>coverageGaps(spec),[spec]);
 useEffect(()=>{refreshModels();},[]);
 async function request(url,init) {
   const response=await fetch(url,init);
   const data=await response.json();
   if(!response.ok)throw new Error(data.error||'Error HTTP '+response.status);
   return data;
 }
 async function refreshModels() {
   try {
     const data=await request('/api/models');
     setModels(data.models);
     setProvider(data.provider==='compatible'?'API compatible':'LM Studio');
     setModel(previous=>data.models.includes(previous)?previous:(data.models[0]||''));
     setMessage(data.models.length?'Proveedor conectado: selecciona un modelo.':'Sin modelos. Comprueba AI_MODEL o el servidor de LM Studio.');
   } catch(error){setMessage('Proveedor no disponible: '+error.message);}
 }
 function applySpec(next) {
   const updated=normalizeSpec(next);
   setSpec(updated);setFormat(updated.format);setDuration(updated.duration);
   setJsonDraft(JSON.stringify(updated,null,2));setFile('');
 }
 async function generate() {
   if(!model){setMessage('Selecciona un modelo de IA.');return;}
   setBusy('generate');setFile('');setBrief(null);setMessage('Refinando la idea y generando una escena validada…');
   try {
     const data=await request('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({prompt,model,format,duration})});
     applySpec(data.spec);setBrief(data.brief||null);setMessage('Escena creada. Consulta el briefing creativo y revisa la vista previa.');
   } catch(error){setMessage('Error de generación: '+error.message);}
   finally{setBusy('');}
 }
 function applyJson() {
   try {
     const next=normalizeSpec(JSON.parse(jsonDraft));
     applySpec(next);setFormat(next.format);setDuration(next.duration);setMessage('JSON actualizado.');
   } catch(error){setMessage('JSON no válido: '+error.message);}
 }
 async function render() {
   setBusy('render');setFile('');setMessage('Exportando con canal alfa…');
   try {
     const data=await request('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({spec,codec})});
     setFile(data.url);setMessage('Vídeo generado: '+data.filename);
   } catch(error){setMessage('Error de render: '+error.message);}
   finally{setBusy('');}
 }
 const ratio=spec.format==='portrait'?'9 / 16':'16 / 9';
 return <main className="shell min-h-screen">
   <header><div><div className="eyebrow">REACT · REMOTION · IA LOCAL O API</div>
     <h1>VidReactMotion <span>α</span></h1>
     <p>Animaciones transparentes desde prompts, renderizadas en tu ordenador.</p>
   </div><div className="local">● Render local</div></header>
   <div className="layout">
     <section className="panel controls shadow-2xl">
       <label htmlFor="prompt">Describe tu animación</label>
       <textarea id="prompt" rows="5" value={prompt} onChange={e=>setPrompt(e.target.value)}/>
       <div className="smallgrid">
         <div><label>Formato</label><select value={format} onChange={e=>setFormat(e.target.value)}>
           <option value="landscape">Horizontal 1920×1080</option><option value="portrait">Vertical 1080×1920</option>
         </select></div>
         <div><label>Duración</label><select value={duration} onChange={e=>setDuration(Number(e.target.value))}>
           {[3,4,5,6,8,10,12,15,20,30,45,60].map(n=><option key={n} value={n}>{n} segundos</option>)}
         </select></div>
       </div>
       <div className="model"><label>Modelo · {provider}</label><div className="inline">
         <select value={model} onChange={e=>setModel(e.target.value)}><option value="">Sin modelo</option>
           {models.map(m=><option key={m} value={m}>{m}</option>)}
         </select><button className="secondary" onClick={refreshModels} title="Actualizar">↻</button>
       </div></div>
       <button disabled={Boolean(busy)} onClick={generate}>{busy==='generate'?'Refinando y generando…':'✦ Generar con IA'}</button>
       {brief&&<details className="brief">
         <summary>Briefing creativo utilizado</summary>
         <p><strong>Titular:</strong> {brief.headline}</p>
         {brief.supportingCopy&&<p><strong>Texto secundario:</strong> {brief.supportingCopy}</p>}
         <p><strong>Dirección visual:</strong> {brief.visualDirection}</p>
         <p><strong>Composición:</strong> {brief.layout}</p>
         <p><strong>Animación:</strong> {brief.animationPlan}</p>
         <p><strong>Recursos:</strong> {brief.assets}</p>
       </details>}
       <div className="separator"/>
       <label>Exportación</label><select value={codec} onChange={e=>setCodec(e.target.value)}>
         <option value="mov">MOV · ProRes 4444 con alfa</option><option value="webm">WebM · VP8 con alfa</option>
       </select>
       <button className="export" disabled={Boolean(busy)} onClick={render}>
         {busy==='render'?'Renderizando…':'⬇ Renderizar transparente'}
       </button>
       {file&&<a className="download" href={file} download>Descargar vídeo generado</a>}
       <div className="message" role="status">{message}</div>
     </section>
     <section className="right">
       <div className="panel previewPanel ring-1 ring-white/5"><div className="previewTitle"><strong>Vista previa</strong>
         <small>{dimensions.width}×{dimensions.height} · {spec.duration}s · 30fps</small></div>
         <div className="stage" style={{maxWidth:spec.format==='portrait'?360:900}}>
           <div className="checker" style={{aspectRatio:ratio}}>
             <Player key={JSON.stringify(spec)} component={TimelineStage} inputProps={{spec}}
               durationInFrames={Math.ceil(spec.duration*30)} compositionWidth={dimensions.width}
               compositionHeight={dimensions.height} fps={30} autoPlay loop controls
               style={{width:'100%',aspectRatio:ratio}}/>
           </div>
         </div><p className="hint">El tablero indica transparencia y no se exporta.</p>
         <p className="hint">Storyboard: {spec.scenes?.length??1} escenas, {spec.scenes?.reduce((n,s)=>n+s.groups.length,0)??1} grupos sincronizados.</p>
         {(warnings.length>0||gaps.length>0)&&<div className="quality" role="status">
           <strong>Revisión de calidad</strong>
           {warnings.map((w,i)=><p key={'w'+i}>{w}</p>)}
           {gaps.map((g,i)=><p key={'g'+i}>Posible tiempo muerto: {g.start.toFixed(1)}–{g.end.toFixed(1)} s.</p>)}
         </div>}
       </div>
       <details className="panel editor"><summary>Editor avanzado · JSON</summary>
         <p>Modifica textos, tamaños, tiempos y posiciones.</p>
         <textarea spellCheck="false" rows="18" value={jsonDraft} onChange={e=>setJsonDraft(e.target.value)}/>
         <button className="secondary" onClick={applyJson}>Aplicar cambios</button>
       </details>
     </section>
   </div><footer>La IA genera datos, nunca código ejecutable. Las claves de API quedan en el servidor local.</footer>
 </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
