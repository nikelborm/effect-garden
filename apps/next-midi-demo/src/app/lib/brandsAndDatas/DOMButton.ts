import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import { AccordIndexData } from './Accord.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
import { PatternIndexData } from './Pattern.ts'
import { PhysicalButtonIdData } from './PhysicalButton.ts'
import { StrengthData } from './Strength.ts'

export class DOMPhysicalButtonData<
  TId extends AccordIndexData | PatternIndexData | StrengthData,
> extends PhysicalButtonIdData<TId> {
  static override makeUnsafeFromData = (idData: TaggedReadonlyObject) => {
    if (
      AccordIndexData.models(idData) ||
      PatternIndexData.models(idData) ||
      StrengthData.models(idData)
    )
      return new this(idData)

    throw new Error(
      `Cannot create ${this.name}. argument is not wrapped AccordIndex/PatternIndex/Strength`,
    )
  }

  static makeFromParamButton = <
    TId extends AccordIndexData | PatternIndexData | StrengthData,
  >(
    idData: ParamButtonIdData<TId>,
  ) => new this(idData.id)
}
