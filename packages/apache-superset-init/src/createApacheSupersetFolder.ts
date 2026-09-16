import { allFast } from '@evadev/effect-helpers'
import { downloadEntityFromRepo } from 'gitdl'

import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import * as Path from 'effect/Path'

import { createPipRequirementsConfig } from './createPipRequirementsConfig.ts'
import { downloadComposeFileAndAddNewNetworkToIt } from './downloadComposeFileAndAddNewNetworkToIt.ts'
import { repo } from './repo.ts'
import { updateEnvFile } from './updateEnvFile.ts'
import { updateJwtSecretInSupersetWebsocketConfig } from './updateJwtSecretInSupersetWebsocketConfig.ts'

export const createApacheSupersetFolder = Effect.fn(
  'createApacheSupersetFolder',
)(function* ({
  gitRef,
  destinationPath,
}: {
  gitRef: string
  destinationPath: string
}) {
  const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

  yield* fs
    .makeDirectory(destinationPath, { recursive: true })
    .pipe(Effect.orDie)

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
}, Effect.orDie)
