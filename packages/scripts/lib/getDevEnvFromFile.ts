import { config } from 'dotenv'
import { Either, Schema } from 'effect'
import { ensureDevEnvExists } from './ensureDevEnvExists.ts'
import { devEnvFilePath } from './paths.ts'

const PortSchema = Schema.compose(
  Schema.NumberFromString,
  Schema.Positive.pipe(Schema.lessThanOrEqualTo(65535)),
)

const DatabaseConfigSchema = Schema.Struct({
  DATABASE_HOST: Schema.NonEmptyTrimmedString,
  DATABASE_PASSWORD: Schema.NonEmptyTrimmedString,
  DATABASE_USERNAME: Schema.NonEmptyTrimmedString,
  DATABASE_NAME: Schema.NonEmptyTrimmedString,
  DATABASE_PORT: PortSchema,
})

const DevEnvSchema = Schema.Struct({
  COMPOSE_PROJECT_NAME: Schema.NonEmptyTrimmedString,

  BETTER_AUTH_SECRET: Schema.NonEmptyTrimmedString,
  EXTERNAL_PROXIED_PORT: PortSchema,
  TZ: Schema.NonEmptyTrimmedString,

  ...DatabaseConfigSchema.fields,
  DATABASE_PORT_EXPOSED_TO_DEV_LOCALHOST: PortSchema,
})

const decodeDevEnvEither = Schema.decodeUnknownEither(DevEnvSchema)
export const decodeDbConfigSync = Schema.decodeUnknownSync(DatabaseConfigSchema)

export async function getDevEnvFromFile() {
  await ensureDevEnvExists()

  const { parsed, error } = config({ path: devEnvFilePath, quiet: true })

  if (error) throw error

  const envEither = decodeDevEnvEither(parsed)

  if (Either.isLeft(envEither)) throw envEither.left

  return envEither.right
}
