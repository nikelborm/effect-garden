// God bless @NotLuksus and his https://github.com/NotLuksus/sphericon-chat

import {
  BackendExternallyAvailableAtURL,
  BetterAuthSecret,
  DbConfig,
} from '@evadev/backend-config'
import { API } from '@trellisform/api'
import {
  BetterAuthApiError,
  decodeUserWithSession,
  UserWithSessionMiddleware,
} from '@trellisform/api/auth.ts'
import { account, session, user } from '@trellisform/database/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// import { createServer } from 'node:http';
import {
  HttpApiBuilder,
  HttpApiSecurity,
  HttpServerRequest,
  HttpServerResponse,
} from '@effect/platform'
import { Unauthorized } from '@effect/platform/HttpApiError'
import { BunHttpServerRequest } from '@effect/platform-bun'
import { Context, Effect, Layer, Redacted, Runtime, Schema } from 'effect'

// Other implementations
// https://github.com/search?type=code&q=%2F%5B%27%22%5Dbetter-auth%5B%27%22%5C%2F%5D%2F+AND+%2F%5B%27%22%5D%40%3Feffect%5B%27%22%5C%2F%5D%2F+AND+language%3ATypeScript

export class GetSessionError extends Schema.TaggedError<GetSessionError>(
  'GetSessionError',
)('GetSessionError', {
  message: Schema.String,
}) {}

// Create a separate Drizzle database tag for better-auth
export class AuthDb extends Context.Tag('@app/AuthDb')<AuthDb, any>() {}

export class EffectlessDrizzleAuthDbService extends Effect.Service<EffectlessDrizzleAuthDbService>()(
  '@trellisform/EffectlessDrizzleAuthDbService',
  {
    scoped: Effect.gen(function* () {
      const {
        db: { password, ...dbConfig },
      } = yield* DbConfig

      const authDbSchema = { user, account, session }

      const postgresClient = yield* Effect.acquireRelease(
        Effect.sync(() =>
          postgres({
            ...dbConfig,
            password: Redacted.value(password),
            idle_timeout: 0,
            // https://discord.com/channels/795981131316985866/1418585968746692860/1418737002219835402
            // types: {
            //   // timestamp without timezone (OID 1114)
            //   1114: {
            //     from: [1114],
            //     to: 1114,
            //     serialize: (x: string) => {
            //       console.log('serialize x 1114', x);
            //       return x;
            //     },
            //     parse: (x: string) => {
            //       console.log('parse x 1114', x);
            //       return x;
            //     },
            //   },
            //   // timestamp with timezone (OID 1184)
            //   1184: {
            //     from: [1184],
            //     to: 1184,
            //     serialize: (x: string) => {
            //       console.log('serialize x 1184', x);
            //       return x;
            //     },
            //     parse: (x: string) => {
            //       console.log('parse x 1184', x);
            //       return x;
            //     },
            //   },
            //   // date (OID 1082)
            //   1082: {
            //     from: [1082],
            //     to: 1082,
            //     serialize: (x: string) => {
            //       console.log('serialize x 1082', x);
            //       return x;
            //     },
            //     parse: (x: string) => {
            //       console.log('parse x 1082', x);
            //       return x;
            //     },
            //   },
            // },

            connect_timeout: 0,
          }),
        ),
        client => Effect.promise(() => client.end()),
      )

      console.log('dbConfig:', dbConfig)

      const res = yield* Effect.tryPromise({
        try: () => postgresClient`select * from public.abstract_test_variant;`,
        catch: errr => errr,
      }).pipe(Effect.either)

      console.log({ res })

      const effectlessDrizzleAuthDbInstance = drizzle(postgresClient, {
        casing: 'snake_case',
      })

      return {
        effectlessDrizzleAuthDbInstance,
        authDbSchema,
      }
    }),
  },
) {}

export class BetterAuth extends Effect.Service<BetterAuth>()(
  '@app/BetterAuth',
  {
    effect: Effect.gen(function* () {
      // Get the separate Drizzle database instance for auth
      const { authDbSchema, effectlessDrizzleAuthDbInstance } =
        yield* EffectlessDrizzleAuthDbService

      const externallyAvailableAtURL = yield* BackendExternallyAvailableAtURL
      const { secret } = yield* BetterAuthSecret

      const auth = betterAuth({
        baseURL: externallyAvailableAtURL.toString(),
        database: drizzleAdapter(effectlessDrizzleAuthDbInstance, {
          provider: 'pg',
          schema: authDbSchema,
          // debugLogs: true,
        }),
        emailAndPassword: {
          enabled: true,
        },
        secret: Redacted.value(secret),
        user: {
          fields: {
            name: 'howToAddressMe',
            emailVerified: 'isEmailVerified',
            image: 'avatar',
          },
          additionalFields: {
            fastId: {
              type: 'number',
              required: false,
              input: true,
              returned: true,
            },
            canCreateEducationalSpaces: {
              type: 'boolean',
              required: true,
              defaultValue: true,
            },
            createdAt: {
              type: 'date',
              required: false,
              input: false,
            },
            updatedAt: {
              type: 'date',
              required: false,
              input: false,
            },
          },
        },
        databaseHooks: {
          user: {
            create: {
              before: async (user, context) => {
                return {
                  data: {
                    ...user,
                    createdAt: user.createdAt.toISOString() as any,
                    updatedAt: user.updatedAt.toISOString() as any,
                  },
                }
              },
              // after: async (user, context) => {
              //   console.log('user create after:', { user, context });
              // },
            },
            update: {
              before: async (user, context) => {
                return { data: user }
              },
              after: async (user, context) => {},
            },
          },
        },

        trustedOrigins: [externallyAvailableAtURL.origin],
        session: {
          expiresIn: 60 * 60 * 24 * 7, // 7 days
          updateAge: 60 * 60 * 24, // 24 hours
        },
        advanced: {
          defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
          },
        },
      })

      const call = <A>(
        f: (client: typeof auth, signal: AbortSignal) => Promise<A>,
      ) =>
        Effect.tryPromise({
          try: signal => f(auth, signal),
          catch: error => {
            console.error('Better-auth API error:', error)
            console.error(
              'Error stack:',
              error instanceof Error ? error.stack : 'No stack trace',
            )
            console.error('Error details:', JSON.stringify(error, null, 2))
            return new BetterAuthApiError({ cause: error })
          },
        })

      const signUp = (email: string, password: string, name: string) =>
        call(auth => auth.api.signUpEmail({ body: { email, password, name } }))

      const signIn = (email: string, password: string) =>
        call(auth => auth.api.signInEmail({ body: { email, password } }))

      const signOut = (headers: Headers = new Headers()) =>
        call(auth => auth.api.signOut({ headers }))

      const getSession = (headers: Headers = new Headers()) =>
        call(auth => auth.api.getSession({ headers }))

      const updateUser = (data: { name?: string; email?: string }) =>
        call(auth => auth.api.updateUser({ body: data }))

      const changePassword = (currentPassword: string, newPassword: string) =>
        call(auth =>
          auth.api.changePassword({
            body: { currentPassword, newPassword },
          }),
        )

      // Server-side helper that automatically gets cookies from Next.js
      const getSessionFromCookies = () =>
        Effect.gen(function* () {
          // Import cookies dynamically to avoid issues in client-side code
          const { cookies } = yield* Effect.tryPromise(
            () => import('next/headers'),
          )
          const cookieStore = yield* Effect.tryPromise(() => cookies())

          // Create Headers object from cookies
          const headers = new Headers()
          cookieStore
            .getAll()
            .forEach((cookie: { name: string; value: string }) => {
              headers.append('cookie', `${cookie.name}=${cookie.value}`)
            })

          return yield* getSession(headers)
        })

      return {
        call,
        auth,
        signUp,
        signIn,
        signOut,
        getSession,
        getSessionFromCookies,
        updateUser,
        changePassword,
      } as const
    }),
  },
) {}

const UserSessionGetter = Effect.map(
  BetterAuth,
  Effect.fn(function* ({ getSession }) {
    const req = yield* HttpServerRequest.HttpServerRequest

    yield* Effect.log('auth middleware started')

    const sessionWithUser = yield* getSession(new Headers(req.headers)).pipe(
      Effect.flatMap(decodeUserWithSession),
      Effect.tapError(Effect.logError),
      Effect.mapError(() => new Unauthorized()),
    )

    yield* Effect.log({
      ...sessionWithUser,
      'req.url': req.url,
      'req.originalUrl': req.originalUrl,
    })

    return sessionWithUser
  }),
)

export const UserWithSessionMiddlewareLive = Layer.effect(
  UserWithSessionMiddleware,
  UserSessionGetter,
)

const betterAuthHandler = Effect.fn('betterAuthHandler')(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest
  const req = BunHttpServerRequest.toRequest(request)
  //    ^ Request

  const { auth } = yield* BetterAuth
  const externallyAvailableAtURL = yield* BackendExternallyAvailableAtURL

  const res = yield* Effect.tryPromise({
    try: () => auth.handler(req),
    catch: cause => new BetterAuthApiError({ cause }),
  }).pipe(Effect.tapError(Effect.logError))

  res.headers.set(
    'Access-Control-Allow-Origin',
    externallyAvailableAtURL.origin,
  )
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  res.headers.set('Access-Control-Allow-Credentials', 'true')

  return HttpServerResponse.raw(res)
})

export const AuthHttpGroupLive = HttpApiBuilder.group(API, 'Auth', handlers =>
  handlers
    .handleRaw('get', betterAuthHandler)
    .handleRaw('post', betterAuthHandler),
)
