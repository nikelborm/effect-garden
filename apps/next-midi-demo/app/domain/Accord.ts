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

const accordsRawBase = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'D', 'E'] as const

export type AllAccordTuple = BrandifyTuple<Accord, typeof accordsRawBase>
export const allAccords = accordsRawBase as AllAccordTuple

export const accordSet = new Set(allAccords)

export type Accord = Distribute<
  Brand.Branded<(typeof accordsRawBase)[number], 'Accord'>
>

export type AccordOption = Option.Option<Accord>

export class AccordData<
  const TAccord extends Accord = Accord,
> extends Data.TaggedClass('next-midi-demo/Accord')<{
  accord: TAccord
}> {
  constructor(accord: TAccord) {
    super({ accord })
  }
  static makeUnsafe = (candidate: string) =>
    new this(decodeAccordSyncFromUnknown(candidate))
  static models = (candidate: unknown): candidate is AccordData =>
    candidate instanceof this
}

export class AccordParamButtonData extends ParamButtonIdData<AccordData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof AccordParamButtonData>()(AccordData)

  static makeUnsafe = (candidate: string) =>
    new this(AccordData.makeUnsafe(candidate))
  static make = <const TAccord extends Accord = Accord>(accord: TAccord) =>
    new this(new AccordData(accord))
}

export const AccordSchema = Schema.Literals(accordsRawBase)
  .annotateKey({ title: 'Accord' })
  .pipe(Schema.brand('Accord'))

export const decodeAccordSync = Schema.decodeSync(AccordSchema)
export const decodeAccordOptionFromUnknown =
  Schema.decodeUnknownOption(AccordSchema)
export const decodeAccordSyncFromUnknown =
  Schema.decodeUnknownSync(AccordSchema)

// Unbranded accord as it appears in asset file names (without padding `_`).
// Used to compose `local*AssetFileNameRegExp` in
// `helpers/audioAssetFileNameAndPath.ts`.
export const accordFileNameRegExpSource = '[A-G][m#b]?'

export const defaultAccord = decodeAccordSync(accordsRawBase[0])

export type UnbrandedAccord<TAccord extends Accord> =
  Brand.Brand.Unbranded<TAccord>

export const UnbrandedAccord = <TAccord extends Accord>(accord: TAccord) =>
  accord as UnbrandedAccord<TAccord>

export class AllAccords extends Context.Service<AllAccords, AllAccordTuple>()(
  'next-midi-demo/app/domain/Accord/AllAccords',
) {}

export const AllAccordsLayer: Layer.Layer<AllAccords> = Layer.succeed(
  AllAccords,
  allAccords,
)
