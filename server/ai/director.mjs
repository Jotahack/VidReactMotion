import {rankDesigns,composeFromCatalog} from '../../src/shared/design-catalog.js';
import {normalizeSpec} from '../../src/shared/spec.js';
import {assessComposition} from '../../src/shared/quality.js';

const SEVERITY={overlap:80,'person-zone':110,'safe-area':60,'small-text':95,gap:55,'long-card':70};
function cost(warnings){
  return warnings.reduce((s,w)=>s+(SEVERITY[w.code]||35),0);
}
// The model proposes a design, but deterministic verification can overrule a
// poorly fitting suggestion. Never rewrite or silently truncate the copy.
export function chooseReviewedComposition({intent,content,prompt='',format='landscape',
  duration=7,designTemplate='auto'}) {
  const preference=designTemplate!=='auto'?designTemplate:content?.templateId||'auto';
  const ranks=rankDesigns({intent,content,prompt,format,duration,preferred:preference});
  if(!ranks.length)throw new Error('No existe un diseño adecuado para este contenido.');
  const assessed=ranks.slice(0,4).map(candidate=>{
    const composed=composeFromCatalog({intent,content,prompt,format,duration,designId:candidate.id});
    const scene=normalizeSpec(composed.spec,{format,duration});
    const warnings=assessComposition(scene,{
      reserveCenter:intent.placement==='around-person'
    });
    const rating=candidate.score-cost(warnings);
    return {id:candidate.id,name:candidate.name,scene,warnings,rating,score:candidate.score};
  });
  assessed.sort((a,b)=>b.rating-a.rating);
  const picked=assessed[0];
  const selection={id:picked.id,name:picked.name,reason:content?.designReason||'Composición validada por reglas',
    qualityScore:Math.max(0,Math.min(100,Math.round(picked.rating))),
    warnings:picked.warnings,
    alternatives:assessed.slice(1,3).map(x=>({
      id:x.id,name:x.name,qualityScore:Math.max(0,Math.min(100,Math.round(x.rating))),
      warnings:x.warnings
    }))};
  return {scene:picked.scene,selection,content};
}
