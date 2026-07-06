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

export const advancePatternPatternSilenceTransition = Effect.fn(
  'advancePatternPatternSilenceTransition',
)(function* (oldState: TwoLoopsFadingToSilenceState, signal: Signal) {
  const { accord, strength } = oldState
  const [oldest, fading] = oldState.transitionQueue

  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      // playbackStartedAtSecond: oldest.playbackStartedAtSecond,
      accord,
      strength: signal.strength,
      transitionQueue: [oldest, fading],
    })

  if (AccordData.models(signal))
    return yield* Effect.dieMessage(
      'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
    )

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
