import {
  AppConfigLive,
  BackendExternallyAvailableAtURL,
  BackendPort,
  EnvType,
} from '@evadev/backend-config'
import { API } from '@trellisform/api'
import {
  type UserWithSessionDecoded,
  UserWithSessionMiddleware,
} from '@trellisform/api/auth.ts'
import {
  AuthHttpGroupLive,
  BetterAuth,
  EffectlessDrizzleAuthDbService,
  UserWithSessionMiddlewareLive,
} from '@trellisform/backend-better-auth-service'

import {
  HttpApiBuilder,
  HttpApiScalar,
  HttpMiddleware,
  HttpServerRequest,
  OpenApi,
} from '@effect/platform'
import { BunFileSystem, BunHttpServer, BunRuntime } from '@effect/platform-bun'
import { Effect, flow, Layer, Logger, Option, pipe } from 'effect'

import { AbstractAnswerOptionHttpGroupLive } from './services/abstractAnswerOption/Http.ts'
import { AbstractQuestionHttpGroupLive } from './services/abstractQuestion/Http.ts'
import { AbstractTestHttpGroupLive } from './services/abstractTest/Http.ts'
import { EducationalSpaceHttpGroupLive } from './services/educationalSpace/Http.ts'
import { Database } from './services/infrastructure/Database.ts'
import { TracingLive } from './services/infrastructure/Tracing.ts'
import { TestVariantAttemptHttpGroupLive } from './services/testVariantAttempt/Http.ts'

const HttpApiGroupsLive = Layer.mergeAll(
  // HealthHttpGroupLive,
  AuthHttpGroupLive,
  AbstractQuestionHttpGroupLive,
  AbstractTestHttpGroupLive,
  EducationalSpaceHttpGroupLive,
  TestVariantAttemptHttpGroupLive,
  AbstractAnswerOptionHttpGroupLive,
)

const ApiLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const envType = yield* EnvType
    const externallyAvailableAtURL = yield* BackendExternallyAvailableAtURL

    if (envType !== 'development')
      return HttpApiBuilder.api(API).pipe(
        Layer.provide(UserWithSessionMiddlewareLive),
      )

    const AnnotatedAPI = API.annotate(OpenApi.Servers, [
      { url: externallyAvailableAtURL.toString() },
    ])
      .annotate(OpenApi.Title, 'Trellisform Backend API')
      .annotate(OpenApi.Description, '🤡')

    const OpenApiDocsLayer = Layer.mergeAll(
      HttpApiBuilder.middlewareOpenApi({ path: '/api/docs/openapi.json' }),
      HttpApiScalar.layer({ path: '/api/docs', scalar: { layout: 'classic' } }),
      Layer.effectDiscard(
        Effect.log(
          `API docs are available at ${externallyAvailableAtURL.toString()}api/docs/`,
        ),
      ),
    )

    const auth = yield* BetterAuth
    // this fake user won't be used anyway, since documentation API doesn't require authentication
    const FakeUserEffect = () =>
      Effect.succeed({} as unknown as UserWithSessionDecoded)

    const UserWithSessionMiddlewareWithMocks = pipe(
      Effect.all([
        UserWithSessionMiddleware,
        Effect.map(
          HttpServerRequest.HttpServerRequest,
          req => () => req.url.startsWith('/api/docs'),
        ),
      ]),
      Effect.flatMap(args => Effect.catchIf(...args, FakeUserEffect)),
      Effect.provide(UserWithSessionMiddlewareLive),
      Effect.provideService(BetterAuth, auth),
      mw => Layer.sync(UserWithSessionMiddleware, () => mw),
    )

    return OpenApiDocsLayer.pipe(
      Layer.provideMerge(HttpApiBuilder.api(AnnotatedAPI)),
      Layer.provide(UserWithSessionMiddlewareWithMocks),
    )
  }),
).pipe(Layer.provide([HttpApiGroupsLive]))

const ForceColorsPrettyLogger = Logger.prettyLogger({
  colors: true,
  mode: 'tty',
})

const ForceColorInDevPrettyLogger = Logger.replaceEffect(
  Logger.prettyLoggerDefault,
  EnvType.use(env =>
    env === 'development' ? ForceColorsPrettyLogger : Logger.defaultLogger,
  ),
)

const OptionalDevToolsLayer = Layer.unwrapEffect(
  EnvType.use(
    Effect.fn(function* (env) {
      if (env !== 'development') return Layer.empty

      const DevTools = yield* Effect.tryPromise(
        () => import('@effect/experimental/DevTools'),
      ).pipe(Effect.option)

      if (Option.isSome(DevTools))
        return DevTools.value.layer('ws://host.docker.internal:34437')

      yield* Effect.logWarning(
        'Failed to dynamically import DevTools from `@effect/experimental` in development mode. Is it installed?',
      )

      return Layer.empty
    }),
  ),
)

const ServerLayer = Layer.unwrapEffect(
  BackendPort.use(port => BunHttpServer.layer({ port })),
)

const HttpLive = HttpApiBuilder.serve(
  flow(HttpMiddleware.logger, HttpMiddleware.xForwardedHeaders),
).pipe(
  // It's important to provide devtools before tracing according to vs code effect dev tools plugin readme
  Layer.provide(OptionalDevToolsLayer),
  Layer.provide(ApiLive),
  Layer.provide([
    ServerLayer,
    TracingLive,
    ForceColorInDevPrettyLogger,
    Database.Client,
    Layer.provide(BetterAuth.Default, EffectlessDrizzleAuthDbService.Default),
    HttpApiBuilder.middlewareCors(),
  ]),
  Layer.provide(AppConfigLive),
  Layer.provide(BunFileSystem.layer),
)

BunRuntime.runMain(Layer.launch(HttpLive))
