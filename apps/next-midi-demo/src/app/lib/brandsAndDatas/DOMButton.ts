import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import { AccordIndexData } from './Accord.ts'
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
}
