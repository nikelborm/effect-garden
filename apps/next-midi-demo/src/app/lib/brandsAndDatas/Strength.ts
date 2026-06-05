import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
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

export const Strength = Brand.refined<Strength>(
  candidate => strengthSet.has(candidate as any),
  notStrength =>
    Brand.error(
      `Expected ${JSON.stringify(notStrength)} to be a valid strength label`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (s: unknown): Strength
  option(s: unknown): StrengthOption
  either(s: unknown): Either.Either<Strength, Brand.Brand.BrandErrors>
  is(s: unknown): s is Strength
}

export const defaultStrength = Strength(strengthsRawBase[1])

export type StrengthOption = Option.Option<Strength>

export class StrengthData<
  const TStrength extends Strength = Strength,
> extends Data.TaggedClass('next-midi-demo/Strength')<{
  strength: TStrength
}> {
  constructor(strength: TStrength) {
    super({ strength })
  }
  static makeUnsafe = (candidate: string) => new this(Strength(candidate))
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

export const StrengthSchema = Schema.Literal(...strengthsRawBase)
  .annotations({ title: 'Strength' })
  .pipe(Schema.fromBrand(Strength))

export type UnbrandedStrength<TStrength extends Strength> =
  Brand.Brand.Unbranded<TStrength>

export const UnbrandedStrength = <TStrength extends Strength>(
  strength: TStrength,
) => strength as UnbrandedStrength<TStrength>
