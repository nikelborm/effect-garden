#!/usr/bin/env node

import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from 'gitdl'

import * as NodeChildProcessSpawner from '@effect/platform-node/NodeChildProcessSpawner'
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import * as NodePath from '@effect/platform-node/NodePath'
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import * as NodeStdio from '@effect/platform-node/NodeStdio'
import * as NodeTerminal from '@effect/platform-node/NodeTerminal'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as CliConfig from 'effect/unstable/cli/CliConfig'
import * as Command from 'effect/unstable/cli/Command'
import * as Flag from 'effect/unstable/cli/Flag'

import pkg from './package.json' with { type: 'json' }
import { createApacheSupersetFolder } from './src/createApacheSupersetFolder.ts'

const appCommand = Command.make(
  pkg.name,
  {
    // TODO change approach to default values. Either remove defaults completely
    // or provided an easy way to set for people their own defaults instead of
    // comparing them to the hardcoded default value. Also document the helpers
    // for overriding defaults in TSDoc of exported CLIOptions objects
    destinationPath: destinationPathCLIOptionBackedByEnv.pipe(
      Flag.map(e => (e === './destination' ? './superset' : e)),
    ),
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
).pipe(Command.withDescription(pkg.description))

const cli = Command.run(appCommand, {
  version: pkg.version,
})

const AppLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(NodeFileSystem.layer),
  Layer.provideMerge(NodePath.layer),
  Layer.merge(NodeTerminal.layer),
  Layer.merge(CliConfig.layer()),
  Layer.merge(NodeStdio.layer),
  Layer.merge(
    OctokitLayer({
      // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
    }),
  ),
)

if (import.meta.main)
  pipe(
    cli,
    Effect.withSpan('cli', {
      attributes: {
        name: pkg.name,
        version: pkg.version,
      },
    }),
    Effect.catchCause(cause =>
      Console.error(Cause.pretty(cause)).pipe(
        Effect.andThen(Effect.failCause(cause)),
      ),
    ),
    Effect.provide(AppLayer),
    NodeRuntime.runMain(),
  )
