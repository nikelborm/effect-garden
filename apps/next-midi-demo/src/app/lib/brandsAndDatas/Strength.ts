import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import type { StrengthUnion } from '../audioAssetHelpers.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export type Strength = Brand.Branded<StrengthUnion, 'Strength'>

export const Strength = Brand.refined<Strength>(
  s => s === 's' || s === 'm' || s === 'v',
  s => Brand.error(`Expected ${JSON.stringify(s)} to be 's' | 'm' | 'v'`),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (s: string): Strength
  option(s: string): Option.Option<Strength>
  either(s: string): Either.Either<Strength, Brand.Brand.BrandErrors>
  is(s: string): s is Strength
}

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
