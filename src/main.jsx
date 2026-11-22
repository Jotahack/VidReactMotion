import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player} from '@remotion/player';
import {TimelineStage} from './remotion/TimelineStage.jsx';
import {sampleSpec,normalizeSpec,analyzeSpec} from './shared/spec.js';
import {createStressDemo} from './shared/stress-demo.js';
import personCenteredTypography from '../examples/person-centered-typography.json';
import biotiposInfoCard from '../examples/biotipos-info-card.json';
import {readNdjsonResponse} from './shared/ndjson.js';
import {coverageGaps} from './shared/motion.js';
import {assessComposition} from './shared/quality.js';
import './styles/tailwind.css';
import './style.css';

function App() {
 const [spec,setSpec]=useState(sampleSpec);
 const [format,setFormat]=useState('landscape');
 const [duration,setDuration]=useState(sampleSpec.duration);
 const [prompt,setPrompt]=useState('Crea un motion graphic de DEMOSTRACIÓN: titular EL FUTURO ESTÁ EN MOVIMIENTO, tipografía cinética, órbita SVG y anillo de 72% como DATO FICTICIO. Sin fondo.');
 const [brief,setBrief]=useState(null);
 const [models,setModels]=useState([]);
 const [model,setModel]=useState('');
 const [provider,setProvider]=useState('LM Studio');
 const [busy,setBusy]=useState('');
 const [message,setMessage]=useState('La escena de prueba funciona sin conectar una IA.');
 const [file,setFile]=useState('');
 const [jsonDraft,setJsonDraft]=useState(JSON.stringify(sampleSpec,null,2));
 const [codec,setCodec]=useState('mov');
 const [designMode,setDesignMode]=useState('auto');
 const [placement,setPlacement]=useState('auto');
 const [font,setFont]=useState('Montserrat');
 const generationAbort=useRef(null);
 const renderAbort=useRef(null);
 const [reference,setReference]=useState(null);
 const referenceUrlRef=useRef(null);
 useEffect(()=>()=>{if(referenceUrlRef.current)URL.revokeObjectURL(referenceUrlRef.current);},[]);
 function updateReference(file){
   if(referenceUrlRef.current)URL.revokeObjectURL(referenceUrlRef.current);
   referenceUrlRef.current=file?URL.createObjectURL(file):null;
   setReference(file?{url:referenceUrlRef.current,type:file.type.startsWith('video/')?'video':'image'}:null);
 }
 const dimensions=useMemo(()=>spec.format==='portrait'?{width:1080,height:1920}:{width:1920,height:1080},[spec.format]);
 const warnings=useMemo(()=>analyzeSpec(spec),[spec]);
 const gaps=useMemo(()=>coverageGaps(spec),[spec]);
 const quality=useMemo(()=>assessComposition(spec,{reserveCenter:placement==='around-person'}),[spec,placement]);
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
   const controller=new AbortController();generationAbort.current=controller;
   setBusy('generate');setFile('');setBrief(null);
   setMessage('Preparando dirección creativa y storyboard...');
   try{
     const response=await fetch('/api/generate/stream',{
       method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
       body:JSON.stringify({prompt,model,format,duration,mode:designMode,placement,font})
     });
     let finished=false;
     await readNdjsonResponse(response,event=>{
       if(event.type==='progress')setMessage((event.detail||event.stage)+' ('+event.completed+'/'+event.total+')');
       if(event.type==='result'){
         applySpec(event.spec);setBrief(event.brief||null);finished=true;
         const m=event.metrics;
         setMessage('Generado: '+(m?m.shots+' escenas · '+m.groups+' grupos · '+m.elements+' elementos · '+m.keyframes+' keyframes':'storyboard validado')+'.');
       }
     });
     if(!finished)throw new Error('Generación interrumpida sin resultado.');
   }catch(error){
     setMessage(controller.signal.aborted?'Generación cancelada.':'Error de generación: '+error.message);
   }finally{generationAbort.current=null;setBusy('');}
 }
 function applyJson() {
   try {
     const next=normalizeSpec(JSON.parse(jsonDraft));
     applySpec(next);setFormat(next.format);setDuration(next.duration);setMessage('JSON actualizado.');
   } catch(error){setMessage('JSON no válido: '+error.message);}
 }
 async function render() {
   const controller=new AbortController();renderAbort.current=controller;
   setBusy('render');setFile('');setMessage('Preparando exportación con canal alfa...');
   try{
     const response=await fetch('/api/render/stream',{
       method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
       body:JSON.stringify({spec,codec})
     });
     let finished=false;
     await readNdjsonResponse(response,event=>{
       if(event.type==='progress')setMessage(event.stage==='bundle'
         ?'Compilando motor Remotion...':'Exportando '+event.percent+'%');
       if(event.type==='result'){
         setFile(event.url);setMessage('Vídeo transparente generado: '+event.filename);finished=true;
       }
     });
     if(!finished)throw new Error('Exportación interrumpida sin archivo.');
   }catch(error){
     setMessage(controller.signal.aborted?'Exportación cancelada.':'Error de render: '+error.message);
   }finally{renderAbort.current=null;setBusy('');}
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
           {[1,2,3,4,5,6,8,10,12,15,20,30,45,60].map(n=><option key={n} value={n}>{n} segundos</option>)}
         </select></div>
       </div>
       <div className="smallgrid">
         <div><label htmlFor="designMode">Tipo de creación</label>
           <select id="designMode" value={designMode} onChange={e=>setDesignMode(e.target.value)}>
             <option value="auto">Automático</option>
             <option value="typography">Solo tipografía</option>
             <option value="card">Tarjeta informativa</option>
             <option value="list">Lista animada</option>
             <option value="advanced">Motion graphics avanzado</option>
           </select></div>
         <div><label htmlFor="fontChoice">Tipografía</label>
           <select id="fontChoice" value={font} onChange={e=>setFont(e.target.value)}>
             <option value="Montserrat">Montserrat</option>
             <option value="Inter">Inter</option>
             <option value="Arial">Arial</option>
           </select></div>
       </div>
       <div className="smallgrid">
         <div><label htmlFor="safeArea">Zona para el contenido</label>
           <select id="safeArea" value={placement} onChange={e=>setPlacement(e.target.value)}>
             <option value="auto">Detectar del prompt</option>
             <option value="left">Izquierda</option>
             <option value="right">Derecha</option>
             <option value="center">Centro</option>
             <option value="around-person">Alrededor de una persona</option>
           </select></div>
       </div>
       <div className="model"><label>Modelo · {provider}</label><div className="inline">
         <select value={model} onChange={e=>setModel(e.target.value)}><option value="">Sin modelo</option>
           {models.map(m=><option key={m} value={m}>{m}</option>)}
         </select><button className="secondary" onClick={refreshModels} title="Actualizar">↻</button>
       </div></div>
       <button disabled={Boolean(busy)} onClick={generate}>{busy==='generate'?'Refinando y generando…':'✦ Generar con IA'}</button>
       {busy==='generate'&&<button className="secondary mt-2" onClick={()=>generationAbort.current?.abort()}>Cancelar generación</button>}
       <button className="secondary mt-3" disabled={Boolean(busy)} onClick={()=>{
         applySpec(sampleSpec);setBrief(null);setMessage('Demo V2 cargada sin utilizar IA: compara este resultado con el generado por GPT-OSS.');
       }}>Ver demo del motor V2 (sin IA)</button>
       <button className="secondary mt-3" disabled={Boolean(busy)} onClick={()=>{
         applySpec(personCenteredTypography);setBrief(null);
         setMessage('Plantilla de texto para persona centrada cargada: 9 segundos, dos columnas y palabras completas.');
       }}>Cargar plantilla · Texto a ambos lados de la persona</button>
       <button className="secondary mt-3" disabled={Boolean(busy)} onClick={()=>{
         applySpec(biotiposInfoCard);setDesignMode('card');setPlacement('right');setFont('Montserrat');
         setMessage('Tarjeta BIOTIPOS cargada: Montserrat, una escena, composición a la derecha.');
       }}>Cargar plantilla · Tarjeta BIOTIPOS con Montserrat</button>
       <button className="secondary mt-3" disabled={Boolean(busy)} onClick={()=>{
         applySpec(createStressDemo(format));setBrief(null);setMessage('Prueba extrema 60 s ('+(format==='portrait'?'9:16':'16:9')+') cargada: 8 escenas, 32 grupos y 65 elementos, sin IA.');
       }}>Cargar prueba extrema · 60 segundos · formato elegido</button>
       <label className="mt-4" htmlFor="jsonImport">Abrir un JSON guardado en el ordenador</label>
       <input id="jsonImport" type="file" accept=".json,application/json" disabled={Boolean(busy)} onChange={async event=>{
         const file=event.target.files?.[0];if(!file)return;
         try{applySpec(JSON.parse(await file.text()));setMessage('Proyecto JSON importado: '+file.name);}
         catch(error){setMessage('Error al importar JSON: '+error.message);}
         event.target.value='';
       }}/>
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
       {busy==='render'&&<button className="secondary mt-2" onClick={()=>renderAbort.current?.abort()}>Cancelar exportación</button>}
       {file&&<a className="download" href={file} download>Descargar vídeo generado</a>}
       <div className="message" role="status">{message}</div>
     </section>
     <section className="right">
       <div className="panel previewPanel ring-1 ring-white/5"><div className="previewTitle"><strong>Vista previa</strong>
         <small>{dimensions.width}×{dimensions.height} · {spec.duration}s · 30fps</small></div>
         <div className="referenceControls">
           <label htmlFor="referenceFootage">Referencia local: imagen o vídeo de la persona (no se exporta)</label>
           <input id="referenceFootage" type="file" accept="image/*,video/*"
             onChange={event=>{
               updateReference(event.target.files?.[0]||null);
               event.target.value='';
             }}/>
           {reference&&<button className="secondary" onClick={()=>updateReference(null)}>Quitar referencia</button>}
         </div>
         <div className="stage" style={{maxWidth:spec.format==='portrait'?360:900}}>
           <div className="checker" style={{aspectRatio:ratio,position:'relative'}}>
             {reference&&(reference.type==='video'?
               <video src={reference.url} muted autoPlay loop playsInline
                 style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>:
               <img src={reference.url} alt="Fotograma de referencia"
                 style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/>)}
             <Player key={JSON.stringify(spec)} component={TimelineStage} inputProps={{spec}}
               durationInFrames={Math.ceil(spec.duration*30)} compositionWidth={dimensions.width}
               compositionHeight={dimensions.height} fps={30} autoPlay loop controls
               style={{width:'100%',aspectRatio:ratio,position:'relative',zIndex:1}}/>
           </div>
         </div><p className="hint">El vídeo o imagen de referencia solo aparece en la vista previa: la exportación conserva la transparencia.</p>
         <p className="hint">Storyboard: {spec.scenes?.length??1} escenas, {spec.scenes?.reduce((n,s)=>n+s.groups.length,0)??1} grupos sincronizados.</p>
         <p className="hint">Auditoría de composición: {quality.length?quality.length+' posibles problemas':'sin alertas geométricas detectadas'}.</p>
         {quality.length>0&&<div className="quality" role="status"><strong>Mejoras de legibilidad recomendadas</strong>
           {quality.map((issue,i)=><p key={i}>{issue.message}</p>)}</div>}
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
