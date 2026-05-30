import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import type { TupleIndices } from '../helpers/TupleIndices.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export const patterns = [
  { label: 'P1' },
  { label: 'P2' },
  { label: 'P3' },
  { label: 'P4' },
  { label: 'P5' },
  { label: 'P6' },
  { label: 'P7' },
  { label: 'P8' },
] as const

export const patternIndicies = []

export type PatternIndex = Distribute<
  Brand.Branded<PatternIndexUnion, 'PatternIndex'>
>

export const PatternIndex = Brand.refined<PatternIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n =>
    Brand.error(
      `Expected ${JSON.stringify(n)} to be an integer in range 0...7`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
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
  static make = (index: PatternIndex) => new this(new PatternIndexData(index))
}

export class Pattern<
  const TLabel extends string = string,
  TIndex extends PatternIndex = PatternIndex,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  label: TLabel
  index: TIndex
}> {
  static models = (p: unknown): p is Pattern => p instanceof Pattern
}

export const PatternIndexSchema = Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7).pipe(
  Schema.fromBrand(PatternIndex),
)
export type PatternIndexUnion = TupleIndices<typeof patterns>

export const allPatterns = patterns.map(
  (body, index) => new Pattern({ ...body, index: PatternIndex(index) }),
) as unknown as AllPatternTuple

export const mapIndexToPattern = (index: PatternIndex) =>
  new Pattern({
    ...patterns[UnbrandedPatternIndex(index)],
    index,
  }) as AllPatternUnion

type _AllPatternTuple<
  TPatterns extends readonly { readonly label: string }[] = typeof patterns,
> = TPatterns extends readonly [
  ...infer RestTPatterns extends readonly { readonly label: string }[],
  { readonly label: infer CurrLabel extends string },
]
  ? readonly [
      ..._AllPatternTuple<RestTPatterns>,
      Pattern<CurrLabel, RestTPatterns['length'] & PatternIndex>,
    ]
  : readonly []

export type UnbrandedPatternIndex<TIndex extends PatternIndex> =
  Brand.Brand.Unbranded<TIndex>

export const UnbrandedPatternIndex = <TIndex extends PatternIndex>(
  index: TIndex,
) => index as UnbrandedPatternIndex<TIndex>

export type AllPatternTuple = _AllPatternTuple

export type AllPatternUnion = AllPatternTuple[number]

export const patternIndexSomeSet = new Set(
  Iterable.append(
    Iterable.map([0, 1, 2, 3, 4, 5, 6, 7] as const, Option.some),
    Option.none<PatternIndex>(),
  ),
)
