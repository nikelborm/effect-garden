import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  decodePatternIndexSync,
  type RecordedPatternIndexes,
} from '../audioAssetHelpers.ts'

const patternLabels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'] as const

export type PatternIndex<
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> = Brand.Branded<Index, 'PatternIndex: integer in range 0-7'>
export const PatternIndex = Brand.refined<PatternIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0-7`),
)

export class PatternIndexData<
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> extends Data.TaggedClass('PatternIndex')<{
  value: PatternIndex<Index>
}> {
  constructor(index: number) {
    super({
      value: PatternIndex(
        index as RecordedPatternIndexes,
      ) as PatternIndex<Index>,
    })
  }
}

export const PatternIndexDataOrder = Order.mapInput(
  Order.number,
  (a: PatternIndexData) => a.value,
)

export class Pattern<
  Label extends string = string,
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> extends Data.TaggedClass('Pattern')<{
  readonly label: Label
  readonly index: PatternIndex<Index>
}> {
  constructor(label: Label, index: Index) {
    super({ label, index: PatternIndex(index) as PatternIndex<Index> })
  }

  static models = (p: unknown): p is Pattern =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Pattern'
}

const mapIndexToPattern = (index: RecordedPatternIndexes) =>
  new Pattern(patternLabels[index], index) as AllPatternUnion

const allPatterns = patternLabels.map(
  (label, index) => new Pattern(label, index as RecordedPatternIndexes),
) as unknown as AllPatternTuple

export class PatternRegistry
  extends Effect.Service<PatternRegistry>()('next-midi-demo/PatternRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentPatternIndexRef =
        yield* SubscriptionRef.make<RecordedPatternIndexes>(0)

      const selectedPatternChanges = yield* currentPatternIndexRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.map(mapIndexToPattern),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedPattern: Effect.map(
          currentPatternIndexRef.get,
          mapIndexToPattern,
        ),
        allPatterns: Effect.succeed(allPatterns),
        selectedPatternChanges,
        selectPattern: (patternIndex: RecordedPatternIndexes) => {
          const trustedIndex = decodePatternIndexSync(patternIndex)

          return SubscriptionRef.set(currentPatternIndexRef, trustedIndex)
        },
        getPatternByIndex: (patternIndex: RecordedPatternIndexes) =>
          allPatterns[decodePatternIndexSync(patternIndex)],
      }
    }),
  })
  implements IPatternRegistry {}

interface IPatternRegistry {
  readonly currentlySelectedPattern: Effect.Effect<AllPatternUnion>
  readonly allPatterns: Effect.Effect<AllPatternTuple>
  readonly selectedPatternChanges: Stream.Stream<AllPatternUnion>
  readonly selectPattern: (
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
        Pattern<
          CurrLabel,
          Extract<RestLabels['length'], RecordedPatternIndexes>
        >,
      ]
    : readonly []

export type AllPatternTuple = _AllPatternTuple

export type AllPatternUnion = AllPatternTuple[number]

export const PatternOrderByIndex = Order.mapInput(
  Order.number,
  (pattern: Pattern) => pattern.index,
)
