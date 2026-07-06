import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import type { Signal } from './signal.ts'

export const desiredAssetFromSignal = (
  signal: Signal,
  base: TaggedPatternPointer,
): TaggedPatternPointer =>
  PatternData.models(signal)
    ? TaggedPatternPointer.make({
        pattern: signal.pattern,
        accord: base.accord,
        strength: base.strength,
      })
    : AccordData.models(signal)
      ? TaggedPatternPointer.make({
          pattern: base.pattern,
          accord: signal.accord,
          strength: base.strength,
        })
      : TaggedPatternPointer.make({
          pattern: base.pattern,
          accord: base.accord,
          strength: signal.strength,
        })
