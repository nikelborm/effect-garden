import { defineConfig } from 'rolldown'

export default defineConfig({
  input: ['dist/index.js'],
  platform: 'node',
  output: {
    dir: 'dist/minified',
    format: 'esm',
    sourcemap: false,
    entryFileNames: 'index.mjs',
    minify: true,
  },
})
