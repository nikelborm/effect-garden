import { defaultExclude, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...defaultExclude,
      '**/{.github,.stryker-tmp,.vscode,dist,dist-types,node_modules,tmp}/**',
      '**/*{helper,types,tstyche}.spec[.][jt]s',
    ],
  },
})
