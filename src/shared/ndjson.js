// Shared browser stream parser for long-running generation and render jobs.
export async function readNdjsonResponse(response,onEvent){
  if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw new Error(data.error||'Error HTTP '+response.status);
  }
  if(!response.body)throw new Error('El navegador no permite recibir progreso en directo.');
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let buffer='';
  const accept=line=>{
    if(!line.trim())return;
    const event=JSON.parse(line);
    if(event.type==='error')throw new Error(event.message||'El servidor interrumpió el trabajo.');
    onEvent(event);
  };
  try{
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');
      buffer=lines.pop()||'';
      for(const line of lines)accept(line);
    }
    buffer+=decoder.decode();
    if(buffer.trim())accept(buffer);
  }finally{reader.releaseLock();}
}
