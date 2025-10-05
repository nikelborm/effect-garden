import { FileSystem } from '@effect/platform/FileSystem';
import { Path } from '@effect/platform/Path';
import { all, fn } from 'effect/Effect';

export const createPipRequirementsConfig = fn('createPipRequirementsConfig')(
  function* (basePath: string) {
    const [fs, path] = yield* all([FileSystem, Path]);

    yield* fs.writeFileString(
      path.join(basePath, 'docker', 'requirements-local.txt'),
      requirements,
    );
  },
);

const requirements = `
psycopg2-binary
pillow
`.slice(1);
