import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import { AccordData } from './Accord.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
import { PatternData } from './Pattern.ts'
import { PhysicalButtonIdData } from './PhysicalButton.ts'
import { StrengthData } from './Strength.ts'

export class DOMPhysicalButtonData<
  TId extends AccordData | PatternData | StrengthData,
> extends PhysicalButtonIdData<TId> {
  static override makeUnsafeFromData = (idData: TaggedReadonlyObject) => {
    if (
      AccordData.models(idData) ||
      PatternData.models(idData) ||
      StrengthData.models(idData)
    )
      return new this(idData)

    throw new Error(
      `Cannot create ${this.name}. argument is not wrapped Accord/Pattern/Strength`,
    )
  }

  static makeFromParamButton = <
    TId extends AccordData | PatternData | StrengthData,
  >(
    paramData: ParamButtonIdData<TId>,
  ) => new this(paramData.id)
}
