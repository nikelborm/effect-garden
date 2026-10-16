import type * as Brand from 'effect/Brand'
import * as Context from 'effect/Context'
import * as Data from 'effect/Data'
import * as Layer from 'effect/Layer'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const strengthsRawBase = ['s', 'm', 'v'] as const

export type AllStrengthTuple = BrandifyTuple<Strength, typeof strengthsRawBase>
export const allStrengths = strengthsRawBase as AllStrengthTuple

export const strengthSet = new Set(allStrengths)

export type Strength = Distribute<
  Brand.Branded<(typeof strengthsRawBase)[number], 'Strength'>
>

export type StrengthOption = Option.Option<Strength>

export class StrengthData<
  const TStrength extends Strength = Strength,
> extends Data.TaggedClass('next-midi-demo/Strength')<{
  strength: TStrength
}> {
  constructor(strength: TStrength) {
    super({ strength })
  }
  static makeUnsafe = (candidate: string) =>
    new this(decodeStrengthSyncFromUnknown(candidate))
  static models = (candidate: unknown): candidate is StrengthData =>
    candidate instanceof this
}

export class StrengthParamButtonData extends ParamButtonIdData<StrengthData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof StrengthParamButtonData>()(StrengthData)

  static makeUnsafe = (candidate: string) =>
    new this(StrengthData.makeUnsafe(candidate))
  static make = <const TStrength extends Strength = Strength>(
    strength: TStrength,
  ) => new this(new StrengthData(strength))
}

export const StrengthSchema = Schema.Literals(strengthsRawBase)
  .annotateKey({ title: 'Strength' })
  .pipe(Schema.brand('Strength'))

export const decodeStrengthSync = Schema.decodeSync(StrengthSchema)
export const decodeStrengthOptionFromUnknown =
  Schema.decodeUnknownOption(StrengthSchema)
export const decodeStrengthSyncFromUnknown =
  Schema.decodeUnknownSync(StrengthSchema)

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
