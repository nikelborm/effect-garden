#!/usr/bin/env node

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

import pkg from './package.json' with { type: 'json' }
import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  pathToEntityInRepoCLIOptionBackedByEnv,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/commandLineParams.ts'
import { downloadEntityFromRepo } from './src/downloadEntityFromRepo.ts'
import { OctokitLayer } from './src/octokit.ts'

const appCommand = Command.make(
  pkg.name,
  {
    repo: {
      owner: repoOwnerCLIOptionBackedByEnv,
      name: repoNameCLIOptionBackedByEnv,
    },
    pathToEntityInRepo: pathToEntityInRepoCLIOptionBackedByEnv,
    localPathAtWhichEntityFromRepoWillBeAvailable:
      destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  downloadEntityFromRepo,
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
