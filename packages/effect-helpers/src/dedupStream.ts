import * as HashSet from 'effect/HashSet'
import * as Stream from 'effect/Stream'

/**
 * Expected something that could be fed to hashset like Datas or primitives
 */
export const dedupStreamWithHashSet = <A, E, R>(self: Stream.Stream<A, E, R>) =>
  Stream.mapAccum(
    self,
    () => HashSet.empty<A>(),
    (alreadyEmitted, value) =>
      HashSet.has(alreadyEmitted, value)
        ? [alreadyEmitted, [] as Array<A>]
        : [HashSet.add(alreadyEmitted, value), [value]],
  )

export const dedupStreamWithExternalSet =
  <A>(set: Set<A>) =>
  <E, R>(self: Stream.Stream<A, E, R>) =>
    Stream.mapAccum(
      self,
      () => set,
      (alreadyEmitted, value) =>
        alreadyEmitted.has(value)
          ? [alreadyEmitted, [] as Array<A>]
          : [alreadyEmitted.add(value), [value]],
    )

export const dedupStreamWithSet = <A, E, R>(self: Stream.Stream<A, E, R>) =>
  dedupStreamWithExternalSet(new Set<A>())(self)
