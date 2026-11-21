// Pure, conservative text sizing for absolute-positioned Remotion overlays.
// The same calculation runs in preview and export, and never requires DOM metrics.
// We fit the longest unbreakable word inside its declared width while allowing
// normal wrapping only BETWEEN words or at explicit newline characters.
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
export function fitTextSize({text,size,width,canvasWidth,minimum=18}) {
  const requested=Number.isFinite(Number(size))?Math.max(1,Number(size)):52;
  const words=String(text??'').trim().split(/\s+/u).filter(Boolean);
  if(!words.length)return requested;
  const widest=Math.max(...words.map(estimateWordEm));
  const availablePx=Math.max(40,canvasWidth*Math.max(0,Number(width)||0)/100*0.88);
  const maxSize=availablePx/Math.max(1,widest);
  // A very long word may need to go below the nominal 18px minimum.
  return Math.round(Math.min(requested,Math.max(Math.min(minimum,maxSize),maxSize))*10)/10;
}
