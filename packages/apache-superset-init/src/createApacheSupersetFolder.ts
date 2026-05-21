import { allFast } from '@evadev/effect-helpers'
import type { Octokit } from '@octokit/core'
import { downloadEntityFromRepo } from 'git-dlp'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'

import { createPipRequirementsConfig } from './createPipRequirementsConfig.js'
import { downloadComposeFileAndAddNewNetworkToIt } from './downloadComposeFileAndAddNewNetworkToIt.js'
import { repo } from './repo.js'
import { updateEnvFile } from './updateEnvFile.js'
import { updateJwtSecretInSupersetWebsocketConfig } from './updateJwtSecretInSupersetWebsocketConfig.js'

export const createApacheSupersetFolder: (config: {
  gitRef: string
  destinationPath: string
}) => Effect.Effect<void, never, FileSystem.FileSystem | Path.Path | Octokit> =
  EFunction.flow(
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
