import {Config} from '@remotion/cli/config';
import {tailwindBundlerOverride} from './server/render/tailwind-bundler.mjs';

Config.overrideBundlerConfig(tailwindBundlerOverride);
