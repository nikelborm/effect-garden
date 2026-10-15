import { defineConfig } from 'rolldown'

export default defineConfig({
  input: ['dist/index.js'],
  platform: 'node',
  // `bun:ffi` is a Bun runtime builtin (see suspend-guard.ts); the bundle runs
  // under `bun`, so the import has to survive bundling instead of being
  // resolved against node_modules.
  external: ['bun:ffi'],
  output: {
    dir: 'dist/minified',
    format: 'esm',
    sourcemap: false,
    entryFileNames: 'index.mjs',
    minify: true,
  },
})
