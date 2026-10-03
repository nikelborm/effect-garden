import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const desiredAssetFromSignal = (
  pressedParamButtonId: PressedParamButtonId,
  base: TaggedPatternPointer,
): TaggedPatternPointer =>
  PatternData.models(pressedParamButtonId)
    ? TaggedPatternPointer.make({
        pattern: pressedParamButtonId.pattern,
        accord: base.accord,
        strength: base.strength,
      })
    : AccordData.models(pressedParamButtonId)
      ? TaggedPatternPointer.make({
          pattern: base.pattern,
          accord: pressedParamButtonId.accord,
          strength: base.strength,
        })
      : TaggedPatternPointer.make({
          pattern: base.pattern,
          accord: base.accord,
          strength: pressedParamButtonId.strength,
        })
