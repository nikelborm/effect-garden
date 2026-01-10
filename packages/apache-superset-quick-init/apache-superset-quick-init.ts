#!/usr/bin/env node

import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from '@nikelborm/git-dl'
import { prettyPrint } from 'effect-errors'

import * as CliConfig from '@effect/cli/CliConfig'
import * as CLICommand from '@effect/cli/Command'
import * as HelpDocSpan from '@effect/cli/HelpDoc/Span'
import * as CLIOptions from '@effect/cli/Options'
import * as NodeFileSystem from '@effect/platform-node-shared/NodeFileSystem'
import * as NodePath from '@effect/platform-node-shared/NodePath'
import * as NodeRuntime from '@effect/platform-node-shared/NodeRuntime'
import * as NodeTerminal from '@effect/platform-node-shared/NodeTerminal'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Layer from 'effect/Layer'

import pkg from './package.json' with { type: 'json' }
import { createApacheSupersetFolder } from './src/createApacheSupersetFolder.ts'

const appCommand = CLICommand.make(
  pkg.name,
  {
    destinationPath: destinationPathCLIOptionBackedByEnv.pipe(
      CLIOptions.map(e => (e === './destination' ? './superset' : e)),
    ),
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
)

const cli = CLICommand.run(appCommand, {
  name: pkg.name,
  version: pkg.version,
  summary: HelpDocSpan.text(pkg.description),
})

const AppLayer = Layer.mergeAll(
  NodeFileSystem.layer,
  NodePath.layer,
  NodeTerminal.layer,
  CliConfig.layer({ showTypes: false }),
  OctokitLayer({
    // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
  }),
)

EFunction.pipe(
  process.argv,
  cli,
  Effect.provide(AppLayer),
  Effect.sandbox,
  Effect.catchAll(e => {
    console.error(prettyPrint(e))

    return Effect.fail(e)
  }),
  Effect.withSpan('cli', {
    attributes: {
      name: pkg.name,
      version: pkg.version,
    },
  }),
  NodeRuntime.runMain({
    disableErrorReporting: true,
  }),
)
