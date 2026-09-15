import { config } from 'dotenv'

import * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'

import { ensureDevEnvExists } from './ensureDevEnvExists.ts'
import { devEnvFilePath } from './paths.ts'

const PortSchema = Schema.compose(
  Schema.NumberFromString,
  Schema.Positive.pipe(Schema.lessThanOrEqualTo(65535)),
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

const decodeDevEnvEither = Schema.decodeUnknownResult(DevEnvSchema)
export const decodeDbConfigSync = Schema.decodeUnknownSync(DatabaseConfigSchema)

export async function getDevEnvFromFile() {
  await ensureDevEnvExists()

  const { parsed, error } = config({ path: devEnvFilePath, quiet: true })

  if (error) throw error

  const envEither = decodeDevEnvEither(parsed)

  if (Result.isLeft(envEither)) throw envResult.fail

  return envResult.succeed
}
