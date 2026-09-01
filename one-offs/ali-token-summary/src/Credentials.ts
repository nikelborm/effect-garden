/**
 * Alibaba Cloud access key resolution.
 *
 * Environment first, then the password store. The two `pass` lookups are
 * independent, so they run concurrently.
 */
import * as Config from 'effect/Config'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Redacted from 'effect/Redacted'
import * as Schema from 'effect/Schema'
import * as EString from 'effect/String'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

export class Credentials extends Context.Service<
  Credentials,
  Effect.Effect<
    {
      readonly accessKeyId: string
      readonly accessKeySecret: Redacted.Redacted<string>
    },
    CredentialsError
  >
>()('ali_summary/Credentials') {}

const ENV_KEY_ID = 'ALIBABA_CLOUD_ACCESS_KEY_ID'
const ENV_KEY_SECRET = 'ALIBABA_CLOUD_ACCESS_KEY_SECRET'

const PASS_KEY_ID = 'alibabacloud.com/vova/access_key_id'
const PASS_KEY_SECRET = 'alibabacloud.com/vova/access_key_secret'

const getParsedEnvOrFallbackToPassStore = <T>(conf: {
  envName: string
  passEntryPath: string
  /**
   * Applied to whatever the winning source handed back, so a value out of the
   * env and a value out of `pass` are held to the exact same shape.
   */
  schema: Schema.Codec<T, string>
}) =>
  Config.schema(Schema.String, conf.envName).pipe(
    Config.option,
    Effect.flatMapEager(Effect.fromOption),
    Effect.catchTag('NoSuchElementError', () =>
      Effect.logWarning(
        `Env var ${conf.envName} not found, attempting to fallback to Unix Password Store`,
      ).pipe(Effect.andThen(passShow(conf.passEntryPath))),
    ),
    Effect.catchTag(
      'ConfigError',
      CredentialsError.passthroughCause(
        `Failed to parse ${conf.envName} env var content (not a string???)`,
      ),
    ),
    Effect.flatMapEager(Schema.decodeEffect(conf.schema)),
    Effect.catchTag(
      'SchemaError',
      CredentialsError.passthroughCause(
        `Failed to parse the credential from either pass or env (${conf.envName})`,
      ),
    ),
  )

export class CredentialsError extends Schema.TaggedError<CredentialsError>()(
  'CredentialsError',
  {
    message: Schema.String,
    cause: Schema.optional(Schema.ErrorInstance()),
  },
) {
  static passthroughCause = (message: string) => (cause: Error) =>
    new CredentialsError({ message, cause })
}
const NonEmptyTrimmedString = Schema.String.check(
  Schema.isNonEmpty(),
  Schema.isTrimmed(),
)

/**
 * `LTAI` followed by 20 alphanumerics, 24 characters in total. Keys minted
 * before Alibaba settled on that shape were a bare 16 alphanumerics; this
 * rejects those, and rejects STS session credentials too, which nothing here
 * knows how to use anyway.
 */
const AccessKeyId = NonEmptyTrimmedString.pipe(
  Schema.check(
    Schema.isPattern(/^LTAI[0-9A-Za-z]{20}$/, {
      message:
        'Expected an AccessKey ID of the form LTAI + 20 alphanumerics, e.g. LTAI5tExampleKeyId000000',
    }),
  ),
)

/** Exactly 30 alphanumerics, no separators and no fixed prefix. */
const AccessKeySecret = NonEmptyTrimmedString.pipe(
  Schema.check(
    Schema.isPattern(/^[0-9A-Za-z]{30}$/, {
      message:
        'Expected an AccessKey secret of 30 alphanumerics, e.g. xY3kQ9pR2mS7tU4vW1zA6bC8dE0fG5',
    }),
  ),
)

export const layer = Layer.effect(
  Credentials,
  // biome-ignore lint/correctness/useHookAtTopLevel: dumbass
  ChildProcessSpawner.ChildProcessSpawner.useSync(spawner =>
    Effect.all(
      {
        accessKeyId: getParsedEnvOrFallbackToPassStore({
          envName: ENV_KEY_ID,
          passEntryPath: PASS_KEY_ID,
          schema: AccessKeyId,
        }),
        accessKeySecret: Effect.map(
          getParsedEnvOrFallbackToPassStore({
            envName: ENV_KEY_SECRET,
            passEntryPath: PASS_KEY_SECRET,
            schema: AccessKeySecret,
          }),
          Redacted.make,
        ),
      },
      { concurrency: 2 },
    ).pipe(
      Effect.provideService(ChildProcessSpawner.ChildProcessSpawner, spawner),
    ),
  ),
)

const passShow = (entry: string) =>
  ChildProcessSpawner.ChildProcessSpawner.use(spawner =>
    // inherit, so that gpg agent can show the password prompt
    spawner.string(
      ChildProcess.make({
        stderr: 'inherit',
        stdin: 'inherit',
      })`pass show ${entry}`,
    ),
  ).pipe(
    // The expectation is that nothing else will be present in the file except
    // one line we're looking for
    Effect.map(EString.trim),
    Effect.mapError(
      CredentialsError.passthroughCause(
        `Could not read "${entry}" from the password store`,
      ),
    ),
  )
