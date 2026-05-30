import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import type { Distribute } from '../helpers/Distribute.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import type { TupleIndices } from '../helpers/TupleIndices.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export type AccordIndex = Distribute<
  Brand.Branded<AccordIndexUnion, 'AccordIndex'>
>

export const AccordIndex = Brand.refined<AccordIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n =>
    Brand.error(
      `Expected ${JSON.stringify(n)} to be an integer in range 0...7`,
    ),
) as {
  readonly [Brand.RefinedConstructorsTypeId]: Brand.RefinedConstructorsTypeId
  (i: number): AccordIndex
  option(i: number): Option.Option<AccordIndex>
  either(i: number): Either.Either<AccordIndex, Brand.Brand.BrandErrors>
  is(i: number): i is AccordIndex
}

export class AccordIndexData extends Data.TaggedClass(
  'next-midi-demo/AccordIndex',
)<{ index: AccordIndex }> {
  constructor(index: AccordIndex) {
    super({ index })
  }

  static makeUnsafe = (index: number) => new this(AccordIndex(index))
  static models = (aid: unknown) => aid instanceof this
}

export class AccordParamButtonData extends ParamButtonIdData<AccordIndexData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof AccordParamButtonData>()(AccordIndexData)

  static makeUnsafe = (index: number) =>
    new this(AccordIndexData.makeUnsafe(index))
  static make = (index: AccordIndex) => new this(new AccordIndexData(index))
}

export interface AccordMiniInfo<
  TId extends number = number,
  TLabel extends string = string,
> {
  readonly id: TId
  readonly label: TLabel
}

export class Accord<
  const TId extends number = number,
  const TLabel extends string = string,
  const TIndex extends AccordIndexUnion = AccordIndexUnion,
> extends Data.TaggedClass('next-midi-demo/Accord')<
  AccordMiniInfo<TId, TLabel> & { index: AccordIndex }
> {
  constructor(conf: AccordMiniInfo<TId, TLabel> & { readonly index: TIndex }) {
    super({ ...conf, index: AccordIndex(conf.index) })
  }

  static makeUnsafe = <
    const TId extends number = number,
    const TLabel extends string = string,
  >(
    conf: AccordMiniInfo<TId, TLabel> & { readonly index: number },
  ) =>
    new Accord(
      conf as AccordMiniInfo<TId, TLabel> & {
        readonly index: AccordIndexUnion
      },
    )

  static models = (a: unknown): a is Accord => a instanceof Accord
}

const accords = [
  { label: 'C' },
  { label: 'Dm' },
  { label: 'Em' },
  { label: 'F' },
  { label: 'G' },
  { label: 'Am' },
  { label: 'D' },
  { label: 'E' },
] as const

export const AccordIndexSchema = Schema.Literal(0, 1, 2, 3, 4, 5, 6, 7).pipe(
  Schema.fromBrand(AccordIndex),
)

export const allAccords = accords.map((info, index) =>
  Accord.makeUnsafe({ ...info, index }),
) as unknown as AllAccordTuple

type _AllAccordTuple<
  Labels extends readonly AccordMiniInfo[] = typeof accords,
> = Labels extends readonly [
  ...infer RestLabels extends readonly AccordMiniInfo[],
  infer Current extends AccordMiniInfo,
]
  ? readonly [
      ..._AllAccordTuple<RestLabels>,
      Accord<
        Current['id'],
        Current['label'],
        RestLabels['length'] & AccordIndex
      >,
    ]
  : readonly []

export type UnbrandedAccordIndex<TIndex extends AccordIndex> =
  Brand.Brand.Unbranded<TIndex>

export const UnbrandedAccordIndex = <TIndex extends AccordIndex>(
  index: TIndex,
) => index as UnbrandedAccordIndex<TIndex>

export type AccordByIndex<TIndex extends AccordIndex> =
  AllAccordTuple[UnbrandedAccordIndex<TIndex>]

export type AllAccordTuple = _AllAccordTuple

export type AllAccordUnion = AllAccordTuple[number]

type AccordIndexUnion = TupleIndices<typeof accords>

export const mapIndexToAccord = <TIndex extends AccordIndex>(index: TIndex) =>
  new Accord({
    index,
    ...accords[index as UnbrandedAccordIndex<TIndex>],
  }) as AllAccordTuple[UnbrandedAccordIndex<TIndex>]

export const accordIndexSet = new Set([0, 1, 2, 3, 4, 5, 6, 7] as const)
