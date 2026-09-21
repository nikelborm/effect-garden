import * as Config from 'effect/Config'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { flow, pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Redacted from 'effect/Redacted'
import * as Schema from 'effect/Schema'

// ! Don't forget to update packages/backend/turbo.json and add new env variables there

// import { PlatformConfigProvider } from "@effect/platform";
// import { BunContext } from "@effect/platform-bun";
// import { Config, Effect, Layer } from "effect";

// const EnvProviderLayer = Layer.unwrap(
//   PlatformConfigProvider.fromDotEnv(".env").pipe(
//     Effect.map(Layer.setConfigProvider),
//     Effect.provide(BunServices.layer)
//   )
// )

// TODO: replace with just Config.withMissingDataOnlyFallback
// TODO: contribute to upstream Config.withMissingDataOnlyFallback, which is the same as withDefault, but accepts Config instead of values
// TODO: make Config.String ensure it's an actual string received, and also add `Config.asIs`, that accepts raw value.

// TODO: extract to helpers
export const ifConfigAbsentFallbackTo2 =
  <A>(fallback: Config.Config<A>) =>
  <B>(
    self: Config.Config<Option.Option<B>>,
  ): Config.Config<Option.Option<A | B>> =>
    Config.mapEffect(
      self,
      Option.match({
        onNone: () => Config.option(fallback),
        onSome: Effect.succeedSome<A | B>,
      }),
    )

export const ifConfigAbsentFallbackTo =
  <A>(fallback: Config.Config<A>) =>
  <B>(self: Config.Config<B>): Config.Config<Option.Option<A | B>> =>
    Config.mapEffect(
      Config.option(self),
      Option.match({
        onNone: () => Config.option(fallback),
        onSome: Effect.succeedSome<A | B>,
      }),
    )

////////////////////////////////////////////////////////////////////////////////

const allowedEnvTypeLiterals = [
  'dev',
  'prod',
  'development',
  'production',
  'DEV',
  'PROD',
  'DEVELOPMENT',
  'PRODUCTION',
] as const

const EnvTypeConfig = (name: string) =>
  Config.Literals(allowedEnvTypeLiterals, name)

export class EnvType extends Context.Service<
  EnvType,
  'development' | 'production'
>()('@evadev/backend-config/index/EnvType') {
  static readonly layer = EnvTypeConfig('NODE_ENV').pipe(
    ifConfigAbsentFallbackTo(EnvTypeConfig('ENV')),
    Effect.flatMapEager(
      flow(
        Option.map(v =>
          v.toLowerCase().startsWith('dev') ? 'development' : 'production',
        ),
        Effect.fromOption,
      ),
    ),
    Effect.orDie,
    Layer.effect(this),
  )
}

////////////////////////////////////////////////////////////////////////////////

export class BackendPort extends Context.Service<BackendPort, number>()(
  '@evadev/backend-config/index/BackendPort',
) {
  static readonly layer = Config.Port('BACKEND_PORT').pipe(
    ifConfigAbsentFallbackTo(Config.Port('PORT')),
    ifConfigAbsentFallbackTo2(Config.succeed(3001)),
    Effect.flatMapEager(Effect.fromOption),
    Effect.orDie,
    Layer.effect(this),
  )
}

////////////////////////////////////////////////////////////////////////////////

const externalUrlConfig = Config.URL('EXTERNALLY_AVAILABLE_AT_URL')

export class BackendExternallyAvailableAtURL extends Context.Service<
  BackendExternallyAvailableAtURL,
  URL
>()('@evadev/backend-config/index/BackendExternallyAvailableAtURL') {
  static readonly layer = pipe(
    externalUrlConfig,
    Config.option,
    Effect.flatMapEager(Effect.fromOption),
    Effect.catchTag('NoSuchElementError', () =>
      EnvType.use(env =>
        env === 'development'
          ? Config.Port('EXTERNAL_PROXIED_PORT').pipe(
              Config.option,
              Effect.flatMapEager(Effect.fromOption),
              Effect.catchTag('NoSuchElementError', () => BackendPort),
              Effect.map(port => new URL(`http://localhost:${port}/`)),
            )
          : // easiest way to create a proper error structure on absence, that
            // would've been thrown if we didn't map it to option earlier to
            // handle the actual absence case
            externalUrlConfig,
      ),
    ),
    Effect.orDie,
    Layer.effect(this),
  )

  static readonly layerNoConfDeps = Layer.provide(this.layer, [
    EnvType.layer,
    BackendPort.layer,
  ])
}

////////////////////////////////////////////////////////////////////////////////

export class OpenTelemetryProcessingURL extends Context.Service<
  OpenTelemetryProcessingURL,
  Option.Option<URL>
>()('@evadev/backend-config/index/OpenTelemetryProcessingURL') {
  static readonly layer = Config.URL('OTLP_URL').pipe(
    Config.option,
    // for cases, where env is present, but it's bad, it will be error instead
    // of Option.None, and so we crash on that error
    Effect.orDie,
    Layer.effect(this),
  )
}

////////////////////////////////////////////////////////////////////////////////

export class BetterAuthSecret extends Context.Service<
  BetterAuthSecret,
  { secret: Redacted.Redacted<string> }
>()('@evadev/backend-config/index/BetterAuthSecret') {
  static readonly layer = Effect.gen(function* () {
    const env = yield* EnvType
    const fs = yield* FileSystem.FileSystem

    if (env === 'development')
      return { secret: yield* Config.Redacted('BETTER_AUTH_SECRET') }

    // using env is actually insecure on most linux machines, because any
    // process can be easily inspected and their envs too
    const secretFilePath = yield* Config.NonEmptyString(
      'BETTER_AUTH_SECRET_FILE_PATH',
    )

    return {
      secret: yield* fs
        .readFileString(secretFilePath, 'utf8')
        .pipe(Effect.map(Redacted.make)),
    }
  }).pipe(Effect.orDie, Layer.effect(this))

  static readonly layerNoConfDeps = Layer.provide(this.layer, EnvType.layer)
}

////////////////////////////////////////////////////////////////////////////////

const ConfigStringWithMinLength2 = (name: string) =>
  Config.schema(Schema.String.check(Schema.isMinLength(2)), name)

export class DbConfig extends Context.Service<DbConfig>()(
  '@evadev/backend-config/index/DbConfig',
  {
    make: Config.all({
      host: ConfigStringWithMinLength2('DATABASE_HOST'),
      port: Config.Port('DATABASE_PORT'),
      username: ConfigStringWithMinLength2('DATABASE_USERNAME'),
      password: Config.Redacted('DATABASE_PASSWORD'),
      database: ConfigStringWithMinLength2('DATABASE_NAME'),
      ssl: Config.succeed(false),
    }).pipe(
      Effect.map(db => ({ db })),
      Effect.orDie,
    ),
  },
) {
  static readonly layer = Layer.effect(this, this.make)
}

////////////////////////////////////////////////////////////////////////////////

export const AppConfigLayer = Layer.mergeAll(
  EnvType.layer,
  BackendPort.layer,
  BackendExternallyAvailableAtURL.layer,
  OpenTelemetryProcessingURL.layer,
  BetterAuthSecret.layer,
  DbConfig.layer,
)
