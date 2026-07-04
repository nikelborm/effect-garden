import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { LoopBoundPlayback } from '../types/LoopBoundPlayback.ts'
import {
  SilenceBoundPlayback,
  type TwoLoopsFadingToSilenceState,
} from '../types/SilenceBoundPlayback.ts'
import type { Signal } from './signal.ts'

// Two loops fading out to silence (queue = [oldest, fading]); accord+strength are
// the carried base selection. BOTH loops are already committed to their stopping
// fades with armed cleanup fibers, so neither can be revived and there is no
// uncommitted element to manipulate. A 3rd input therefore only ever: updates the
// carried selection (strength), rolls a brand-new loop in over the two dying ones
// (pattern -> re-leaving silence), or — for an accord, i.e. a slow-strum request —
// dies, since slow strums are deferred. See midi_scheduling_findings_2026_06_25.
export const advancePatternPatternSilenceTransition = Effect.fn(
  'advancePatternPatternSilenceTransition',
)(function* (oldState: TwoLoopsFadingToSilenceState, signal: Signal) {
  const { accord, strength } = oldState
  const [oldest, fading] = oldState.transitionQueue

  // Strength just updates the base selection carried towards silence.
  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      // playbackStartedAtSecond: oldest.playbackStartedAtSecond,
      accord,
      strength: signal.strength,
      transitionQueue: [oldest, fading],
    })

  // From a (scheduled) silence, an accord press means "slow strum". Slow strums
  // are deferred for now — die honestly rather than pretend.
  if (AccordData.models(signal))
    return yield* Effect.dieMessage(
      'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
    )

  // A pattern press re-leaves silence: roll a brand-new loop in over the two dying
  // loops. Both keep their stopping fades + cleanup fibers untouched while the new
  // loop fades in on the next tick of the shared grid. queue -> the full
  // [oldest, fading, incoming]; the two cleanup fibers then collapse it back down.
  const asset = TaggedPatternPointer.make({
    pattern: signal.pattern,
    accord,
    strength,
  })
  return LoopBoundPlayback.make({
    playbackStartedAtSecond: oldest.playbackStartedAtSecond,
    transitionQueue: [oldest, fading, yield* oldest.scheduleNextLoop(asset)],
  })
})
