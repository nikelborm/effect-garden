#!/usr/bin/env node

import { CliConfig, Span } from '@effect/cli';
import { make, run } from '@effect/cli/Command';
import { layer as NodeFileSystemLayer } from '@effect/platform-node-shared/NodeFileSystem';
import { layer as NodePathLayer } from '@effect/platform-node-shared/NodePath';
import { runMain } from '@effect/platform-node-shared/NodeRuntime';
import { prettyPrint } from 'effect-errors';
import { layer as NodeTerminalLayer } from '@effect/platform-node-shared/NodeTerminal';
import { catchAll, fail, provide, sandbox, withSpan } from 'effect/Effect';
import { pipe } from 'effect/Function';
import pkg from './package.json' with { type: 'json' };
import {
  destinationPathCLIOptionBackedByEnv,
  downloadEntityFromRepo,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
  pathToEntityInRepoCLIOptionBackedByEnv,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/index.ts';

const appCommand = make(
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
);

const cli = run(appCommand, {
  name: pkg.name,
  version: pkg.version,
  summary: Span.text(pkg.description),
});

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
    console.error(prettyPrint(e));

    return fail(e);
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
);
