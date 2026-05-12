#!/usr/bin/env bun

import * as Prompt from '@effect/cli/Prompt'
import * as Command from '@effect/platform/Command'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunSink from '@effect/platform-bun/BunSink'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Record from 'effect/Record'
import * as Stream from 'effect/Stream'

import { packagesDirPath, projectRootAbsolutePath } from './lib/paths.ts'

const vscodeConfig = {
  'git.openRepositoryInParentFolders': 'always',
}

const author = {
  name: 'nikelborm',
  email: 'evadev@duck.com',
  url: 'https://github.com/nikelborm',
}

const packageJson = (config: { name: string; description: string }) => ({
  name: config.name,
  version: '0.1.0',
  type: 'module',
  description: config.description,
  license: 'MIT',
  scripts: {
    build: 'tspc',
    prepack: 'rm -rf dist dist-types && ./node_modules/.bin/tspc',
    dev: 'tspc --watch --preserveWatchOutput false',
  },
  files: [
    'dist-types',
    'dist',
    'index.ts',
    'package.json',
    'src',
    '!**/*.spec.*',
    '!**/*.tsbuildinfo',
    '!**/scratchpad.*',
  ],
  peerDependencies: {
    effect: 'catalog:',
  },
  homepage:
    `https://github.com/nikelborm/effect-garden/tree/main/packages/` +
    config.name,
  devDependencies: {
    '@effect/language-service': 'catalog:',
    '@nikelborm/tsconfig': 'workspace:*',
    'ts-namespace-import': 'catalog:',
    'ts-patch': 'catalog:',
    typescript: 'catalog:',
  },
  publishConfig: {
    access: 'public',
    provenance: false,
  },
  repository: {
    type: 'git',
    url: 'git+ssh://git@github.com/nikelborm/effect-garden.git',
    directory: 'packages/' + config.name,
  },
  bugs: {
    url: 'https://github.com/nikelborm/effect-garden/issues',
    email: 'evadev@duck.com',
  },
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist-types/index.d.ts',
  exports: {
    '.': {
      types: './dist-types/index.d.ts',
      default: './dist/index.js',
    },
    './*.js': {
      types: './dist-types/src/*.d.ts',
      default: './dist/src/*.js',
    },
    './*.ts': './src/*.ts',
    './*': {
      types: './dist-types/src/*.d.ts',
      default: './dist/src/*.js',
    },
    './internal/*': null,
    './package.json': './package.json',
  },
  author: author,
  contributors: [author],
  maintainers: [author],
})

const tsconfigJson = {
  extends: '@nikelborm/tsconfig',
  compilerOptions: {
    declarationDir: './dist-types',
    outDir: './dist',
    rootDir: './',
  },
  include: ['**/*.ts'],
  exclude: [
    '.github',
    '.stryker-tmp',
    '.turbo',
    '.vscode',
    'build',
    'dist-types',
    'dist',
    'gh-page',
    'node_modules',
    'out',
    'reports',
    'tmp',
    'vite.config.ts',
  ],
}

const emptyInternalTsNamespaceFile = `/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Effect from 'effect/Effect'
`

Effect.gen(function* () {
  const { namespaces, ...config } = yield* Prompt.all({
    name: Prompt.text({
      message: `Enter package name (if you want, add 'effect-' prefix):`,
      validate: value =>
        value.length <= 3
          ? Either.left('Name is too short. At least 3 characters')
          : Either.right(value),
    }),
    description: Prompt.text({
      message: `Enter single-line short package description for readme and package.json:`,
      validate: value =>
        value.length <= 3
          ? Either.left('Name is too short. At least 3 characters')
          : Either.right(value),
    }),
    namespaces: Prompt.list({
      delimiter: ' ',
      message:
        'Enter a list of namespaces to create empty files for, delimited by space',
      validate: value =>
        value.length <= 1
          ? Either.left('Name is too short. At least 3 characters')
          : Either.right(value),
    }),
  }).pipe(Prompt.run)

  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const packagePath = path.join(packagesDirPath, config.name)
  const vscodeDirPath = path.join(packagePath, '.vscode')

  const srcDirPath = path.join(packagePath, 'src')
  const internalDirPath = path.join(srcDirPath, 'internal')

  yield* fs.makeDirectory(vscodeDirPath, { recursive: true })
  yield* fs.makeDirectory(internalDirPath, { recursive: true })

  const map = {
    [path.join(vscodeDirPath, 'settings.json')]: JSON.stringify(vscodeConfig),
    [path.join(packagePath, 'package.json')]: JSON.stringify(
      packageJson(config),
    ),
    [path.join(packagePath, 'tsconfig.json')]: JSON.stringify(tsconfigJson),
    [path.join(packagePath, 'README.md')]: JSON.stringify(
      '# ' + config.name + '\n\n' + config.description,
    ),
    [path.join(packagePath, 'index.ts')]: `export * from './src/index.ts'\n`,

    [path.join(srcDirPath, 'index.ts')]: namespaces
      .map(namespace => `export * as ${namespace} from './${namespace}.ts'\n`)
      .join(''),

    ...Object.fromEntries(
      namespaces.flatMap(namespace => [
        [
          path.join(srcDirPath, namespace + '.ts'),
          `export {} from './internal/${namespace}.ts'\n`,
        ],
        [
          path.join(internalDirPath, namespace + '.ts'),
          emptyInternalTsNamespaceFile,
        ],
      ]),
    ),
  }

  yield* Effect.forEach(Record.toEntries(map), ([path, content]) =>
    fs.writeFileString(path, content),
  )

  yield* Command.make('bun', 'add', config.name + '@workspace:*').pipe(
    Command.workingDirectory(projectRootAbsolutePath),
    Command.stream,
    Stream.run(BunSink.stdout),
  )

  yield* Command.make('bun', 'install').pipe(
    Command.workingDirectory(packagePath),
    Command.stream,
    Stream.run(BunSink.stdout),
  )
}).pipe(Effect.provide(BunContext.layer), BunRuntime.runMain)
