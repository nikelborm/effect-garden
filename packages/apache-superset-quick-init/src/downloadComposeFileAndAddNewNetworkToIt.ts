import { downloadEntityFromRepo } from '@nikelborm/git-dl'

import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { all, fn } from 'effect/Effect'

import { repo } from './repo.ts'

export const downloadComposeFileAndAddNewNetworkToIt = fn(
  'downloadComposeFileAndAddNewNetworkToIt',
)(function* (basePath: string, gitRef: string) {
  const [fs, path] = yield* all([FileSystem, Path])

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
