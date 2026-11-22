import React from 'react';
import {fitText,fitTextOnNLines} from '@remotion/layout-utils';
import {Circle} from '@remotion/shapes';
import {evolvePath} from '@remotion/paths';
import {fitTextSize,fitParagraphSize} from '../shared/text-layout.js';

// Source is original project code; it uses official Remotion APIs to get
// reliable font metrics and reproducible vector graphics.
const FONT_WEIGHT=800;
function textFit(text,width,family,size,weight=FONT_WEIGHT) {
  try {
    const result=fitText({text,withinWidth:width,fontFamily:family,fontWeight:weight});
    if(result.fontSize>0&&Number.isFinite(result.fontSize))return Math.min(size,result.fontSize*0.96);
  }catch { /* Fonts may be initializing; conservative fallback below. */ }
  return Math.min(size,Math.max(18,width/Math.max(text.length*0.65,1)));
}
function paragraphFit(text,width,height,family) {
  try{
    const fitted=fitTextOnNLines({text,maxBoxWidth:width,maxLines:6,fontFamily:family,
      fontWeight:400,maxFontSize:46});
    const lines=Math.max(1,fitted.lines?.length||1);
    if(Number.isFinite(fitted.fontSize)&&fitted.fontSize>0)
      return Math.max(20,Math.min(fitted.fontSize*0.96,height/(lines*1.48)));
  }catch{/* Deterministic fallback for loading or unusual fonts. */}
  return fitParagraphSize({text,widthPx:width,heightPx:height,requested:40,min:20});
}
function variantStyle(variant) {
  switch(variant){
    case 'minimal':return{background:'transparent',border:'none',borderRadius:0,
      boxShadow:'none',backdropFilter:'none'};
    case 'outline':return{background:'rgba(6,12,23,.53)',border:'2px solid rgba(255,255,255,.55)',
      borderRadius:14,boxShadow:'0 15px 45px rgba(0,0,0,.26)'};
    case 'editorial':return{background:'linear-gradient(110deg,rgba(12,20,33,.91),rgba(22,30,41,.76))',
      border:'1px solid rgba(255,255,255,.23)',borderRadius:12,boxShadow:'0 24px 58px rgba(0,0,0,.38)'};
    case 'quote':return{background:'rgba(9,13,20,.67)',border:'1px solid rgba(255,255,255,.3)',
      borderRadius:18,boxShadow:'0 20px 45px rgba(0,0,0,.33)'};
    default:return{background:'linear-gradient(135deg,rgba(13,19,31,.88),rgba(31,44,60,.70))',
      border:'1.5px solid rgba(255,255,255,.32)',borderRadius:28,
      boxShadow:'0 24px 65px rgba(0,0,0,.36)',backdropFilter:'blur(9px)'};
  }
}
export function ProfessionalCard({element:e,baseStyle,canvasWidth,canvasHeight,color,family,progress}){
  const widthPx=canvasWidth*e.width/100, heightPx=canvasHeight*e.height/100;
  const padding=Math.max(30,Math.min(58,canvasWidth*0.028));
  const contentWidth=Math.max(150,widthPx-padding*2);
  const title=e.heading||'INFORMACIÓN';
  const isQuote=e.variant==='quote';
  const headSize=textFit(title,contentWidth,family,Math.min(85,e.size||75),800);
  const decorationHeight=20;
  const availableBody=Math.max(80,heightPx-padding*2-headSize*1.22-decorationHeight-32);
  const fontSize=paragraphFit(e.text,contentWidth,availableBody,family);
  const rule='M 0 3 L 164 3';
  const line=evolvePath(Math.min(1,Math.max(0,progress)),rule);
  return <div className="pointer-events-none absolute vrm-professional-card"
    data-vrm-card="true" data-design-variant={e.variant||'glass'}
    style={{...baseStyle,height:e.height+'%',display:'flex',flexDirection:'column',
      justifyContent:'center',gap:Math.max(16,headSize*0.36),padding,
      boxSizing:'border-box',overflow:'hidden',...variantStyle(e.variant)}}>
    {e.variant==='editorial'&&<div aria-hidden="true" style={{position:'absolute',
      top:0,bottom:0,left:0,width:7,background:color}}/>}
    {isQuote&&<div aria-hidden="true" style={{fontSize:80,position:'absolute',top:0,right:25,
      color,opacity:.45,fontFamily:'Georgia,serif'}}>“</div>}
    <div data-vrm-heading="true" style={{fontFamily:family,fontSize:headSize,lineHeight:1.13,
      fontWeight:800,letterSpacing:'-0.035em',whiteSpace:'nowrap',
      textShadow:'0 3px 12px rgba(0,0,0,.38)'}}>{title}</div>
    <svg width="168" height="8" viewBox="0 0 168 8" aria-hidden="true" style={{flexShrink:0}}>
      <path d={rule} stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={line.strokeDasharray} strokeDashoffset={line.strokeDashoffset}/>
    </svg>
    <div data-vrm-body="true" style={{fontFamily:family,fontSize,lineHeight:1.46,
      fontWeight:400,overflowWrap:'break-word',hyphens:'none',
      maxWidth:'100%',minWidth:0,wordBreak:'normal',whiteSpace:'normal'}}>
      {e.text}
    </div>
  </div>;
}
export function ProfessionalLabel({element:e,baseStyle,color,family,fontSize,progress}){
  const variant=e.variant||'ribbon';
  const clean=variant==='minimal'||variant==='sides'||variant==='stack';
  const indexed=variant==='indexed';
  const bg=clean?'transparent':variant==='outline'?'rgba(10,15,23,.58)':
    'linear-gradient(100deg,rgba(9,15,27,.9),rgba(17,27,43,.70))';
  const style={...baseStyle,display:'flex',alignItems:'center',
    gap:Math.max(14,Math.min(24,fontSize*.3)),
    padding:clean?'0':indexed?'12px 20px':'14px 24px',
    background:bg,boxSizing:'border-box',
    border:clean?'none':'1px solid rgba(255,255,255,.28)',
    borderLeft:clean?'none':variant==='ribbon'?'5px solid '+color:'1px solid rgba(255,255,255,.28)',
    borderRadius:clean?0:variant==='ribbon'?12:16,
    boxShadow:clean?'none':'0 15px 36px rgba(0,0,0,.28)',
    whiteSpace:'nowrap',overflow:'visible'};
  // The circle comes from @remotion/shapes, and is drawn by Remotion as an SVG,
  // independent of browser timers.
  return <div className="pointer-events-none absolute vrm-professional-label"
    style={style} data-vrm-label={variant}>
    {!clean&&<div style={{flexShrink:0,opacity:progress}}>
      <Circle radius={Math.max(5,Math.min(8,fontSize*.14))} fill={color}/>
    </div>}
    <span style={{fontFamily:family,fontSize,fontWeight:clean?900:750,
      lineHeight:1.1,whiteSpace:'nowrap',letterSpacing:'-0.025em'}}>{e.text}</span>
  </div>;
}
