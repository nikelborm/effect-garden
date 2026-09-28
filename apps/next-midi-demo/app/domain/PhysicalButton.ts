import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Schema from 'effect/Schema'

import { isData } from '../helpers/isData.ts'
import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import type * as ButtonState from './ButtonState.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
// import type { ParamButtonIdData } from './ParamButton.ts'

export type PhysicalButtonId<T extends string | number> = T extends any
  ? Brand.Branded<T, 'PhysicalButtonId'>
  : never

export type PhysicalButtonStringId = PhysicalButtonId<string>
export const PhysicalButtonStringId = Brand.check<PhysicalButtonStringId>(
  Schema.isNonEmpty(),
)

export type PhysicalButtonNumberId = PhysicalButtonId<number>
export const PhysicalButtonNumberId = Brand.check<PhysicalButtonNumberId>(
  Schema.isFinite(),
)

export class PhysicalButtonIdData<
  TId extends TaggedReadonlyObject = TaggedReadonlyObject,
> extends Data.TaggedClass('next-midi-demo/PhysicalButtonId')<{ id: TId }> {
  constructor(id: TId) {
    super({ id })
  }

  static makeUnsafeFromData = (
    idData: TaggedReadonlyObject,
  ): PhysicalButtonIdData<TaggedReadonlyObject> => {
    if (isData(idData)) return new PhysicalButtonIdData(idData)

    throw new Error(
      "Cannot create PhysicalButtonIdData. Argument doesn't pass as effect/Data.TaggedClass instance",
    )
  }
}

export class PhysicalButtonModel<
  TParamButtonId extends TaggedReadonlyObject,
> extends Data.Class<{
  buttonPressState: ButtonState.AllSimple
  assignedToParamButtonIdData: ParamButtonIdData<TParamButtonId>
}> {
  constructor(
    buttonPressState: ButtonState.AllSimple,
    assignedToParamButtonIdData: ParamButtonIdData<TParamButtonId>,
  ) {
    super({ buttonPressState, assignedToParamButtonIdData })
  }
}
