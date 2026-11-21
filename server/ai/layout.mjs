// Conservative deterministic layout pass for LLM-generated cinematic shots.
// It never changes user-authored/imported JSON. Text and factual claims remain untouched.
const ILLUSTRATIONS=new Set(['icon','orbit','pulse','ring']);
const DECORATIVE=new Set(['divider','beam']);
const TITLES=new Set(['title','kinetic']);

function textSize(e,format){
  const length=String(e.text||'').length;
  if(TITLES.has(e.type))return Math.min(format==='portrait'?100:108,Math.max(72,
    length>30?74:length>22?86:101));
  if(e.type==='subtitle')return format==='portrait'?43:46;
  if(e.type==='tag')return 35;
  if(e.type==='callout'||e.type==='quote')return format==='portrait'?38:41;
  if(e.type==='pill')return 31;
  if(e.type==='ticker')return 26;
  if(ILLUSTRATIONS.has(e.type))return format==='portrait'?70:84;
  if(DECORATIVE.has(e.type))return 22;
  return Math.max(34,Math.min(60,Number(e.size)||40));
}

function position(format,group,index,type){
  if(format==='portrait'){
    const slots=[
      [[8,9,84],[8,19,84],[8,37,76]],
      [[8,43,84],[64,53,28],[8,57,84]],
      [[8,69,80],[8,79,77],[8,76,75]],
      [[8,83,82],[8,91,82],[8,87,78]]
    ];
    const slot=(slots[group]||slots[3])[Math.min(index,2)];
    return {x:slot[0],y:slot[1],width:slot[2]};
  }
  const slots=[
    [[8,10,55],[8,24,57],[8,48,47]],
    [[64,18,28],[67,33,25],[64,55,27]],
    [[8,61,45],[8,77,44],[8,83,42]],
    [[59,63,33],[59,79,33],[59,86,32]]
  ];
  const slot=(slots[group]||slots[3])[Math.min(index,2)];
  // Keep SVG illustrations in the second/right column, but within the frame.
  if(format==='landscape'&&group===1&&ILLUSTRATIONS.has(type))return {x:67,y:32,width:25};
  return {x:slot[0],y:slot[1],width:slot[2]};
}

export function arrangeCinematicShot(shot,format){
  if(!Array.isArray(shot?.groups))return shot;
  return {...shot,groups:shot.groups.map((group,g)=>({
    ...group,elements:(group.elements||[]).map((element,i)=>({
      ...element,...position(format,g,i,element.type),size:textSize(element,format)
    }))
  }))};
}
