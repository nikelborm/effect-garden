#!/usr/bin/env node

import * as CliConfig from '@effect/cli/CliConfig';
import * as HelpDocSpan from '@effect/cli/HelpDoc/Span';
import * as CliCommand from '@effect/cli/Command';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as NodeRuntime from '@effect/platform-node/NodeRuntime';
import * as NodeTerminal from '@effect/platform-node/NodeTerminal';
import { prettyPrint } from 'effect-errors';
import * as Effect from 'effect/Effect';
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

const appCommand = CliCommand.make(
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
  downloadEntityFromRepo
);

const cli = CliCommand.run(appCommand, {
  name: pkg.name,
  version: pkg.version,
  summary: HelpDocSpan.text(pkg.description),
});

pipe(
  process.argv,
  cli,
  Effect.provide(NodeFileSystem.layer),
  Effect.provide(NodePath.layer),
  Effect.provide(NodeTerminal.layer),
  Effect.provide(CliConfig.layer({ showTypes: false })),
  Effect.provide(
    OctokitLayer({
      // auth: getEnvVarOrFail('GITHUB_ACCESS_TOKEN'),
    })
  ),
  Effect.sandbox,
  Effect.catchAll((e) => {
    console.error(prettyPrint(e));

    return Effect.fail(e);
  }),
  Effect.withSpan('cli', {
    attributes: {
      name: pkg.name,
      version: pkg.version,
    },
  }),
  NodeRuntime.runMain({
    disableErrorReporting: true,
  })
);
