import { HttpServerRequest } from '@effect/platform';
import { Context, Deferred, Effect } from 'effect';

const cache = new WeakMap<
  HttpServerRequest.HttpServerRequest,
  Map<string, Deferred.Deferred<any, any>>
>();

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
    Effect.withFiberRuntime<A, E, R | HttpServerRequest.HttpServerRequest>(
      (fiber) => {
        const request = Context.unsafeGet(
          fiber.currentContext,
          HttpServerRequest.HttpServerRequest
        );
        let requestCache = cache.get(request);
        let deferred = requestCache?.get(key);
        if (deferred) {
          return Deferred.await(deferred);
        } else if (!requestCache) {
          requestCache = new Map();
          cache.set(request, requestCache);
        }
        deferred = Deferred.unsafeMake<E, R>(fiber.id());
        requestCache.set(key, deferred);
        return Effect.onExit(effect, (exit) => Deferred.done(deferred, exit));
      }
    );
