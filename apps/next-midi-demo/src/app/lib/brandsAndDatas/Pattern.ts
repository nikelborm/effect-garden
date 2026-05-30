import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const patternsRawBase = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

export type AllPatternTuple = BrandifyTuple<Pattern, typeof patternsRawBase>
export const allPatterns = patternsRawBase as AllPatternTuple

export const patternSet = new Set(allPatterns)

export type Pattern = Distribute<
  Brand.Branded<(typeof patternsRawBase)[number], 'Pattern'>
>

export const Pattern = Brand.refined<Pattern>(
  patternCandidate => patternSet.has(patternCandidate as any),
  notPattern =>
    Brand.error(
      `Expected ${JSON.stringify(notPattern)} to be a valid pattern label`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (p: unknown): Pattern
  option(p: unknown): PatternOption
  either(p: unknown): Either.Either<Pattern, Brand.Brand.BrandErrors>
  is(p: unknown): p is Pattern
}

export const defaultPattern = Pattern(patternsRawBase[0])

export type PatternOption = Option.Option<Pattern>

export class PatternData<
  const TPattern extends Pattern = Pattern,
> extends Data.TaggedClass('next-midi-demo/Pattern')<{
  pattern: TPattern
}> {
  constructor(pattern: TPattern) {
    super({ pattern })
  }
  static makeUnsafe = (patternCandidate: string) =>
    new this(Pattern(patternCandidate))
  static models = (candidate: unknown): candidate is PatternData =>
    candidate instanceof this
}

export class PatternParamButtonData extends ParamButtonIdData<PatternData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof PatternParamButtonData>()(PatternData)

  static makeUnsafe = (patternCandidate: string) =>
    new this(PatternData.makeUnsafe(patternCandidate))
  static make = <const TPattern extends Pattern = Pattern>(pattern: TPattern) =>
    new this(new PatternData(pattern))
}

export const PatternSchema = Schema.Literal(...patternsRawBase)
  .annotations({ title: 'Pattern' })
  .pipe(Schema.fromBrand(Pattern))

export type UnbrandedPattern<TPattern extends Pattern> =
  Brand.Brand.Unbranded<TPattern>

export const UnbrandedPattern = <TPattern extends Pattern>(pattern: TPattern) =>
  pattern as UnbrandedPattern<TPattern>

export const patternSomeSet: Set<PatternOption> = new Set(
  Iterable.append(
    Iterable.map(allPatterns, Option.some),
    Option.none<Pattern>(),
  ),
)
