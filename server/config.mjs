export function readConfig(env=process.env) {
  const provider=env.AI_PROVIDER||'lmstudio';
  if (!['lmstudio','compatible'].includes(provider)) throw new Error('AI_PROVIDER debe ser lmstudio o compatible.');
  const baseUrl=(env.AI_BASE_URL||'http://127.0.0.1:1234/v1').replace(/\/+$/,'');
  let url;
  try {url=new URL(baseUrl);} catch {throw new Error('AI_BASE_URL no válida.');}
  if (!['http:','https:'].includes(url.protocol)||url.username||url.password) throw new Error('AI_BASE_URL debe ser HTTP(S) sin credenciales.');
  if (provider==='compatible'&&!env.AI_API_KEY?.trim()) throw new Error('AI_API_KEY es obligatoria para API compatible.');
  const port=Number(env.API_PORT||3131);
  if (!Number.isInteger(port)||port<1024||port>65535) throw new Error('API_PORT inválido.');
  return Object.freeze({provider,baseUrl,apiKey:env.AI_API_KEY||'',model:(env.AI_MODEL||'').trim(),port});
}
