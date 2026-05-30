import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  type AllPatternTuple,
  allPatterns,
  type Pattern,
  type PatternOption,
} from '../brandsAndDatas/Pattern.ts'

export class PatternRegistry
  extends Effect.Service<PatternRegistry>()('next-midi-demo/PatternRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentPatternRef = yield* SubscriptionRef.make(
        Option.none<Pattern>(),
      )

      const selectedPatternChanges = yield* currentPatternRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedPattern: currentPatternRef.get,
        allPatterns: Effect.succeed(allPatterns),
        selectedPatternChanges,
        switchPattern: (pattern: Pattern) =>
          SubscriptionRef.update(
            currentPatternRef,
            Option.match({
              onNone: () => Option.some(pattern),
              onSome: prevPattern =>
                prevPattern === pattern ? Option.none() : Option.some(pattern),
            }),
          ),
      }
    }),
  })
  implements IPatternRegistry {}

export interface IPatternRegistry {
  readonly currentlySelectedPattern: Effect.Effect<PatternOption>
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly selectedPatternChanges: Stream.Stream<PatternOption>
  readonly switchPattern: (pattern: Pattern) => Effect.Effect<void>
}
