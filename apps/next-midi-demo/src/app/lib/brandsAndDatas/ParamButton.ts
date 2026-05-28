/**
 * Param button is a virtual entity, who's behavior change on input. It's an
 * aggregation point for all the input sources and single point of interaction
 * for the whole app. It's not a UI button you see on screen. UI button on the
 * screen is considered a physical button, and it generates inputs of equal
 * importance as do keyboard and midi pad
 */

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import type * as Either from 'effect/Either'
import type * as Option from 'effect/Option'

import { isData } from '../helpers/isData.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

export type ParamButtonId<T extends string | number> = T extends any
  ? Brand.Branded<T, 'ParamButtonId'>
  : never

export const ParamButtonId = Brand.refined<ParamButtonId<string | number>>(
  t =>
    (typeof t === 'number' && !Number.isNaN(t) && Number.isFinite(t)) ||
    (typeof t === 'string' && t !== ''),
  t =>
    Brand.error(
      `Expected ParamButtonId which is either finite non-NaN number, or non-empty string. Got ${t}`,
    ),
) as {
  <T extends string | number = string | number>(i: T): ParamButtonId<T>
  option<T extends string | number = string | number>(
    i: T,
  ): Option.Option<ParamButtonId<T>>
  either<T extends string | number = string | number>(
    i: T,
  ): Either.Either<ParamButtonId<T>, Brand.Brand.BrandErrors>
  is<T extends string | number = string | number>(
    i: T,
  ): i is T & ParamButtonId<T>
}

export class ParamButtonIdData<
  TId extends TaggedReadonlyObject = TaggedReadonlyObject,
> extends Data.TaggedClass('next-midi-demo/ParamButtonId')<{ id: TId }> {
  constructor(id: TId) {
    super({ id })
  }

  static makeUnsafeFromData = (
    idData: TaggedReadonlyObject,
  ): ParamButtonIdData<TaggedReadonlyObject> => {
    if (isData(idData)) return new ParamButtonIdData(idData)

    throw new Error(
      "Cannot create ParamButtonIdData. Argument doesn't pass as effect/Data.TaggedClass instance",
    )
  }
}
