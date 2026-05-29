import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  decodePatternIndexSync,
  type PatternIndexUnion,
} from '../audioAssetHelpers.ts'
import { Pattern } from '../brandsAndDatas/Pattern.ts'

const patternLabels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as const

const mapIndexToPattern = (index: PatternIndexUnion) =>
  new Pattern(patternLabels[index], index) as AllPatternUnion

const allPatterns = patternLabels.map(
  Pattern.makeUnsafe,
) as unknown as AllPatternTuple

// TODO: make currentPatternIndexRef and related shit branded
export class PatternRegistry
  extends Effect.Service<PatternRegistry>()('next-midi-demo/PatternRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentPatternIndexRef = yield* SubscriptionRef.make<
        Option.Option<PatternIndexUnion>
      >(Option.none())

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
        switchPattern: (patternIndex: PatternIndexUnion) => {
          const trustedIndex = decodePatternIndexSync(patternIndex)

          return SubscriptionRef.update(
            currentPatternIndexRef,
            Option.match({
              onNone: () => Option.some(trustedIndex),
              onSome: prevPatternIndex =>
                prevPatternIndex === trustedIndex
                  ? Option.none()
                  : Option.some(trustedIndex),
            }),
          )
        },
        getPatternByIndex: (patternIndex: PatternIndexUnion) =>
          allPatterns[decodePatternIndexSync(patternIndex)],
      }
    }),
  })
  implements IPatternRegistry {}

interface IPatternRegistry {
  readonly currentlySelectedPattern: Effect.Effect<
    Option.Option<AllPatternUnion>
  >
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly selectedPatternChanges: Stream.Stream<Option.Option<AllPatternUnion>>
  readonly switchPattern: (
    patternIndex: PatternIndexUnion,
  ) => Effect.Effect<void>
}

type _AllPatternTuple<Labels extends readonly string[] = typeof patternLabels> =
  Labels extends readonly [
    ...infer RestLabels extends readonly string[],
    infer CurrLabel extends string,
  ]
    ? readonly [
        ..._AllPatternTuple<RestLabels>,
        Pattern<CurrLabel, Extract<RestLabels['length'], PatternIndexUnion>>,
      ]
    : readonly []

export type AllPatternTuple = _AllPatternTuple

export type AllPatternUnion = AllPatternTuple[number]
