import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import type { PatternIndexUnion } from '../audioAssetHelpers.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export type PatternIndex = Brand.Branded<
  PatternIndexUnion,
  'PatternIndex: integer in range 0...7'
>

export const PatternIndex = Brand.refined<PatternIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n =>
    Brand.error(
      `Expected ${JSON.stringify(n)} to be an integer in range 0...7`,
    ),
) as {
  (i: number): PatternIndex
  option(i: number): Option.Option<PatternIndex>
  either(i: number): Either.Either<PatternIndex, Brand.Brand.BrandErrors>
  is(i: number): i is PatternIndex
}

export class PatternIndexData extends Data.TaggedClass(
  'next-midi-demo/PatternIndex',
)<{ index: PatternIndex }> {
  constructor(index: PatternIndex) {
    super({ index })
  }

  static makeUnsafe = (index: number) => new this(PatternIndex(index))
  static models = (aid: unknown) => aid instanceof this
}

export class PatternParamButtonData extends ParamButtonIdData<PatternIndexData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof PatternParamButtonData>()(PatternIndexData)

  static makeUnsafe = (index: number) =>
    new this(PatternIndexData.makeUnsafe(index))
}

export class Pattern<
  const TLabel extends string = string,
  TIndex extends PatternIndexUnion = PatternIndexUnion,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  label: TLabel
  index: PatternIndex
}> {
  constructor(label: TLabel, index: TIndex) {
    super({ label, index: PatternIndex(index) })
  }

  static makeUnsafe = <const TLabel extends string = string>(
    label: TLabel,
    index: number,
  ) => new Pattern(label, index as PatternIndexUnion)

  static models = (p: unknown): p is Pattern => p instanceof Pattern
}
