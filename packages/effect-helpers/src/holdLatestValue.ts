import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

/**
 * Converts a stream into a "Hot" stream that caches the latest value.
 * New subscribers will immediately receive the most recent value emitted.
 */
export const holdLatestValue = Effect.fnUntraced(function* <A, E, R>(
  self: Stream.Stream<A, E, R>,
) {
  const storage = yield* SubscriptionRef.make<Option.Option<A>>(Option.none())

  yield* self.pipe(
    Stream.tap(a => SubscriptionRef.set(storage, Option.some(a))),
    Stream.runDrain,
    Effect.forkIn(yield* Effect.scope),
  )

  return SubscriptionRef.changes(storage).pipe(
    Stream.filter(Option.isSome),
    Stream.map(Option.getOrThrow),
  )
})
