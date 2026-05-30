import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AllPatternTuple,
  type AllPatternUnion,
  allPatterns,
  mapIndexToPattern,
  type PatternIndex,
} from '../brandsAndDatas/Pattern.ts'

// TODO: make currentPatternIndexRef and related shit branded
export class PatternRegistry
  extends Effect.Service<PatternRegistry>()('next-midi-demo/PatternRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentPatternIndexRef = yield* SubscriptionRef.make(
        Option.none<PatternIndex>(),
      )

      const selectedPatternChanges = yield* currentPatternIndexRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.map(Option.map(mapIndexToPattern)),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedPattern: Effect.map(
          currentPatternIndexRef.get,
          Option.map(mapIndexToPattern),
        ),
        allPatterns: Effect.succeed(allPatterns),
        selectedPatternChanges,
        switchPattern: (patternIndex: PatternIndex) =>
          SubscriptionRef.update(
            currentPatternIndexRef,
            Option.match({
              onNone: () => Option.some(patternIndex),
              onSome: prevPatternIndex =>
                prevPatternIndex === patternIndex
                  ? Option.none()
                  : Option.some(patternIndex),
            }),
          ),
      }
    }),
  })
  implements IPatternRegistry {}

export interface IPatternRegistry {
  readonly currentlySelectedPattern: Effect.Effect<
    Option.Option<AllPatternUnion>
  >
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly selectedPatternChanges: Stream.Stream<Option.Option<AllPatternUnion>>
  readonly switchPattern: (patternIndex: PatternIndex) => Effect.Effect<void>
}
