import { FileSystem } from '@effect/platform';
import {
  Config,
  ConfigError,
  Context,
  Effect,
  Layer,
  pipe,
  Redacted,
  Schema,
  type Option,
} from 'effect';

// ! Don't forget to update packages/backend/turbo.json and add new env variables there

// import { PlatformConfigProvider } from "@effect/platform";
// import { BunContext } from "@effect/platform-bun";
// import { Config, Effect, Layer } from "effect";

// const EnvProviderLayer = Layer.unwrapEffect(
//   PlatformConfigProvider.fromDotEnv(".env").pipe(
//     Effect.map(Layer.setConfigProvider),
//     Effect.provide(BunContext.layer)
//   )
// )

const ifConfigAbsentFallbackTo =
  <A2, E2, R2>(fallback: Effect.Effect<A2, E2, R2>) =>
  <
    A,
    E,
    R,
    Pack extends ConfigError.ConfigError extends E ? [A2, E2, R2] : never,
    Res extends Effect.Effect<A | Pack[0], E | Pack[1], R | Pack[2]>,
  >(
    self: Effect.Effect<A, E, R>
  ): Res =>
    Effect.catchAll(self, (err) =>
      ConfigError.isConfigError(err) && ConfigError.isMissingDataOnly(err)
        ? (fallback as Res)
        : Effect.fail(err)
    ) as Res;

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
] as const;

const EnvTypeConfig = Config.literal(...allowedEnvTypeLiterals);

export class EnvType extends Effect.Tag(
  '@nikelborm/backend-config/index/EnvType'
)<EnvType, 'development' | 'production'>() {
  static Live = EnvTypeConfig('NODE_ENV').pipe(
    ifConfigAbsentFallbackTo(EnvTypeConfig('ENV')),
    Effect.map((v) =>
      v.toLowerCase().startsWith('dev') ? 'development' : 'production'
    ),
    Effect.orDie,
    Layer.effect(this)
  );
}

////////////////////////////////////////////////////////////////////////////////

export class BackendPort extends Effect.Tag(
  '@nikelborm/backend-config/index/BackendPort'
)<BackendPort, number>() {
  static Live = Config.port('BACKEND_PORT').pipe(
    ifConfigAbsentFallbackTo(Config.port('PORT')),
    ifConfigAbsentFallbackTo(Effect.succeed(3001)),
    Effect.orDie,
    Layer.effect(this)
  );
}

////////////////////////////////////////////////////////////////////////////////

export class BackendExternallyAvailableAtURL extends Context.Tag(
  '@nikelborm/backend-config/index/BackendExternallyAvailableAtURL'
)<BackendExternallyAvailableAtURL, URL>() {
  static Live = pipe(
    Config.url('EXTERNALLY_AVAILABLE_AT_URL'),
    Effect.catchAll((err) =>
      EnvType.use((env) =>
        env === 'development' && ConfigError.isMissingDataOnly(err)
          ? Config.port('EXTERNAL_PROXIED_PORT').pipe(
              ifConfigAbsentFallbackTo(BackendPort),
              Effect.map((port) => new URL(`http://localhost:${port}/`))
            )
          : Effect.fail(err)
      )
    ),
    Effect.orDie,
    Layer.effect(this),
    Layer.provide([EnvType.Live, BackendPort.Live])
  );
}

////////////////////////////////////////////////////////////////////////////////

export class OpenTelemetryProcessingURL extends Context.Tag(
  '@nikelborm/backend-config/index/OpenTelemetryProcessingURL'
)<OpenTelemetryProcessingURL, Option.Option<URL>>() {
  static Live = Config.url('OTLP_URL').pipe(
    Config.option,
    // for cases, where env is present, but it's bad, it will be error instead
    // of Option.None, and so we crash on that error
    Effect.orDie,
    Layer.effect(this)
  );
}

////////////////////////////////////////////////////////////////////////////////

export class BetterAuthSecret extends Effect.Service<BetterAuthSecret>()(
  '@nikelborm/backend-config/index/BetterAuthSecret',
  {
    dependencies: [EnvType.Live],
    effect: Effect.gen(function* () {
      const env = yield* EnvType;
      const fs = yield* FileSystem.FileSystem;

      if (env === 'development')
        return {
          secret: yield* Config.redacted('BETTER_AUTH_SECRET'),
        };

      // using env is actually insecure on most linux machines, because any
      // process can be easily inspected and their envs too
      const secretFilePath = yield* Config.nonEmptyString(
        'BETTER_AUTH_SECRET_FILE_PATH'
      );

      return {
        secret: yield* fs
          .readFileString(secretFilePath, 'utf8')
          .pipe(Effect.map(Redacted.make)),
      };
    }).pipe(Effect.orDie),
  }
) {}

////////////////////////////////////////////////////////////////////////////////

const ConfigStringWithMinLength2 = (name: string) =>
  Schema.Config(name, Schema.String.pipe(Schema.minLength(2)));

export class DbConfig extends Effect.Service<DbConfig>()(
  '@nikelborm/backend-config/index/DbConfig',
  {
    effect: Config.all({
      host: ConfigStringWithMinLength2('DATABASE_HOST'),
      port: Config.port('DATABASE_PORT'),
      username: ConfigStringWithMinLength2('DATABASE_USERNAME'),
      password: Config.redacted('DATABASE_PASSWORD'),
      database: ConfigStringWithMinLength2('DATABASE_NAME'),
      ssl: Config.succeed(false),
    }).pipe(
      Effect.map((db) => ({ db })),
      Effect.orDie
    ),
  }
) {}

////////////////////////////////////////////////////////////////////////////////

export const AppConfigLive = Layer.mergeAll(
  EnvType.Live,
  BackendPort.Live,
  BackendExternallyAvailableAtURL.Live,
  OpenTelemetryProcessingURL.Live,
  BetterAuthSecret.Default,
  DbConfig.Default
);
