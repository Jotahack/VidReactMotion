import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {
  Globe2,BarChart3,TrendingUp,TriangleAlert,Flag,Zap,ShieldCheck,Users,
  Cpu,Landmark,Factory,Satellite,Rocket,Network,MapPin,Building2,Coins,Newspaper
} from 'lucide-react';
import {COLORS} from '../shared/spec.js';
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

function motionStyles(effect,progress,springProgress) {
  switch(effect) {
    case 'left':return {transform:`translateX(${Math.round((1-progress)*-96)}px)`};
    case 'right':return {transform:`translateX(${Math.round((1-progress)*96)}px)`};
    case 'up':return {transform:`translateY(${Math.round((1-progress)*75)}px)`};
    case 'down':return {transform:`translateY(${Math.round((1-progress)*-75)}px)`};
    case 'pop':return {transform:`scale(${(0.7+springProgress*0.3).toFixed(4)})`};
    case 'zoom':return {transform:`scale(${(1.25-progress*0.25).toFixed(4)})`};
    case 'rotate':return {transform:`rotate(${((1-progress)*-18).toFixed(2)}deg) scale(${(0.88+progress*0.12).toFixed(4)})`};
    case 'spring':return {transform:`translateY(${((1-springProgress)*95).toFixed(2)}px) scale(${(0.9+springProgress*0.1).toFixed(4)})`};
    case 'blur':return {filter:`blur(${((1-progress)*16).toFixed(2)}px)`};
    case 'wipe':return {clipPath:`inset(0 ${((1-progress)*100).toFixed(2)}% 0 0)`};
    default:return {};
  }
}

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

function Element({element:e}) {
  const frame=useCurrentFrame();
  const {fps,width:canvasWidth}=useVideoConfig();
  const now=frame/fps;
  const end=e.at+e.hold;
  if (now<e.at||now>=end) return null;

  // Every visible motion value is derived from the video frame, not the browser clock.
  const elapsed=Math.max(0,frame-Math.round(e.at*fps));
  const entranceFrames=Math.max(6,Math.round(fps*0.48));
  const progress=interpolate(elapsed,[0,entranceFrames],[0,1],clamp);
  const springProgress=spring({frame:elapsed,fps,config:{damping:14,stiffness:155,mass:0.9}});
  const exitStart=Math.max(e.at+0.2,end-0.33);
  const exit=interpolate(now,[exitStart,end],[1,0],clamp);
  const opacity=Math.min(progress,exit);
  const color=COLORS[e.color]||COLORS.white;
  const Icon=ICONS[e.icon]||Globe2;
  const size=Math.round(e.size*(canvasWidth<1500?0.95:1));
  const s={
    position:'absolute',left:`${e.x}%`,top:`${e.y}%`,width:`${e.width}%`,
    color,fontFamily:'Inter,Arial,sans-serif',fontSize:size,
    lineHeight:1.12,opacity,overflowWrap:'anywhere',
    ...motionStyles(e.animation,progress,springProgress)
  };

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
    style={s}>{e.text}</div>;
}

export const Overlay=({spec})=><AbsoluteFill className="vrm-overlay" style={{backgroundColor:'transparent'}}>
  {spec.elements.map((e,i)=><Element key={i} element={e}/>)}
</AbsoluteFill>;
