import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const accordsRawBase = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'E'] as const

export const accordSet = new Set(accordsRawBase)

export type Accord = Distribute<
  Brand.Branded<(typeof accordsRawBase)[number], 'Accord'>
>

export const Accord = Brand.refined<Accord>(
  accordCandidate => accordSet.has(accordCandidate),
  label =>
    Brand.error(`Expected ${JSON.stringify(label)} to be a valid accord label`),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (i: unknown): Accord
  option(i: unknown): Option.Option<Accord>
  either(i: unknown): Either.Either<Accord, Brand.Brand.BrandErrors>
  is(i: unknown): i is Accord
}

export const defaultAccord = Accord(accordsRawBase[0])

export class AccordData<
  const TAccord extends Accord = Accord,
> extends Data.TaggedClass('next-midi-demo/Accord')<{
  accord: TAccord
}> {
  constructor(accord: TAccord) {
    super({ accord })
  }

  static makeUnsafe = (accord: string) => new this(Accord(accord))
  static models = (accord: unknown) => accord instanceof this
}

export class AccordParamButtonData extends ParamButtonIdData<AccordData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof AccordParamButtonData>()(AccordData)

  static makeUnsafe = (accord: string) =>
    new this(AccordData.makeUnsafe(accord))
  static make = (accord: Accord) => new this(new AccordData(accord))
}

export const AccordSchema = Schema.Literal(...accordsRawBase).pipe(
  Schema.fromBrand(Accord),
)

export type UnbrandedAccord<TIndex extends Accord> =
  Brand.Brand.Unbranded<TIndex>

export const UnbrandedAccord = <TIndex extends Accord>(index: TIndex) =>
  index as UnbrandedAccord<TIndex>

// TODO type AllAccordTuple
export type AllAccordTuple = any
