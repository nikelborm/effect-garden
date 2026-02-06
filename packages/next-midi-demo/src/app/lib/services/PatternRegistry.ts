import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  PatternIndexSchema,
  type RecordedPatternIndexes,
} from '../audioAssetHelpers.ts'

const patternLabels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as const

export class Pattern<
  Label extends string = string,
  Index extends number = number,
> extends Data.TaggedClass('Pattern')<{
  readonly label: Label
  readonly index: Index
}> {
  constructor(label: Label, index: Index) {
    super({ label, index })
  }

  static models = (p: unknown): p is Pattern =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Pattern'
}

const mapIndexToPattern = (index: RecordedPatternIndexes) =>
  new Pattern(patternLabels[index], index) as AllPatternUnion

const allPatterns = patternLabels.map(
  (label, index) => new Pattern(label, index),
) as unknown as AllPatternTuple

export class PatternRegistry
  extends Effect.Service<PatternRegistry>()('next-midi-demo/PatternRegistry', {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<RecordedPatternIndexes>(0),
      currentPatternIndexRef => ({
        currentlyActivePattern: Effect.map(
          SubscriptionRef.get(currentPatternIndexRef),
          mapIndexToPattern,
        ),
        allPatterns: Effect.succeed(allPatterns),
        activePatternChanges: Stream.map(
          currentPatternIndexRef.changes,
          mapIndexToPattern,
        ),
        setActivePattern: (patternIndex: RecordedPatternIndexes) => {
          const trustedIndex =
            Schema.decodeSync(PatternIndexSchema)(patternIndex)
          return SubscriptionRef.set(currentPatternIndexRef, trustedIndex)
        },
      }),
    ),
  })
  implements IPatternRegistry {}

interface IPatternRegistry {
  readonly currentlyActivePattern: Effect.Effect<AllPatternUnion>
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly activePatternChanges: Stream.Stream<AllPatternUnion>
  readonly setActivePattern: (
    patternIndex: RecordedPatternIndexes,
  ) => Effect.Effect<void>
}

type _AllPatternTuple<Labels extends readonly string[] = typeof patternLabels> =
  Labels extends readonly [
    ...infer RestLabels extends readonly string[],
    infer CurrLabel extends string,
  ]
    ? readonly [
        ..._AllPatternTuple<RestLabels>,
        Pattern<CurrLabel, RestLabels['length']>,
      ]
    : readonly []

export type AllPatternTuple = _AllPatternTuple

export type AllPatternUnion = AllPatternTuple[number]

export const PatternOrderByIndex = Order.mapInput(
  Order.number,
  (pattern: Pattern) => pattern.index,
)
