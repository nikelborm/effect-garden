#!/usr/bin/env node

import { CliConfig, Span } from '@effect/cli'
import { make, run } from '@effect/cli/Command'
import { map as mapCLIOption } from '@effect/cli/Options'
import { layer as NodeFileSystemLayer } from '@effect/platform-node-shared/NodeFileSystem'
import { layer as NodePathLayer } from '@effect/platform-node-shared/NodePath'
import { runMain } from '@effect/platform-node-shared/NodeRuntime'
import { layer as NodeTerminalLayer } from '@effect/platform-node-shared/NodeTerminal'
import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from '@nikelborm/git-dl'
import { catchAll, fail, provide, sandbox, withSpan } from 'effect/Effect'
import { pipe } from 'effect/Function'
import { prettyPrint } from 'effect-errors'
import pkg from './package.json' with { type: 'json' }
import { createApacheSupersetFolder } from './src/createApacheSupersetFolder.ts'

const appCommand = make(
  pkg.name,
  {
    destinationPath: destinationPathCLIOptionBackedByEnv.pipe(
      mapCLIOption(e => (e === './destination' ? './superset' : e)),
    ),
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
)

const cli = run(appCommand, {
  name: pkg.name,
  version: pkg.version,
  summary: Span.text(pkg.description),
})

pipe(
  process.argv,
  cli,
  provide(NodeFileSystemLayer),
  provide(NodePathLayer),
  provide(NodeTerminalLayer),
  provide(CliConfig.layer({ showTypes: false })),
  provide(
    OctokitLayer({
      // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
    }),
  ),
  sandbox,
  catchAll(e => {
    console.error(prettyPrint(e))

    return fail(e)
  }),
  withSpan('cli', {
    attributes: {
      name: pkg.name,
      version: pkg.version,
    },
  }),
  runMain({
    disableErrorReporting: true,
  }),
)
