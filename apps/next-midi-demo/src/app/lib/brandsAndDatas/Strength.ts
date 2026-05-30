import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export type Strength = Distribute<Brand.Branded<'s' | 'm' | 'v', 'Strength'>>

export const Strength = Brand.refined<Strength>(
  s => s === 's' || s === 'm' || s === 'v',
  s => Brand.error(`Expected ${JSON.stringify(s)} to be 's' | 'm' | 'v'`),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (s: unknown): Strength
  option(s: unknown): Option.Option<Strength>
  either(s: unknown): Either.Either<Strength, Brand.Brand.BrandErrors>
  is(s: unknown): s is Strength
}

export type AllStrengthTuple = typeof allStrengths

export const allStrengths = [
  'm' as 'm' & Strength,
  'v' as 'v' & Strength,
  's' as 's' & Strength,
] as const

export const StrengthSchema = Schema.Literal(...allStrengths).annotations({
  title: 'Strength',
})

export type UnbrandedStrength<TStrength extends Strength> =
  Brand.Brand.Unbranded<TStrength>

export const UnbrandedStrength = <TStrength extends Strength>(
  strength: TStrength,
) => strength as UnbrandedStrength<TStrength>

export class StrengthData extends Data.TaggedClass('next-midi-demo/Strength')<{
  strength: Strength
}> {
  constructor(strength: Strength) {
    super({ strength })
  }

  static makeUnsafe = (strength: string) => new this(Strength(strength))
  static models = (strength: unknown) => strength instanceof this
}

export class StrengthParamButtonData extends ParamButtonIdData<StrengthData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof StrengthParamButtonData>()(StrengthData)

  static makeUnsafe = (strength: string) =>
    new this(StrengthData.makeUnsafe(strength))
  static make = (strength: Strength) => new this(new StrengthData(strength))
}

export const strengthSet = new Set(allStrengths)
