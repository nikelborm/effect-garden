/**
 * Param button is a virtual entity, who's behavior change on input. It's an
 * aggregation point for all the input sources and single point of interaction
 * for the whole app. It's not a UI button you see on screen. UI button on the
 * screen is considered a physical button, and it generates inputs of equal
 * importance as do keyboard and midi pad
 */

import * as Data from 'effect/Data'

import { isData } from '../helpers/isData.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'

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
