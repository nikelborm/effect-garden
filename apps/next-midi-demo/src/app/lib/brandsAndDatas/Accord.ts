import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { BrandifyTuple } from '../helpers/BrandifyTuple.ts'
import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

const accordsRawBase = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'E'] as const

export type AllAccordTuple = BrandifyTuple<Accord, typeof accordsRawBase>
export const allAccords = accordsRawBase as AllAccordTuple

export const accordSet = new Set(allAccords)

export type Accord = Distribute<
  Brand.Branded<(typeof accordsRawBase)[number], 'Accord'>
>

export const Accord = Brand.refined<Accord>(
  accordCandidate => accordSet.has(accordCandidate as any),
  notAccord =>
    Brand.error(
      `Expected ${JSON.stringify(notAccord)} to be a valid accord label`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (a: unknown): Accord
  option(a: unknown): AccordOption
  either(a: unknown): Either.Either<Accord, Brand.Brand.BrandErrors>
  is(a: unknown): a is Accord
}

export const defaultAccord = Accord(accordsRawBase[0])

export type AccordOption = Option.Option<Accord>

export class AccordData<
  const TAccord extends Accord = Accord,
> extends Data.TaggedClass('next-midi-demo/Accord')<{
  accord: TAccord
}> {
  constructor(accord: TAccord) {
    super({ accord })
  }
  static makeUnsafe = (accordCandidate: string) =>
    new this(Accord(accordCandidate))
  static models = (candidate: unknown) => candidate instanceof this
}

export class AccordParamButtonData extends ParamButtonIdData<AccordData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof AccordParamButtonData>()(AccordData)

  static makeUnsafe = (accordCandidate: string) =>
    new this(AccordData.makeUnsafe(accordCandidate))
  static make = <const TAccord extends Accord = Accord>(accord: TAccord) =>
    new this(new AccordData(accord))
}

export const AccordSchema = Schema.Literal(...accordsRawBase)
  .annotations({ title: 'Accord' })
  .pipe(Schema.fromBrand(Accord))

export type UnbrandedAccord<TAccord extends Accord> =
  Brand.Brand.Unbranded<TAccord>

export const UnbrandedAccord = <TAccord extends Accord>(accord: TAccord) =>
  accord as UnbrandedAccord<TAccord>
