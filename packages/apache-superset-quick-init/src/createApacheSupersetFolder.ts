import { downloadEntityFromRepo } from '@nikelborm/git-dl'
import type { Octokit } from '@octokit/core'

import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { all, andThen, type Effect, fn, orDie } from 'effect/Effect'
import { flow } from 'effect/Function'

import { allWithInheritedConcurrencyByDefault } from './allWithInheritedConcurrency.ts'
import { createPipRequirementsConfig } from './createPipRequirementsConfig.ts'
import { downloadComposeFileAndAddNewNetworkToIt } from './downloadComposeFileAndNewNetworkToIt.ts'
import { repo } from './repo.ts'
import { updateEnvFile } from './updateEnvFile.ts'
import { updateJwtSecretInSupersetWebsocketConfig } from './updateJwtSecretInSupersetWebsocketConfig.ts'

export const createApacheSupersetFolder: (config: {
  gitRef: string
  destinationPath: string
}) => Effect<void, never, FileSystem | Path | Octokit> = flow(
  fn('createApacheSupersetFolder')(function* ({
    gitRef,
    destinationPath,
  }: {
    gitRef: string
    destinationPath: string
  }) {
    const [fs, path] = yield* all([FileSystem, Path])

    yield* fs.makeDirectory(destinationPath, {
      recursive: true,
    })

    const downloadDockerFolder = downloadEntityFromRepo({
      pathToEntityInRepo: 'docker',
      localPathAtWhichEntityFromRepoWillBeAvailable: path.join(
        destinationPath,
        'docker',
      ),
      repo,
      gitRef,
    })

    const patchSomeStuffInDockerFolder = allWithInheritedConcurrencyByDefault([
      updateJwtSecretInSupersetWebsocketConfig(destinationPath),
      updateEnvFile(destinationPath),
      createPipRequirementsConfig(destinationPath),
    ])

    yield* allWithInheritedConcurrencyByDefault([
      downloadComposeFileAndAddNewNetworkToIt(destinationPath, gitRef),
      downloadDockerFolder.pipe(andThen(patchSomeStuffInDockerFolder)),
    ])
  }),
  orDie,
)
