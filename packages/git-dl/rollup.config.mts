import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { visualizer } from 'rollup-plugin-visualizer';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import type { RollupOptions } from 'rollup';

export default {
  input: 'dist/git-dl.js',
  output: {
    dir: 'dist/minified',
    format: 'es',
    sourcemap: true,
    compact: true,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json(),
    visualizer({
      sourcemap: true,
      filename: 'gh-page/bundled_deps/index.html',
    }),
    terser(),
  ],
} satisfies RollupOptions;
