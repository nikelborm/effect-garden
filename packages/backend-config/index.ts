import { FileSystem } from '@effect/platform';
import {
  Config,
  ConfigError,
  Effect,
  Layer,
  pipe,
  Redacted,
  Schema,
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

////////////////////////////////////////////////////////////////////////////////

const EnvTypeWideLiteralConfig = Config.literal(
  'dev',
  'prod',
  'development',
  'production',
  'DEV',
  'PROD',
  'DEVELOPMENT',
  'PRODUCTION',
);

const EnvTypeConfig = EnvTypeWideLiteralConfig('NODE_ENV').pipe(
  Config.orElse(() => EnvTypeWideLiteralConfig('ENV')),
  Config.map(v =>
    v.toLowerCase().startsWith('dev') ? 'development' : 'production',
  ),
);

export class EnvType extends Effect.Tag('@nikelborm/EnvType')<
  EnvType,
  'development' | 'production'
>() {
  static Live = Layer.effect(this, Effect.orDie(EnvTypeConfig));
}

////////////////////////////////////////////////////////////////////////////////

const BackendPortConfig = Config.port('BACKEND_PORT').pipe(
  Config.orElse(() => Config.port('PORT')),
  Config.withDefault(3001),
);

export class BackendPort extends Effect.Tag('@nikelborm/BackendPort')<
  BackendPort,
  number
>() {
  static Live = Layer.effect(this, Effect.orDie(BackendPortConfig));
}

////////////////////////////////////////////////////////////////////////////////

export class BackendExternallyAvailableAtURL extends Effect.Tag(
  '@nikelborm/BackendExternallyAvailableAtURL',
)<BackendExternallyAvailableAtURL, URL>() {
  static Live = pipe(
    Config.url('EXTERNALLY_AVAILABLE_AT_URL'),
    Effect.catchAll(err =>
      EnvType.use(env =>
        env === 'development' && ConfigError.isMissingDataOnly(err)
          ? Config.port('EXTERNAL_PROXIED_PORT')
          : Effect.die(err.message),
      ),
    ),
    Effect.catchIf(ConfigError.isMissingDataOnly, () => BackendPort),
    Effect.map(externalPort => new URL(`http://localhost:${externalPort}/`)),
    Effect.orDie,
    Layer.effect(this),
    Layer.provide([EnvType.Live, BackendPort.Live]),
  );
}

////////////////////////////////////////////////////////////////////////////////

export class OpenTelemetryProcessingURL extends Effect.Service<OpenTelemetryProcessingURL>()(
  '@nikelborm/OpenTelemetryProcessingURL',
  {
    effect: Config.url('OTLP_URL').pipe(
      Config.option,
      Effect.map(openTelemetryProcessingURL => ({
        openTelemetryProcessingURL,
      })),
      // for cases, where env is present, but it's bad, it will be error instead
      // of Option.None, and so we crash on that error
      Effect.orDie,
    ),
  },
) {}

////////////////////////////////////////////////////////////////////////////////

export class BetterAuthSecret extends Effect.Service<BetterAuthSecret>()(
  '@nikelborm/BetterAuthSecret',
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
        'BETTER_AUTH_SECRET_FILE_PATH',
      );

      return {
        secret: yield* fs
          .readFileString(secretFilePath, 'utf8')
          .pipe(Effect.map(Redacted.make)),
      };
    }).pipe(Effect.orDie),
  },
) {}

////////////////////////////////////////////////////////////////////////////////

const ConfigStringWithMinLength2 = (name: string) =>
  Schema.Config(name, Schema.String.pipe(Schema.minLength(2)));

export class DbConfig extends Effect.Service<DbConfig>()(
  '@nikelborm/DbConfig',
  {
    effect: Config.all({
      host: ConfigStringWithMinLength2('DATABASE_HOST'),
      port: Config.port('DATABASE_PORT'),
      username: ConfigStringWithMinLength2('DATABASE_USERNAME'),
      password: Config.redacted('DATABASE_PASSWORD'),
      database: ConfigStringWithMinLength2('DATABASE_NAME'),
      ssl: Config.succeed(false),
    }).pipe(
      Effect.map(db => ({ db })),
      Effect.orDie,
    ),
  },
) {}

////////////////////////////////////////////////////////////////////////////////

export const AppConfigLive = Layer.mergeAll(
  EnvType.Live,
  BackendPort.Live,
  BackendExternallyAvailableAtURL.Live,
  OpenTelemetryProcessingURL.Default,
  BetterAuthSecret.Default,
  DbConfig.Default,
);
