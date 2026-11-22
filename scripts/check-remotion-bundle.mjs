import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {tailwindBundlerOverride} from '../server/render/tailwind-bundler.mjs';

// Checks that Remotion (Webpack) can compile the same composition, Tailwind
// and SVG components as the Vite preview. Does not download a browser or render.
const entryPoint=path.resolve('src/remotion/index.jsx');
const location=await bundle({entryPoint,bundlerOverride:tailwindBundlerOverride});
console.log('Remotion bundle compiled:',location);
