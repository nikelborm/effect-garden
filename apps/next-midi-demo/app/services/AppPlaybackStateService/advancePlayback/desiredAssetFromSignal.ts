import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import type { Signal } from './signal.ts'

// The pattern asset an input wants to head toward, relative to a base asset
// (the loop the user is currently switching from / heading to). A pattern press
// swaps the pattern; an accord press swaps the accord; otherwise it's a strength
// press swapping the strength. Replaces four hand-written copies of this.
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
