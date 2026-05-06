import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'

import type { RecordedPatternIndexes } from '../audioAssetHelpers.ts'

export type PatternIndex<
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> = Brand.Branded<Index, 'PatternIndex: integer in range 0-7'>
export const PatternIndex = Brand.refined<PatternIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0-7`),
)

export class PatternIndexData<
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> extends Data.TaggedClass('next-midi-demo/PatternIndex')<{
  value: PatternIndex<Index>
}> {
  constructor(index: Index) {
    super({ value: PatternIndex(index) as PatternIndex<Index> })
  }
  static makeUnsafe = (index: number) =>
    new PatternIndexData(index as RecordedPatternIndexes)
}

export class Pattern<
  Label extends string = string,
  Index extends RecordedPatternIndexes = RecordedPatternIndexes,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  readonly label: Label
  readonly index: PatternIndex<Index>
}> {
  constructor(label: Label, index: Index) {
    super({ label, index: PatternIndex(index) as PatternIndex<Index> })
  }

  static models = (p: unknown): p is Pattern =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Pattern'
}
