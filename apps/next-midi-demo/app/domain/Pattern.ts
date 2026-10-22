import * as Arbitrary from 'effect/Arbitrary'
import type * as Brand from 'effect/Brand'
import * as Context from 'effect/Context'
import * as Iterable from 'effect/Iterable'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Pipeable from 'effect/Pipeable'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const patternsRawBase = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

export type PatternRawBase = (typeof patternsRawBase)[number]
export type AllPatternTuple = BrandifyTuple<Pattern, typeof patternsRawBase>
export const allPatterns = patternsRawBase as AllPatternTuple

export const patternSet = new Set(allPatterns)

export type Pattern = Distribute<Brand.Branded<PatternRawBase, 'Pattern'>>

export type Patternify<V extends string> = V & Pattern
export const Patternify = <const V extends PatternRawBase>(v: V) =>
  v as Patternify<V>

export type PatternOption = Option.Option<Pattern>

export const PatternSchema = Schema.Literals(patternsRawBase)
  .annotateKey({ title: 'Pattern' })
  .pipe(Schema.brand('Pattern'))

export const PatternArbitrary = Arbitrary.schema(PatternSchema)

export const decodePatternSync = Schema.decodeSync(PatternSchema)
export const decodePatternOptionFromUnknown =
  Schema.decodeUnknownOption(PatternSchema)
export const decodePatternSyncFromUnknown =
  Schema.decodeUnknownSync(PatternSchema)

export class PatternData extends Schema.TaggedClass<PatternData>()(
  'next-midi-demo/Pattern',
  { pattern: PatternSchema },
).pipe(Pipeable.Mixin) {
  declare protected '~brand~': never
  static models = Schema.is(this)
  static makeUnsafe = (candidate: string) =>
    this.make({ pattern: decodePatternSyncFromUnknown(candidate) })
  static makeSimple = (pattern: Pattern) => this.make({ pattern })
}

export const PatternDataArbitrary = Arbitrary.schema(PatternData)

export class PatternParamButtonData extends ParamButtonIdData<PatternData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof PatternParamButtonData>()(PatternData)

  static makeUnsafe = (candidate: string) =>
    new this(PatternData.makeUnsafe(candidate))
  static make = (pattern: Pattern) => new this(PatternData.make({ pattern }))
}

export const PatternParamButtonDataArbitrary = Arbitrary.map(
  PatternDataArbitrary,
  data => new PatternParamButtonData(data),
)

// Unbranded pattern as it appears in asset file names. Used to compose
// `local*AssetFileNameRegExp` in `helpers/audioAssetFileNameAndPath.ts`.
export const patternFileNameRegExpSource = '[1-8]'

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

export class AllPatterns extends Context.Service<
  AllPatterns,
  AllPatternTuple
>()('next-midi-demo/app/domain/Pattern/AllPatterns') {}

export const AllPatternsLayer: Layer.Layer<AllPatterns> = Layer.succeed(
  AllPatterns,
  allPatterns,
)
