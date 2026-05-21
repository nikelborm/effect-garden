import { downloadEntityFromRepo } from '@evadev/git-dl'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'

import { repo } from './repo.ts'

// TODO: appends file just plainly like this because, the YAML is not guaranteed
// to be valid, for example in cases where keys of objects are derived with env
// substitutions. Althouth for such to be present in apache superset is
// unlikely. Maybe should try a hybrid approach?

export const downloadComposeFileAndAddNewNetworkToIt = Effect.fn(
  'downloadComposeFileAndAddNewNetworkToIt',
)(function* (basePath: string, gitRef: string) {
  const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

  const newComposeFilePath = path.join(basePath, 'compose.yml')

  yield* downloadEntityFromRepo({
    pathToEntityInRepo: 'docker-compose-image-tag.yml',
    localPathAtWhichEntityFromRepoWillBeAvailable: newComposeFilePath,
    repo,
    gitRef,
  })

  yield* fs.writeFileString(
    newComposeFilePath,
    additionalIntegrationNetwork,
    { flag: 'a' }, // appends to the end
  )
})

const additionalIntegrationNetwork = `
networks:
  default:
    name: apache_superset_network
`
