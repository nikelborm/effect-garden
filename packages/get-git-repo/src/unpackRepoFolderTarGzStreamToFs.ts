import { type Effect, gen, tryPromise } from 'effect/Effect';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { extract } from 'tar-fs';
import { OutputConfigTag } from './configContext.ts';
import {
  type TaggedErrorClass,
  buildTaggedErrorClassVerifyingCause,
} from './TaggedErrorVerifyingCause.ts';

export const unpackRepoFolderTarGzStreamToFs = <E, R>(
  self: Effect<Readable, E, R>,
) =>
  gen(function* () {
    const tarGzStream = yield* self;

    const {
      localPathAtWhichEntityFromRepoWillBeAvailable:
        pathToLocalDirWhichWillHaveContentsOfRepoDir,
    } = yield* OutputConfigTag;

    yield* tryPromise({
      try: signal =>
        pipeline(
          tarGzStream,
          createGunzip(),
          extract(pathToLocalDirWhichWillHaveContentsOfRepoDir, {
            map: header => {
              // GitHub creates archive with nested dir inside which has all
              // the files we need, so we remove this dir's name from the
              // beginning
              header.name = header.name.replace(/^[^/]*\/(.*)/, '$1');
              return header;
            },
          }),
          { signal },
        ),
      catch: cause =>
        new FailedToUnpackRepoFolderTarGzStreamToFsError({ cause }),
    });
  });

// Extracting to a separate type is required by JSR, so that consumers of the
// library will have much faster type inference
const _1: TaggedErrorClass<{
  ErrorName: 'FailedToUnpackRepoFolderTarGzStreamToFsError';
  DynamicContext: { cause: unknown };
}> = buildTaggedErrorClassVerifyingCause<{ cause: unknown }>()(
  'FailedToUnpackRepoFolderTarGzStreamToFsError',
  'Error: Failed to unpack to fs received from GitHub .tar.gz stream of repo folder contents',
);

export class FailedToUnpackRepoFolderTarGzStreamToFsError extends _1 {}
