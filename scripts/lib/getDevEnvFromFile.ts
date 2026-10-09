import { config } from 'dotenv'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { ensureDevEnvExists } from './ensureDevEnvExists.ts'
import { devEnvFilePath } from './paths.ts'

const PortSchema = Schema.NumberFromString.check(
  Schema.isInt(),
  Schema.isBetween({ maximum: 65535, minimum: 1 }),
)

const DatabaseConfigSchema = Schema.Struct({
  DATABASE_HOST: Schema.Trimmed.check(Schema.isNonEmpty()),
  DATABASE_PASSWORD: Schema.Trimmed.check(Schema.isNonEmpty()),
  DATABASE_USERNAME: Schema.Trimmed.check(Schema.isNonEmpty()),
  DATABASE_NAME: Schema.Trimmed.check(Schema.isNonEmpty()),
  DATABASE_PORT: PortSchema,
})

const DevEnvSchema = Schema.Struct({
  COMPOSE_PROJECT_NAME: Schema.Trimmed.check(Schema.isNonEmpty()),

  BETTER_AUTH_SECRET: Schema.Trimmed.check(Schema.isNonEmpty()),
  EXTERNAL_PROXIED_PORT: PortSchema,
  TZ: Schema.Trimmed.check(Schema.isNonEmpty()),

  ...DatabaseConfigSchema.fields,
  DATABASE_PORT_EXPOSED_TO_DEV_LOCALHOST: PortSchema,
})

const decodeDevEnv = Schema.decodeUnknownEffect(DevEnvSchema)
export const decodeDbConfigSync = Schema.decodeUnknownSync(DatabaseConfigSchema)

export const getDevEnvFromFile = Effect.gen(function* () {
  yield* ensureDevEnvExists

  const { parsed, error } = yield* Effect.sync(() =>
    config({ path: devEnvFilePath, quiet: true }),
  )

  if (error) return yield* Effect.fail(error)

  return yield* decodeDevEnv(parsed)
}).pipe(Effect.withSpan('getDevEnvFromFile'))
