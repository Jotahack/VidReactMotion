import {fitText} from '@remotion/layout-utils';
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
  fontFamily='Inter,Arial,sans-serif',fontWeight=900,singleLine=false,paddingPx=0}) {
  const requested=Number.isFinite(Number(size))?Math.max(1,Number(size)):52;
  const words=String(text??'').trim().split(/\s+/u).filter(Boolean);
  if(!words.length)return requested;
  const longest=longestWordEm(singleLine?[words.join(' ')]:words,fontFamily,fontWeight);
  // 8% reserved for text shadow, letter spacing and Chromium font metrics.
  const availablePx=Math.max(24,(canvasWidth*Math.max(0,Number(width)||0)/100-paddingPx)*0.90);
  const maxSize=availablePx/Math.max(0.1,longest);
  if(typeof document!=='undefined'&&singleLine){
    try {
      const measured=fitText({text:words.join(' '),withinWidth:availablePx,
        fontFamily,fontWeight});
      if(Number.isFinite(measured.fontSize)&&measured.fontSize>0)
        return Math.round(Math.min(requested,maxSize,measured.fontSize*0.97)*10)/10;
    }catch { /* Browser font not ready: keep deterministic conservative fit. */ }
  }
  return Math.round(Math.min(requested,maxSize)*10)/10;
}


// Estimate multiline paragraph height without guessing from the longest word.
// This is a conservative layout guard; actual final layout is handled by CSS.
export function fitParagraphSize({text,widthPx,heightPx,requested=40,min=22}){
  const words=String(text??'').trim().split(/\s+/u).filter(Boolean);
  if(!words.length)return requested;
  for(let fontSize=requested;fontSize>=min;fontSize-=1){
    const capacity=Math.max(1,widthPx/(fontSize*0.60));
    let lines=1,used=0;
    for(const word of words){
      const length=estimateWordEm(word)/0.60+1;
      if(used+length>capacity&&used>0){lines++;used=0;}
      used+=length;
    }
    if(lines*fontSize*1.42<=heightPx)return fontSize;
  }
  return min;
}
