import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import type { AccordIndexUnion } from '../audioAssetHelpers.ts'
import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { ParamButtonIdData } from './ParamButton.ts'

export type AccordIndex = Brand.Branded<
  AccordIndexUnion,
  'AccordIndex: integer in range 0...7'
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
