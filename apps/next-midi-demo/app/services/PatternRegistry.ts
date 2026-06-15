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
        currentlySelectedPattern: currentPatternRef,
        allPatterns: Effect.succeed(allPatterns),
        selectedPatternChanges,
        assertIsNone: Effect.filterOrDieMessage(
          currentPatternRef,
          Option.isNone,
          'Assertion failed: expected pattern to be not selected',
        ).pipe(Effect.asVoid),
        getSomeOrDie: Effect.flatMap(currentPatternRef, patternOption =>
          Option.isSome(patternOption)
            ? Effect.succeed(patternOption.value)
            : Effect.dieMessage(
                'Assertion failed: expected pattern to be selected',
              ),
        ),
        switchPattern: (pattern: Pattern) =>
          SubscriptionRef.update(
            currentPatternRef,
            Option.match({
              onNone: () => Option.some(pattern),
              onSome: prevPattern =>
                prevPattern === pattern ? Option.none() : Option.some(pattern),
            }),
          ),
        replaceNoneOrDieIfPresent: (pattern: Pattern) =>
          SubscriptionRef.updateEffect(
            currentPatternRef,
            Option.match({
              onNone: () => Effect.succeedSome(pattern),
              onSome: prevPattern =>
                Effect.dieMessage(
                  `Assertion failed: Expected pattern to be None and got Some("${prevPattern}") instead`,
                ),
            }),
          ),
      }
    }).pipe(Effect.withSpan('PatternRegistry.init')),
  })
  implements IPatternRegistry {}

export interface IPatternRegistry {
  readonly currentlySelectedPattern: Effect.Effect<PatternOption>
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly selectedPatternChanges: Stream.Stream<PatternOption>
  readonly switchPattern: (pattern: Pattern) => Effect.Effect<void>
  readonly getSomeOrDie: Effect.Effect<Pattern>
  readonly assertIsNone: Effect.Effect<void>
  readonly replaceNoneOrDieIfPresent: (pattern: Pattern) => Effect.Effect<void>
}
