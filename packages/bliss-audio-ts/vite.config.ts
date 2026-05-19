import {
  coverageConfigDefaults,
  defaultExclude,
  defineConfig,
} from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [
      ...defaultExclude,
      '**/{.github,.stryker-tmp,.vscode,dist,gh-page,node_modules,reports,scripts,tmp}/**',
      '**/*{helper,types,tstyche}.spec[.][jt]s',
    ],
    coverage: {
      enabled: false,
      // Maybe enable istanbul coverage later?
      // I was mentioned as working here https://github.com/oven-sh/bun/issues/4145
      provider: 'v8',
      reportsDirectory: './gh-page/coverage',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'destination/**',
        'tmp/**',
        '**/{scratchpad,index}[.][jt]s',
      ],
    },
  },
})
