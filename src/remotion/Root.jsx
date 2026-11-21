import React from 'react';
import {Composition} from 'remotion';
import {TimelineStage} from './TimelineStage.jsx';
import {sampleSpec} from '../shared/spec.js';

export const RemotionRoot=()=> <Composition
 id="Overlay" component={TimelineStage} durationInFrames={180} fps={30}
 width={1920} height={1080} defaultProps={{spec:sampleSpec}}
 calculateMetadata={({props})=>({
   width:props.spec.format==='portrait'?1080:1920,
   height:props.spec.format==='portrait'?1920:1080,
   durationInFrames:Math.ceil(props.spec.duration*30)
 })}
/>;
