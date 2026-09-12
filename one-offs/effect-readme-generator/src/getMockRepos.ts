import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { constant, pipe } from 'effect/Function'
import * as Path from 'effect/Path'
import * as Schema from 'effect/Schema'

import { Repo } from './repo.interface.ts'

export const getMockRepos = Effect.fn('getMockRepos')(function* (
  owner: string,
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const previouslySavedFilePath = path.join(
    process.cwd(),
    './reposCreatedAndStarredByMe.json',
  )

  return yield* fs.readFileString(previouslySavedFilePath).pipe(
    Effect.flatMap(Schema.decode(Repo.ChunkFromJSON)),
    Effect.tapError(error =>
      Effect.logError(
        `Error loading ${previouslySavedFilePath}, falling back to primitive mock`,
        error,
      ),
    ),
    Effect.orElseSucceed(
      pipe(
        Chunk.make('apache-superset-quick-init', 'download-github-folder'),
        Chunk.map(name =>
          Repo.make({
            name,
            isItArchived: false,
            isTemplate: false,
            starCount: 1,
            forkCount: 0,
            lastTimeBeenPushedInto: new Date(),
            owner,
          }),
        ),
        constant,
      ),
    ),
  )
})
