import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {
  Globe2,BarChart3,TrendingUp,TriangleAlert,Flag,Zap,ShieldCheck,Users,
  Cpu,Landmark,Factory,Satellite,Rocket,Network,MapPin,Building2,Coins,Newspaper
} from 'lucide-react';
import {COLORS} from '../shared/spec.js';
import {presetTransform} from '../shared/motion.js';
import {fitTextSize,fitParagraphSize} from '../shared/text-layout.js';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '../styles/tailwind.css';
import './overlay.css';

// Static icon registry: the AI may only select pre-approved local SVG components.
const ICONS={
  globe:Globe2,chart:BarChart3,trend:TrendingUp,alert:TriangleAlert,flag:Flag,
  bolt:Zap,shield:ShieldCheck,users:Users,cpu:Cpu,landmark:Landmark,
  factory:Factory,satellite:Satellite,rocket:Rocket,network:Network,
  pin:MapPin,building:Building2,coins:Coins,news:Newspaper
};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

function ProgressRing({element:e,color,progress}) {
  const size=Math.max(110,Math.min(275,e.size*4));
  const radius=(size-20)/2;
  const circumference=2*Math.PI*radius;
  const value=Math.max(0,Math.min(100,e.value));
  const current=value*progress;
  return <div className="vrm-progress-ring flex w-fit flex-col items-center gap-2">
    <div className="relative grid place-items-center" style={{width:size,height:size}}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,.20)" strokeWidth="12" fill="none"/>
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={circumference*(1-current/100)} fill="none"/>
      </svg>
      <span className="vrm-ring-figure font-black tracking-tight" style={{fontSize:size*0.28}}>{Math.round(current)}%</span>
    </div>
    <span className="vrm-label text-center font-bold uppercase tracking-[0.15em]" style={{fontSize:Math.max(16,e.size*0.54)}}>{e.text}</span>
  </div>;
}


// Decorative orbital SVG: all movement comes from a video frame, not CSS time.
function OrbitGraphic({size,color,elapsed,fps}) {
  const d=Math.max(145,Math.min(340,size*4.2));
  const center=d/2,radius=d*0.36;
  const phase=elapsed/fps*Math.PI*0.9;
  const px=center+radius*Math.cos(phase);
  const py=center+radius*Math.sin(phase)*0.42;
  return <svg viewBox={'0 0 '+d+' '+d} width={d} height={d} role="presentation" aria-hidden="true">
    <circle cx={center} cy={center} r={radius*0.53} fill="none" stroke={color} strokeWidth="4" opacity="0.65"/>
    <ellipse cx={center} cy={center} rx={radius} ry={radius*0.42} fill="none" stroke={color} strokeWidth="4" opacity="0.75"
      transform={'rotate(-22 '+center+' '+center+')'}/>
    <ellipse cx={center} cy={center} rx={radius} ry={radius*0.42} fill="none" stroke="white" strokeWidth="2" opacity="0.32"
      transform={'rotate(52 '+center+' '+center+')'}/>
    <circle cx={center} cy={center} r={radius*0.23} fill={color} opacity="0.28"/>
    <circle cx={center} cy={center} r={radius*0.14} fill={color}/>
    <circle cx={px} cy={py} r={10} fill="white" stroke={color} strokeWidth="5"/>
  </svg>;
}
function KineticWords({text,elapsed,size}) {
  const words=text.trim().split(/\s+/).slice(0,16);
  return <div className="vrm-title flex flex-wrap gap-x-[0.24em] gap-y-[0.08em] font-black tracking-tight" style={{fontSize:size}}>
    {words.map((word,index)=>{
      const entrance=Math.max(0,Math.min(1,(elapsed-index*5)/12));
      return <span key={index} style={{
        display:'inline-block',opacity:entrance,
        transform:'translateY('+Math.round((1-entrance)*45)+'px)'
      }}>{word}</span>;
    })}
  </div>;
}

// Each word is an indivisible inline box. This is more robust than
// overflow-wrap or word-break CSS alone when imported JSON has narrow widths.
function TextWithoutBrokenWords({text}) {
  return String(text??'').split('\n').map((line,lineIndex)=>
    <React.Fragment key={lineIndex}>
      {lineIndex>0&&<br/>}
      {line.split(/(\s+)/u).filter(Boolean).map((part,index)=>
        /^\s+$/u.test(part)?<React.Fragment key={index}>{part}</React.Fragment>:
        <span key={index} className="vrm-whole-word">{part}</span>
      )}
    </React.Fragment>
  );
}

function Element({element:e}) {
  const frame=useCurrentFrame();
  const {fps,width:canvasWidth,height:canvasHeight}=useVideoConfig();
  const now=frame/fps;
  const end=e.at+e.hold;
  if (now<e.at||now>=end) return null;

  // Every visible motion value is derived from the video frame, not the browser clock.
  const elapsed=Math.max(0,frame-Math.round(e.at*fps));
  const entranceFrames=Math.max(6,Math.round(fps*0.48));
  const progress=e.animation==='none'?1:interpolate(elapsed,[0,entranceFrames],[0,1],clamp);
  const springProgress=spring({frame:elapsed,fps,config:{damping:14,stiffness:155,mass:0.9}});
  const exitStart=Math.max(e.at+0.2,end-0.33);
  const exit=e.exit==='none'?1:interpolate(now,[exitStart,end],[1,0],clamp);
  const opacity=Math.min(progress,exit);
  const color=COLORS[e.color]||COLORS.white;
  const Icon=ICONS[e.icon]||Globe2;
  const requestedSize=Math.round(e.size*(canvasWidth<1500?0.95:1));
  const isText=['title','subtitle','kinetic','quote','callout','pill','tag'].includes(e.type);
  const family=e.font==='Montserrat'?"'Montserrat',Arial,sans-serif":e.font==='Arial'?'Arial,sans-serif':'Inter,Arial,sans-serif';
  const size=isText?fitTextSize({text:e.text,size:requestedSize,width:e.width,canvasWidth,
    fontFamily:family,fontWeight:e.type==='subtitle'?600:900,
    singleLine:e.lineMode==='single',paddingPx:e.type==='callout'?58:0}):requestedSize;
  const s={
    position:'absolute',left:`${e.x}%`,top:`${e.y}%`,width:`${e.width}%`,
    color,fontFamily:family,fontSize:size,
    lineHeight:1.12,opacity,
    // Never split words into 'EQUILIBRI' + 'O'. Newlines are explicit layout cues.
    wordBreak:'normal',overflowWrap:'normal',hyphens:'none',
    whiteSpace:e.lineMode==='single'?'nowrap':'pre-line',
    ...presetTransform(e.animation,progress,springProgress)
  };

  if(e.type==='infoCard') {
    const widthPx=canvasWidth*e.width/100, heightPx=canvasHeight*e.height/100;
    const padding=canvasWidth<1300?38:52;
    const heading=String(e.heading||'INFORMACIÓN');
    const headingSize=fitTextSize({text:heading,size:Math.min(76,size),
      width:e.width,canvasWidth,fontFamily:family,fontWeight:800,
      singleLine:true,paddingPx:padding*2});
    const bodySize=fitParagraphSize({
      text:e.text,widthPx:widthPx-padding*2,
      heightPx:heightPx-padding*2-headingSize*1.5,
      requested:canvasWidth<1300?32:40,min:23
    });
    return <div className="pointer-events-none absolute vrm-info-card"
      style={{...s,height:e.height+'%',padding,display:'flex',flexDirection:'column',
        justifyContent:'center',gap:Math.max(20,headingSize*0.42),
        borderRadius:30,overflow:'hidden',boxSizing:'border-box'}}>
      <div className="font-extrabold tracking-tight" style={{
        fontSize:headingSize,lineHeight:1.12,whiteSpace:'nowrap'}}>{heading}</div>
      <div aria-hidden="true" style={{height:4,width:'24%',backgroundColor:color,opacity:0.9}}/>
      <div className="font-normal" style={{fontSize:bodySize,lineHeight:1.4,
        whiteSpace:'normal',overflowWrap:'normal',hyphens:'none'}}>
        <TextWithoutBrokenWords text={e.text}/>
      </div>
    </div>;
  }
  if(e.type==='pulse') {
    const box=Math.max(140,Math.min(340,size*3.4));
    const phase=(elapsed/(fps*2))%1;
    return <div className="pointer-events-none absolute" style={s}>
      <svg width={box} height={box} viewBox="0 0 300 300" aria-hidden="true">
        {[0,1,2].map(index=>{
          const t=(phase+index/3)%1;
          return <circle key={index} cx="150" cy="150" r={25+t*116}
            fill="none" stroke={color} strokeWidth={3.5*(1-t)} opacity={(1-t)*0.85}/>;
        })}
        <circle cx="150" cy="150" r="17" fill={color} opacity="0.85"/>
        <circle cx="150" cy="150" r="7" fill="white"/>
      </svg>
    </div>;
  }
  if(e.type==='beam') {
    const sweep=((elapsed/(fps*2.8))%1)*100;
    return <div className="pointer-events-none absolute" style={s}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div className="absolute inset-0" style={{background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
        <span className="absolute top-0 h-full w-[14%] rounded-full bg-white/90"
          style={{left:(sweep-7)+'%',filter:'blur(5px)'}}/>
      </div>
    </div>;
  }
  if(e.type==='ticker') {
    const speed=elapsed/fps*50;
    const content=(e.text||'MOTION')+'    ✦    '+(e.text||'MOTION')+'    ✦    '+(e.text||'MOTION');
    return <div className="pointer-events-none absolute overflow-hidden rounded-lg border-y border-white/20 bg-black/35 py-3"
      style={{...s,whiteSpace:'nowrap',fontSize:size*0.65}}>
      <div className="inline-block font-black uppercase tracking-[0.18em]"
        style={{transform:'translateX(-'+(speed%200).toFixed(2)+'px)'}}>{content}</div>
    </div>;
  }
  if (e.type==='kinetic') return <div className="pointer-events-none absolute" style={s}>
    <KineticWords text={e.text} elapsed={elapsed} size={size}/>
  </div>;
  if (e.type==='orbit') return <div className="pointer-events-none absolute vrm-glow" style={s}>
    <OrbitGraphic size={size} color={color} elapsed={elapsed} fps={fps}/>
  </div>;
  if (e.type==='callout') return <div className="pointer-events-none absolute" style={s}>
    <div className="vrm-glass inline-flex w-full items-center gap-4 rounded-xl px-5 py-4">
      <span className="h-4 w-4 shrink-0 rounded-full" style={{backgroundColor:color,boxShadow:'0 0 20px '+color}}/>
      <span className="font-bold" style={{fontSize:size*0.8}}>{e.text}</span>
    </div>
  </div>;
  if (e.type==='icon') return <div className="pointer-events-none absolute vrm-glow" style={s}>
    <Icon size={Math.round(size*1.65)} strokeWidth={2.3}/>
  </div>;
  if (e.type==='divider') return <div className="pointer-events-none absolute" style={s}>
    <div className="vrm-divider h-2 rounded-full" style={{background:`linear-gradient(90deg,${color},transparent)`,width:`${Math.round(progress*100)}%`}}/>
  </div>;
  if (e.type==='ring') return <div className="pointer-events-none absolute vrm-glow" style={s}>
    <ProgressRing element={e} color={color} progress={progress}/>
  </div>;
  if (e.type==='tag') return <div className="pointer-events-none absolute" style={s}>
    <span className="vrm-badge inline-flex max-w-full items-center gap-3 rounded-xl px-5 py-3 text-white shadow-xl"
      style={{backgroundColor:color,fontSize:Math.round(size*0.78)}}>
      <Icon size={Math.round(size*0.75)}/><span className="font-black uppercase tracking-[0.12em]">{e.text}</span>
    </span>
  </div>;
  if (e.type==='pill') return <div className="pointer-events-none absolute" style={s}>
    <span className="vrm-glass inline-flex max-w-full items-center gap-3 rounded-full px-6 py-3 font-bold"
      style={{borderColor:color}}>
      <Icon size={Math.round(size*0.9)}/>{e.text}
    </span>
  </div>;
  if (e.type==='quote') return <blockquote className="vrm-glass vrm-glow pointer-events-none absolute rounded-2xl px-7 py-6 font-bold italic"
    style={{...s,borderLeft:`6px solid ${color}`}}>“{e.text}”</blockquote>;
  if (e.type==='stat') return <div className="pointer-events-none absolute vrm-glow" style={s}>
    <div className="font-black tracking-tight" style={{fontSize:'1.8em'}}>
      {new Intl.NumberFormat('es-ES').format(Math.round(e.value*progress))}
    </div>
    <div className="font-bold uppercase tracking-[0.12em]" style={{fontSize:'0.42em'}}>{e.text}</div>
  </div>;
  if (e.type==='bar') return <div className="pointer-events-none absolute vrm-glow" style={s}>
    <div className="mb-3 font-bold" style={{fontSize:'0.75em'}}>{e.text} · {Math.round(Math.min(100,e.value)*progress)}%</div>
    <div className="h-5 w-full overflow-hidden rounded-full border border-white/35 bg-black/30">
      <div className="h-full rounded-full" style={{width:`${Math.min(100,e.value)*progress}%`,background:`linear-gradient(90deg,${color},#fff)`}}/>
    </div>
  </div>;

  return <div className={e.type==='subtitle'
    ?'pointer-events-none absolute vrm-glow font-semibold tracking-tight'
    :'pointer-events-none absolute vrm-title font-black tracking-[-0.035em]'}
    style={s}><TextWithoutBrokenWords text={e.text}/></div>;
}

export const Overlay=({spec})=><AbsoluteFill className="vrm-overlay" style={{backgroundColor:'transparent'}}>
  {spec.elements.map((e,i)=><Element key={i} element={e}/>)}
</AbsoluteFill>;
