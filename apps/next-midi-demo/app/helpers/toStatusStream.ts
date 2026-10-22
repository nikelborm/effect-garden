import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

export interface StatusStream extends Stream.Stream<'completed' | 'started'> {}

export const toStatusStream = <A, E>(
  deferred: Deferred.Deferred<A, E>,
): StatusStream =>
  Deferred.poll(deferred).pipe(
    Effect.mapEager(
      Option.match({
        onNone: () =>
          Stream.concat(
            Stream.make('started'),
            Deferred.await(deferred).pipe(
              Effect.exit,
              Stream.fromEffectDrain,
              Stream.as('completed' as const),
            ),
          ),
        onSome: () => Stream.make('completed' as const),
      }),
    ),
    Stream.unwrap,
  )
