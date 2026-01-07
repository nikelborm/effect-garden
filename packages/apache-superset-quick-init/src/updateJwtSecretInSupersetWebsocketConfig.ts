import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { all, flatMap, fn } from 'effect/Effect'
import {
  Any,
  decode,
  encode,
  NonEmptyString,
  parseJson,
  Record,
} from 'effect/Schema'

import { allWithInheritedConcurrencyByDefault } from './allWithInheritedConcurrency.ts'
import { generateRandomPassword } from './generateRandomPassword.ts'

export const updateJwtSecretInSupersetWebsocketConfig = fn(
  'updateJwtSecretInSupersetWebsocketConfig',
)(function* (basePath: string) {
  const [fs, path] = yield* all([FileSystem, Path])

  const supersetWebsocketConfigPath = path.join(
    basePath,
    'docker',
    'superset-websocket',
    'config.json',
  )

  const { configFileParsed, jwtSecret } =
    yield* allWithInheritedConcurrencyByDefault({
      configFileParsed: fs
        .readFileString(supersetWebsocketConfigPath, 'utf8')
        .pipe(flatMap(decodeSupersetWebsocketConfig)),
      jwtSecret: generateRandomPassword,
    })

  const config = yield* encodeSupersetWebsocketConfig({
    ...configFileParsed,
    jwtSecret,
  })

  yield* fs.writeFileString(supersetWebsocketConfigPath, config, {
    mode: 0o600,
  })
})

const SupersetWebsocketConfigSchema = parseJson(
  Record({
    key: NonEmptyString,
    value: Any,
  }),
)

const decodeSupersetWebsocketConfig = decode(SupersetWebsocketConfigSchema)
const encodeSupersetWebsocketConfig = encode(SupersetWebsocketConfigSchema)
