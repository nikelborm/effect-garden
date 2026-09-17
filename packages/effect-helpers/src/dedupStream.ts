import * as HashSet from 'effect/HashSet'
import * as Stream from 'effect/Stream'

/**
 * Expected something that could be fed to hashset like Datas or primitives
 */
export const dedupStreamHashedSimple = <A, E, R>(
  self: Stream.Stream<A, E, R>,
) =>
  self.pipe(
    Stream.mapAccum(
      () => HashSet.empty<A>(),
      (alreadyEmitted, value) =>
        HashSet.has(alreadyEmitted, value)
          ? [alreadyEmitted, [] as Array<A>]
          : [HashSet.add(alreadyEmitted, value), [value]],
    ),
  )
