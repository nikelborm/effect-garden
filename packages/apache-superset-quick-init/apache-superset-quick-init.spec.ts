import { Span } from '@effect/cli';
import { make, run } from '@effect/cli/Command';
import { NodeContext } from '@effect/platform-node';
import { FileSystem } from '@effect/platform/FileSystem';
import { Path } from '@effect/platform/Path';
import { describe, it } from '@effect/vitest';
import { all, gen, provide, sync } from 'effect/Effect';
import { merge } from 'effect/Layer';
import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  OctokitLayer,
} from '@nikelborm/git-dl';
import { parse } from 'yaml';
import pkg from './package.json' with { type: 'json' };
import { createApacheSupersetFolder } from './src/index.ts';

const appCommand = make(
  pkg.name,
  {
    destinationPath: destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  createApacheSupersetFolder,
);

const cli = (args: ReadonlyArray<string>) =>
  run(appCommand, {
    name: pkg.name,
    version: pkg.version,
    summary: Span.text(pkg.description),
  })(['node', '-', ...args]);

describe('CLI', { concurrent: true }, () => {
  it.scoped('downloads needed files and folders', ctx =>
    gen(function* () {
      const [fs, path] = yield* all([FileSystem, Path]);

      const destinationPath = path.join(
        yield* fs.makeTempDirectoryScoped(),
        'superset',
      );

      yield* cli([`--destinationPath=${destinationPath}`]);

      const composeFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'compose.yml'),
      );

      const composeFileParsed = yield* sync(() => parse(composeFileAsString));

      ctx
        .expect(composeFileParsed)
        .toHaveProperty('networks.default.name', 'apache_superset_network');

      ctx.expect(composeFileParsed).toHaveProperty('services.superset');

      const pipRequirementsFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'docker', 'requirements-local.txt'),
      );

      ctx.expect(pipRequirementsFileAsString).toContain('pillow');

      const envFileAsString = yield* fs.readFileString(
        path.join(destinationPath, 'docker', '.env'),
      );

      ctx
        .expect(envFileAsString)
        .not.toContain(
          'Make sure you set this to a unique secure random value on production',
        );

      ctx.expect(envFileAsString).not.toContain('POSTGRES_PASSWORD=superset');

      const websocketConfigFileAsString = yield* fs.readFileString(
        path.join(
          destinationPath,
          'docker',
          'superset-websocket',
          'config.json',
        ),
      );

      const websocketConfigFileParsed = yield* sync(() =>
        JSON.parse(websocketConfigFileAsString),
      );

      ctx
        .expect(websocketConfigFileParsed)
        .not.toHaveProperty(
          'jwtSecret',
          'CHANGE-ME-IN-PRODUCTION-GOTTA-BE-LONG-AND-SECRET',
        );
    }).pipe(provide(merge(NodeContext.layer, OctokitLayer()))),
  );
});
