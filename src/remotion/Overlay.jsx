import React from 'react';
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {Globe2,BarChart3,TrendingUp,TriangleAlert,Flag,Zap,ShieldCheck,Users} from 'lucide-react';
import {COLORS} from '../shared/spec.js';
const ICONS={globe:Globe2,chart:BarChart3,trend:TrendingUp,alert:TriangleAlert,
 flag:Flag,bolt:Zap,shield:ShieldCheck,users:Users};
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};
function Element({element:e}) {
 const frame=useCurrentFrame();
 const {fps,width:canvasWidth}=useVideoConfig();
 const now=frame/fps;
 const end=e.at+e.hold;
 if(now<e.at||now>end)return null;
 const intro=interpolate(now,[e.at,e.at+0.4],[0,1],clamp);
 const outro=interpolate(now,[Math.max(e.at+0.4,end-0.35),end],[1,0],clamp);
 const opacity=Math.min(intro,outro);
 const transform=e.animation==='left'?'translateX('+((1-intro)*-90)+'px)':
   e.animation==='up'?'translateY('+((1-intro)*70)+'px)':
   e.animation==='pop'?'scale('+(0.65+intro*0.35)+')':'none';
 const color=COLORS[e.color]||COLORS.white;
 const Icon=ICONS[e.icon]||Globe2;
 const s={position:'absolute',left:e.x+'%',top:e.y+'%',width:e.width+'%',color,
   transform,opacity,fontFamily:'Arial, sans-serif',fontWeight:800,
   fontSize:Math.round(e.size*(canvasWidth<1500?0.95:1)),lineHeight:1.1,
   textShadow:'0 6px 20px rgba(0,0,0,.72)'};
 if(e.type==='icon')return <div style={s}><Icon size={Math.round(e.size*1.5)} strokeWidth={2.8}/></div>;
 if(e.type==='tag')return <div style={s}><span style={{display:'inline-block',padding:'0.24em 0.5em',background:'#d71927',color:'white',borderRadius:9}}>{e.text}</span></div>;
 if(e.type==='stat')return <div style={s}><div style={{fontSize:'1.8em'}}>{new Intl.NumberFormat('es-ES').format(Math.round(e.value*intro))}</div><div style={{fontSize:'0.48em'}}>{e.text}</div></div>;
 if(e.type==='bar')return <div style={s}>
   <div style={{fontSize:'0.8em',marginBottom:12}}>{e.text} · {Math.round(e.value*intro)}%</div>
   <div style={{height:18,width:'100%',border:'2px solid white',background:'rgba(0,0,0,.25)',borderRadius:20,overflow:'hidden'}}>
     <div style={{height:'100%',width:(Math.min(100,e.value)*intro)+'%',backgroundColor:color,borderRadius:20}}/>
   </div>
 </div>;
 return <div style={{...s,fontWeight:e.type==='subtitle'?600:900}}>{e.text}</div>;
}
export const Overlay=({spec})=><AbsoluteFill style={{backgroundColor:'transparent'}}>
 {spec.elements.map((e,i)=><Element key={i} element={e}/>)}
</AbsoluteFill>;
