import {
  defineConfig,
  coverageConfigDefaults,
  defaultExclude,
} from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...defaultExclude, 'tmp/**'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './gh-page/coverage',
      exclude: [
        ...coverageConfigDefaults.exclude,
        'destination/**',
        'tmp/**',
        '**/{scratchpad,index,logObjectPretty}[.][jt]s',
      ],
    },
  },
});
