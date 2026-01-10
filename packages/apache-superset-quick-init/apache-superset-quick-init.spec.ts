import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from '@nikelborm/git-dl'
import { parse } from 'yaml'

import * as CLICommand from '@effect/cli/Command'
import * as HelpDocSpan from '@effect/cli/HelpDoc/Span'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as NodeContext from '@effect/platform-node/NodeContext'
import { describe, it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import pkg from './package.json' with { type: 'json' }
import { createApacheSupersetFolder } from './src/index.ts'

const appCommand = CLICommand.make(
  pkg.name,
  {
    destinationPath: destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
)

const cli = (args: ReadonlyArray<string>) =>
  CLICommand.run(appCommand, {
    name: pkg.name,
    version: pkg.version,
    summary: HelpDocSpan.text(pkg.description),
  })(['node', '-', ...args])

describe('CLI', { concurrent: true }, () => {
  it.scoped('downloads needed files and folders', ctx =>
    Effect.gen(function* () {
      const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

      const destinationPath = path.join(
        yield* fs.makeTempDirectoryScoped(),
        'superset',
      )

      yield* cli([`--destinationPath=${destinationPath}`])

      const composeFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'compose.yml'),
      )

      const composeFileParsed = yield* Effect.sync(() =>
        parse(composeFileAsString),
      )

      ctx
        .expect(composeFileParsed)
        .toHaveProperty('networks.default.name', 'apache_superset_network')

      ctx.expect(composeFileParsed).toHaveProperty('services.superset')

      const pipRequirementsFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'docker', 'requirements-local.txt'),
      )

      ctx.expect(pipRequirementsFileAsString).toContain('pillow')

      const envFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'docker', '.env'),
      )

      ctx
        .expect(envFileAsString)
        .not.toContain(
          'Make sure you set this to a unique secure random value on production',
        )

      ctx.expect(envFileAsString).not.toContain('POSTGRES_PASSWORD=superset')

      const websocketConfigFileAsString = yield* fs.readFileString(
        path.join(
          destinationPath,
          'docker',
          'superset-websocket',
          'config.json',
        ),
      )

      const websocketConfigFileParsed = yield* Effect.sync(() =>
        JSON.parse(websocketConfigFileAsString),
      )

      ctx
        .expect(websocketConfigFileParsed)
        .not.toHaveProperty(
          'jwtSecret',
          'CHANGE-ME-IN-PRODUCTION-GOTTA-BE-LONG-AND-SECRET',
        )
    }).pipe(Effect.provide(Layer.merge(NodeContext.layer, OctokitLayer()))),
  )
})
