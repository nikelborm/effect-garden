import { Console, Order, Predicate, SortedSet, Stream } from 'effect';
import { dual } from 'effect/Function';

const isStream = (u: unknown): u is Stream.Stream<any> =>
  Predicate.hasProperty(u, Stream.StreamTypeId);

export const withUniqueStreamValues: {
  <A, E, R, Key>(
    order: Order.Order<Key>,
    getKey: (a: NoInfer<A>) => Key
  ): (self: Stream.Stream<A, E, R>) => Stream.Stream<A, E, R>;
  <A, E, R>(
    order: Order.Order<NoInfer<A>>
  ): (self: Stream.Stream<A, E, R>) => Stream.Stream<A, E, R>;
  <A, E, R, Key>(
    self: Stream.Stream<A, E, R>,
    order: Order.Order<Key>,
    getKey: (a: NoInfer<A>) => Key
  ): Stream.Stream<A, E, R>;
  <A, E, R>(
    self: Stream.Stream<A, E, R>,
    order: Order.Order<NoInfer<A>>
  ): Stream.Stream<A, E, R>;
} = dual(
  (args) => isStream(args[0]),
  (self, order, getKey) =>
    self.pipe(
      Stream.mapAccum(
        SortedSet.empty(order),
        (previouslyAccumulatedSortedSet, currentValue) => {
          const potentiallyExtendedSortedSet = SortedSet.add(
            previouslyAccumulatedSortedSet,
            getKey ? getKey(currentValue) : currentValue
          );

          return [
            potentiallyExtendedSortedSet,
            [currentValue, potentiallyExtendedSortedSet] satisfies [any, any],
          ];
        }
      ),
      Stream.changesWith(([, set1], [, set2]) => set1 === set2),
      Stream.map(([v]) => v)
    )
);
