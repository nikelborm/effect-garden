import { allFast } from '@evadev/effect-helpers'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { generateRandomPassword } from './generateRandomPassword.ts'

export const updateJwtSecretInSupersetWebsocketConfig = Effect.fn(
  'updateJwtSecretInSupersetWebsocketConfig',
)(function* (basePath: string) {
  const [fs, path] = yield* allFast([FileSystem.FileSystem, Path.Path])

  const websocketDirPath = path.join(basePath, 'docker', 'superset-websocket')

  const exampleFilePath = path.join(websocketDirPath, 'config.example.json')

  const { configFileParsed, jwtSecret } = yield* allFast({
    configFileParsed: Effect.flatMap(
      fs.readFileString(exampleFilePath, 'utf8'),
      decodeSupersetWebsocketConfig,
    ),
    jwtSecret: generateRandomPassword,
  })

  const config = yield* encodeSupersetWebsocketConfig({
    ...configFileParsed,
    jwtSecret,
  })

  const websocketConfigPath = path.join(websocketDirPath, 'config.json')

  yield* fs.writeFileString(websocketConfigPath, config, { mode: 0o600 })
})

const SupersetWebsocketConfigSchema = Schema.parseJson(
  Schema.Record({
    key: Schema.NonEmptyString,
    value: Schema.Any,
  }),
)

const decodeSupersetWebsocketConfig = Schema.decode(
  SupersetWebsocketConfigSchema,
)
const encodeSupersetWebsocketConfig = Schema.encode(
  SupersetWebsocketConfigSchema,
)
