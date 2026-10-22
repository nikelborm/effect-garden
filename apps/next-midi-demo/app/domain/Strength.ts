import * as Arbitrary from 'effect/Arbitrary'
import type * as Brand from 'effect/Brand'
import * as Context from 'effect/Context'
import * as Layer from 'effect/Layer'
import type * as Option from 'effect/Option'
import * as Pipeable from 'effect/Pipeable'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const strengthsRawBase = ['s', 'm', 'v'] as const

export type StrengthRawBase = (typeof strengthsRawBase)[number]
export type AllStrengthTuple = BrandifyTuple<Strength, typeof strengthsRawBase>
export const allStrengths = strengthsRawBase as AllStrengthTuple

export const strengthSet = new Set(allStrengths)

export type Strength = Distribute<Brand.Branded<StrengthRawBase, 'Strength'>>

export type Strengthify<V extends string> = V & Strength
export const Strengthify = <const V extends StrengthRawBase>(v: V) =>
  v as Strengthify<V>

export type StrengthOption = Option.Option<Strength>

export const StrengthSchema = Schema.Literals(strengthsRawBase)
  .annotateKey({ title: 'Strength' })
  .pipe(Schema.brand('Strength'))

export const StrengthArbitrary = Arbitrary.schema(StrengthSchema)

export const decodeStrengthSync = Schema.decodeSync(StrengthSchema)
export const decodeStrengthOptionFromUnknown =
  Schema.decodeUnknownOption(StrengthSchema)
export const decodeStrengthSyncFromUnknown =
  Schema.decodeUnknownSync(StrengthSchema)

export class StrengthData extends Schema.TaggedClass<StrengthData>()(
  'next-midi-demo/Strength',
  { strength: StrengthSchema },
).pipe(Pipeable.Mixin) {
  declare protected '~brand~': never
  static models = Schema.is(this)
  static makeUnsafe = (candidate: string) =>
    this.make({ strength: decodeStrengthSyncFromUnknown(candidate) })
  static makeSimple = (strength: Strength) => this.make({ strength })
}

export const StrengthDataArbitrary = Arbitrary.schema(StrengthData)

export class StrengthParamButtonData extends ParamButtonIdData<StrengthData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof StrengthParamButtonData>()(StrengthData)

  static makeUnsafe = (candidate: string) =>
    new this(StrengthData.makeUnsafe(candidate))
  static make = (strength: Strength) =>
    new this(StrengthData.make({ strength }))
}

export const StrengthParamButtonDataArbitrary = Arbitrary.map(
  StrengthDataArbitrary,
  data => new StrengthParamButtonData(data),
)

// Unbranded strength as it appears in asset file names. Used to compose
// `local*AssetFileNameRegExp` in `helpers/audioAssetFileNameAndPath.ts`.
export const strengthFileNameRegExpSource = '[smv]'

export const defaultStrength = decodeStrengthSync(strengthsRawBase[1])

export type UnbrandedStrength<TStrength extends Strength> =
  Brand.Brand.Unbranded<TStrength>

export const UnbrandedStrength = <TStrength extends Strength>(
  strength: TStrength,
) => strength as UnbrandedStrength<TStrength>

export class AllStrengths extends Context.Service<
  AllStrengths,
  AllStrengthTuple
>()('next-midi-demo/app/domain/Strength/AllStrengths') {}

export const AllStrengthsLayer: Layer.Layer<AllStrengths> = Layer.succeed(
  AllStrengths,
  allStrengths,
)
