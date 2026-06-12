import * as Chunk from 'effect/Chunk'
import { dual } from 'effect/Function'
import * as HashSet from 'effect/HashSet'
import type * as Order from 'effect/Order'
import * as Predicate from 'effect/Predicate'
import * as SortedSet from 'effect/SortedSet'
import * as Stream from 'effect/Stream'

const isStream = (u: unknown): u is Stream.Stream<any> =>
  Predicate.hasProperty(u, Stream.StreamTypeId)

export const dedupStreamSorted: {
  <A, E, R, Key>(
    order: Order.Order<Key>,
    getKey: (a: NoInfer<A>) => Key,
  ): (self: Stream.Stream<A, E, R>) => Stream.Stream<A, E, R>
  <A, E, R>(
    order: Order.Order<NoInfer<A>>,
  ): (self: Stream.Stream<A, E, R>) => Stream.Stream<A, E, R>
  <A, E, R, Key>(
    self: Stream.Stream<A, E, R>,
    order: Order.Order<Key>,
    getKey: (a: NoInfer<A>) => Key,
  ): Stream.Stream<A, E, R>
  <A, E, R>(
    self: Stream.Stream<A, E, R>,
    order: Order.Order<NoInfer<A>>,
  ): Stream.Stream<A, E, R>
} = dual(
  args => isStream(args[0]),
  (self, order, getKey) =>
    self.pipe(
      Stream.mapAccum(
        SortedSet.empty(order),
        (previouslyAccumulatedSortedSet, currentValue) => {
          const potentiallyExtendedSortedSet = SortedSet.add(
            previouslyAccumulatedSortedSet,
            getKey ? getKey(currentValue) : currentValue,
          )

          return [
            potentiallyExtendedSortedSet,
            [currentValue, potentiallyExtendedSortedSet] satisfies [any, any],
          ]
        },
      ),
      Stream.changesWith(([, set1], [, set2]) => set1 === set2),
      Stream.map(([v]) => v),
    ),
)

// TODO: add support for getKey and dual

/**
 * Expected something that could be fed to hashset like Datas or primitives
 */
export const dedupStreamHashedSimple = <A, E, R>(
  self: Stream.Stream<A, E, R>,
) =>
  self.pipe(
    Stream.mapAccum(HashSet.empty<A>(), (alreadyEmitted, value) =>
      HashSet.has(alreadyEmitted, value)
        ? [alreadyEmitted, Chunk.empty<A>()]
        : [HashSet.add(alreadyEmitted, value), Chunk.make(value)],
    ),
    Stream.flattenChunks,
  )
