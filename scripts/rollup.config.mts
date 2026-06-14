import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import type { RollupOptions } from 'rollup'

export default {
  input: ['dist/quick_open_code.js', 'dist/cleanup.js'],
  output: {
    dir: 'dist/minified',
    format: 'es',
    sourcemap: false,
    compact: true,
  },
  plugins: [nodeResolve(), commonjs(), json(), terser()],
} satisfies RollupOptions
