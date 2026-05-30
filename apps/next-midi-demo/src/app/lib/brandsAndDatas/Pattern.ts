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

export const patternsRawBase = [
  'P1',
  'P2',
  'P3',
  'P4',
  'P5',
  'P6',
  'P7',
  'P8',
] as const

export const patternIndicies = []

export type Pattern = Distribute<Brand.Branded<PatternUnion, 'Pattern'>>

export const Pattern = Brand.refined<Pattern>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n =>
    Brand.error(
      `Expected ${JSON.stringify(n)} to be an integer in range 0...7`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (i: number): Pattern
  option(i: number): PatternOption
  either(i: number): Either.Either<Pattern, Brand.Brand.BrandErrors>
  is(i: number): i is Pattern
}

export const defaultPattern = Pattern(patternsRawBase[0])

export type PatternOption = Option.Option<Pattern>

export class PatternData extends Data.TaggedClass('next-midi-demo/Pattern')<{
  index: Pattern
}> {
  constructor(index: Pattern) {
    super({ index })
  }

  static makeUnsafe = (index: number) => new this(Pattern(index))
  static models = (aid: unknown) => aid instanceof this
}

export class PatternParamButtonData extends ParamButtonIdData<PatternData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof PatternParamButtonData>()(PatternData)

  static makeUnsafe = (index: number) => new this(PatternData.makeUnsafe(index))
  static make = (index: Pattern) => new this(new PatternData(index))
}

export class Pattern<
  const TLabel extends string = string,
  TIndex extends Pattern = Pattern,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  label: TLabel
  index: TIndex
}> {
  static models = (p: unknown): p is Pattern => p instanceof Pattern
}

export const PatternSchema = Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7).pipe(
  Schema.fromBrand(Pattern),
)
export type PatternUnion = TupleIndices<typeof patternsRawBase>

export const allPatterns = patternsRawBase.map(
  (body, index) => new Pattern({ ...body, index: Pattern(index) }),
) as unknown as AllPatternTuple

export type UnbrandedPattern<TIndex extends Pattern> =
  Brand.Brand.Unbranded<TIndex>

export const UnbrandedPattern = <TIndex extends Pattern>(index: TIndex) =>
  index as UnbrandedPattern<TIndex>

export const patternSomeSet = new Set(
  Iterable.append(
    Iterable.map([0, 1, 2, 3, 4, 5, 6, 7] as const, Option.some),
    Option.none<Pattern>(),
  ),
)

// TODO: type AllPatternTuple
export type AllPatternTuple = any
