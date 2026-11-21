import React from 'react';
import {AbsoluteFill,interpolate,spring,useCurrentFrame,useVideoConfig} from 'remotion';
import {Overlay} from './Overlay.jsx';
import {keyframesToStyle,presetTransform} from '../shared/motion.js';

const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'};

function Group({scene,group}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const started=scene.at+group.at;
  const time=frame/fps-started;
  if(time<0||time>=group.hold)return null;
  const localFrame=Math.max(0,frame-Math.round(started*fps));
  const progress=interpolate(time,[0,0.46],[0,1],clamp);
  const bounce=spring({fps,frame:localFrame,config:{damping:16,stiffness:145,mass:0.9}});
  const exit=interpolate(time,[Math.max(0,group.hold-0.35),group.hold],[1,0],clamp);
  const manual=keyframesToStyle(group.keyframes,time);
  const style={
    backgroundColor:'transparent',pointerEvents:'none',
    opacity:Math.min(progress,exit)*(manual?.opacity??1),
    ...(manual?{transform:manual.transform,filter:manual.filter}:presetTransform(group.motion,progress,bounce))
  };
  // The legacy Element API expects absolute seconds. Shift only timing;
  // all x/y coordinates remain relative to the original video canvas.
  const elements=group.elements.map(e=>({...e,at:started+e.at,hold:Math.min(e.hold,group.hold-e.at)}));
  return <AbsoluteFill style={style}>
    <Overlay spec={{elements}}/>
  </AbsoluteFill>;
}

function Shot({scene}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const time=frame/fps-scene.at;
  if(time<0||time>=scene.hold)return null;
  const progress=interpolate(time,[0,0.28],[0,1],clamp);
  const exit=interpolate(time,[Math.max(0,scene.hold-0.26),scene.hold],[1,0],clamp);
  const transition=scene.transition;
  const transform=transition==='slide'?'translateX('+((1-progress)*65).toFixed(2)+'px)':
    transition==='zoom'?'scale('+(1.05-progress*0.05).toFixed(4)+')':'none';
  const opacity=transition==='cut'?exit:Math.min(progress,exit);
  return <AbsoluteFill className={'vrm-scene vrm-preset-'+scene.preset}
      style={{backgroundColor:'transparent',pointerEvents:'none',opacity,transform}}>
    {scene.groups.map((group,index)=><Group key={index} group={group} scene={scene}/>)}
  </AbsoluteFill>;
}

/**
 * Canonical V2 storyboard renderer. A shot contains independent motion groups,
 * each with individual elements. All timing is based on useCurrentFrame().
 */
export function TimelineStage({spec}) {
  if(!Array.isArray(spec.scenes)){
    // A pre-migration scene can still be previewed without conversion.
    return <Overlay spec={spec}/>;
  }
  return <AbsoluteFill style={{backgroundColor:'transparent',overflow:'hidden',pointerEvents:'none'}}>
    {spec.scenes.map((scene,index)=><Shot key={index} scene={scene}/>)}
  </AbsoluteFill>;
}
