import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { FullLoopState } from '../types/LoopBoundPlayback.ts'
import { TwoLoopsFadingToSilenceState } from '../types/SilenceBoundPlayback.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePatternPatternSilenceTransition = Effect.fn(
  'advancePatternPatternSilenceTransition',
)(function* (
  oldState: TwoLoopsFadingToSilenceState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const { accord, strength } = oldState
  const [oldest, fading] = oldState.transitionQueue

  if (StrengthData.models(pressedParamButtonId))
    return TwoLoopsFadingToSilenceState.make({
      // playbackStartedAtSecond: oldest.playbackStartedAtSecond,
      accord,
      strength: pressedParamButtonId.strength,
      transitionQueue: [oldest, fading],
    })

  if (AccordData.models(pressedParamButtonId))
    return yield* Effect.die(
      new Error(
        'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
      ),
    )

  const asset = TaggedPatternPointer.make({
    pattern: pressedParamButtonId.pattern,
    accord,
    strength,
  })
  return FullLoopState.make({
    playbackStartedAtSecond: oldest.playbackStartedAtSecond,
    transitionQueue: [oldest, fading, yield* oldest.scheduleNextLoop(asset)],
  })
})
