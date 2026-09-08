import { defineConfig } from 'rolldown'

export default defineConfig({
  input: ['dist/cleanup.js'],
  platform: 'node',
  output: {
    dir: 'dist/minified',
    format: 'esm',
    sourcemap: false,
    entryFileNames: 'cleanup.mjs',
    minify: true,
  },
})
