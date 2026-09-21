import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as HttpServerRequest from 'effect/unstable/http/HttpServerRequest'

const cache = new WeakMap<
  HttpServerRequest.HttpServerRequest,
  Map<string, Deferred.Deferred<any, any>>
>()

/**
 * Taken from discord thread: {@linkplain https://discord.com/channels/795981131316985866/1425658314242527332 Dedupe services methods calls in HttpApi}
 *
 * @author Tim Smart
 * @example
 * ```ts
 * const cachedNumber: Effect.Effect<
 *   number,
 *   never,
 *   HttpServerRequest.HttpServerRequest
 * > = Effect.succeed(123).pipe(
 *   withHttpRequestCache("my-number")
 * )
 * ```
 */
export const withCacheScopedPerHttpRequest =
  (key: string) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.flatMap(
      Effect.context<HttpServerRequest.HttpServerRequest>(),
      ctx => {
        const request = Context.getUnsafe(
          ctx,
          HttpServerRequest.HttpServerRequest,
        )
        let requestCache = cache.get(request)
        const cached = requestCache?.get(key) as
          | Deferred.Deferred<A, E>
          | undefined
        if (cached) return Deferred.await(cached)
        if (!requestCache) {
          requestCache = new Map()
          cache.set(request, requestCache)
        }
        return Effect.flatMap(Deferred.make<A, E>(), deferred => {
          requestCache.set(key, deferred)
          return Effect.onExit(effect, exit => Deferred.done(deferred, exit))
        })
      },
    )
