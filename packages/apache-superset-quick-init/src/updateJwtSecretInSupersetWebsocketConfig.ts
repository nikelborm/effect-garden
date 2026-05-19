import { allFast } from '@nikelborm/effect-helpers'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { generateRandomPassword } from './generateRandomPassword.ts'

export const updateJwtSecretInSupersetWebsocketConfig = Effect.fn(
  'updateJwtSecretInSupersetWebsocketConfig',
)(function* (basePath: string) {
  const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

  const supersetWebsocketConfigPath = path.join(
    basePath,
    'docker',
    'superset-websocket',
    'config.json',
  )

  const { configFileParsed, jwtSecret } = yield* allFast({
    configFileParsed: fs
      .readFileString(supersetWebsocketConfigPath, 'utf8')
      .pipe(Effect.flatMap(decodeSupersetWebsocketConfig)),
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

const SupersetWebsocketConfigSchema = Schema.parseJson(
  Schema.Record({
    key: Schema.NonEmptyString,
    value: Schema.Any,
  }),
)

const decodeSupersetWebsocketConfig = Schema.decode(SupersetWebsocketConfigSchema)
const encodeSupersetWebsocketConfig = Schema.encode(SupersetWebsocketConfigSchema)
