// Pure safe fallback plus optional browser-side measurement of the exact
// installed font. Never split an unbreakable word to solve a layout overflow.
const cache=new Map();
function glyphWidth(ch) {
  if (/[MW@%Ñ]/u.test(ch)) return 0.98;
  if (/[IÍÎÏ1!|.,:'`]/u.test(ch)) return 0.38;
  if (/[ijlft]/u.test(ch)) return 0.43;
  if (/[ÁÉÓÚA-Z0-9]/u.test(ch)) return 0.76;
  return 0.66;
}
export function estimateWordEm(word) {
  return Array.from(String(word)).reduce((total,ch)=>total+glyphWidth(ch),0);
}
function longestWordEm(words,fontFamily,fontWeight) {
  const key=fontWeight+'|'+fontFamily+'|'+words.join(' ');
  if(cache.has(key))return cache.get(key);
  let estimate=Math.max(...words.map(estimateWordEm));
  if(typeof document!=='undefined'&&typeof document.createElement==='function'){
    try {
      const canvas=document.createElement('canvas');
      const ctx=canvas.getContext('2d');
      if(ctx){
        ctx.font=fontWeight+' 100px '+fontFamily;
        const measured=Math.max(...words.map(word=>ctx.measureText(word).width/100));
        if(Number.isFinite(measured)&&measured>0)estimate=measured;
      }
    }catch { /* Browser without canvas: use conservative fallback. */ }
  }
  if(cache.size>=256)cache.clear();
  cache.set(key,estimate);
  return estimate;
}
export function fitTextSize({text,size,width,canvasWidth,
  fontFamily='Inter,Arial,sans-serif',fontWeight=900}) {
  const requested=Number.isFinite(Number(size))?Math.max(1,Number(size)):52;
  const words=String(text??'').trim().split(/\s+/u).filter(Boolean);
  if(!words.length)return requested;
  const longest=longestWordEm(words,fontFamily,fontWeight);
  // 8% reserved for text shadow, letter spacing and Chromium font metrics.
  const availablePx=Math.max(24,canvasWidth*Math.max(0,Number(width)||0)/100*0.92);
  const maxSize=availablePx/Math.max(0.1,longest);
  return Math.round(Math.min(requested,maxSize)*10)/10;
}
