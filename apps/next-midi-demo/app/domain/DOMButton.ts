import type { TaggedReadonlyObject } from '../helpers/TaggedReadonlyObject.ts'
import { ChordData } from './Chord.ts'
import type { ParamButtonIdData } from './ParamButton.ts'
import { PatternData } from './Pattern.ts'
import { PhysicalButtonIdData } from './PhysicalButton.ts'
import { StrengthData } from './Strength.ts'

export class DOMPhysicalButtonData<
  TId extends ChordData | PatternData | StrengthData,
> extends PhysicalButtonIdData<TId> {
  static override makeUnsafeFromData = (idData: TaggedReadonlyObject) => {
    if (
      ChordData.models(idData) ||
      PatternData.models(idData) ||
      StrengthData.models(idData)
    )
      return new this(idData)

    throw new Error(
      `Cannot create ${this.name}. argument is not wrapped Chord/Pattern/Strength`,
    )
  }

  static makeFromParamButton = <
    TId extends ChordData | PatternData | StrengthData,
  >(
    paramData: ParamButtonIdData<TId>,
  ) => new this(paramData.id)
}
