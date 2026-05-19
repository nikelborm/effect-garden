import { allFast } from '@nikelborm/effect-helpers'
import { downloadEntityFromRepo } from '@nikelborm/git-dl'
import type { Octokit } from '@octokit/core'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import { createPipRequirementsConfig } from './createPipRequirementsConfig.ts'
import { downloadComposeFileAndAddNewNetworkToIt } from './downloadComposeFileAndAddNewNetworkToIt.ts'
import { repo } from './repo.ts'
import { updateEnvFile } from './updateEnvFile.ts'
import { updateJwtSecretInSupersetWebsocketConfig } from './updateJwtSecretInSupersetWebsocketConfig.ts'

export const createApacheSupersetFolder: (config: {
  gitRef: string
  destinationPath: string
}) => Effect.Effect<void, never, FileSystem.FileSystem | Path.Path | Octokit> = EFunction.flow(
  Effect.fn('createApacheSupersetFolder')(function* ({
    gitRef,
    destinationPath,
  }: {
    gitRef: string
    destinationPath: string
  }) {
    const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

    yield* fs.makeDirectory(destinationPath, { recursive: true })

    const downloadDockerFolder = downloadEntityFromRepo({
      pathToEntityInRepo: 'docker',
      localPathAtWhichEntityFromRepoWillBeAvailable: path.join(
        destinationPath,
        'docker',
      ),
      repo,
      gitRef,
    })

    const patchSomeStuffInDockerFolder = allFast([
      updateJwtSecretInSupersetWebsocketConfig(destinationPath),
      updateEnvFile(destinationPath),
      createPipRequirementsConfig(destinationPath),
    ])

    yield* allFast([
      downloadComposeFileAndAddNewNetworkToIt(destinationPath, gitRef),
      downloadDockerFolder.pipe(Effect.andThen(patchSomeStuffInDockerFolder)),
    ])
  }),
  Effect.orDie,
)
