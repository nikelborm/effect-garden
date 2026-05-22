import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import type { AccordIndexUnion } from '../audioAssetHelpers.ts'

export type AccordIndex<Index extends AccordIndexUnion = AccordIndexUnion> =
  Brand.Branded<Index, 'AccordIndex: integer in range 0...7'>
export const AccordIndex = Brand.refined<AccordIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0...7`),
) as {
  <TIndex extends AccordIndexUnion = AccordIndexUnion>(
    i: TIndex,
  ): AccordIndex<TIndex>

  option<TIndex extends AccordIndexUnion = AccordIndexUnion>(
    i: TIndex,
  ): Option.Option<AccordIndex<TIndex>>

  either<TIndex extends AccordIndexUnion = AccordIndexUnion>(
    i: TIndex,
  ): Either.Either<AccordIndex<TIndex>, Brand.Brand.BrandErrors>

  is<TIndex extends AccordIndexUnion = AccordIndexUnion>(
    i: TIndex,
  ): i is TIndex & AccordIndex<TIndex>
}

export class AccordIndexData<
  TIndex extends AccordIndexUnion = AccordIndexUnion,
> extends Data.TaggedClass('next-midi-demo/AccordIndex')<{
  value: AccordIndex<TIndex>
}> {
  constructor(index: TIndex) {
    super({ value: AccordIndex(index) })
  }

  static makeUnsafe = (index: number) =>
    new AccordIndexData(index as AccordIndexUnion)
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
  AccordMiniInfo<TId, TLabel> & { readonly index: AccordIndex<TIndex> }
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

  static models = (p: unknown): p is Accord =>
    typeof p === 'object' &&
    p !== null &&
    '_tag' in p &&
    p._tag === this.prototype._tag
}
