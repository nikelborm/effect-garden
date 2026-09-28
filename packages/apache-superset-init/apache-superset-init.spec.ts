import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from 'gitdl'
import { parse } from 'yaml'

import * as NodeServices from '@effect/platform-node/NodeServices'
import { it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import * as Layer from 'effect/Layer'
import * as Path from 'effect/Path'
import * as Stdio from 'effect/Stdio'
import * as Command from 'effect/unstable/cli/Command'

import pkg from './package.json' with { type: 'json' }
import { createApacheSupersetFolder } from './src/index.ts'

const appCommand = Command.make(
  pkg.name,
  {
    destinationPath: destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
)

const cliEffect = Command.run(appCommand, {
  version: pkg.version,
})

const MainLive = Layer.merge(NodeServices.layer, OctokitLayer())

it.layer(MainLive)('CLI', it => {
  it.effect(
    'downloads needed files and folders',
    Effect.fnUntraced(function* (ctx) {
      const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

      const destinationPath = path.join(
        yield* fs.makeTempDirectoryScoped(),
        'superset',
      )

      yield* Effect.provide(
        cliEffect,
        Stdio.layerTest({
          args: Effect.succeed([`--destinationPath=${destinationPath}`]),
        }),
      )

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
    }),
  )
})
