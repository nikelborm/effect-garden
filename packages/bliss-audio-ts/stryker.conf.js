// @ts-check

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: 'npm',
  reporters: ['clear-text', 'progress'],
  coverageAnalysis: 'all',
  tsconfigFile: 'tsconfig.json',
  plugins: ['@stryker-mutator/vitest-runner'],
  timeoutMS: 8000,
  // concurrency 4 leaves just enough space for applications existing in
  // parrallel to not suffocate
  concurrency: 4,
  mutate: ['bliss.ts'],
}
export default config
