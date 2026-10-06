import * as Effect from 'effect/Effect'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import {
  getAudioNow,
  PatternPlayback,
  SlowStrumPlayback,
} from '../types/loopElements.ts'
import { PatternState } from '../types/PatternBound/Pattern/State.ts'
import { SilenceState } from '../types/SilenceBound/Silence/State.ts'
import { SlowStrumState } from '../types/SlowStrumBound/SlowStrum/State.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: SilenceState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const { accord, strength } = oldState

  if (StrengthData.models(pressedParamButtonId))
    return SilenceState.make({
      accord,
      strength: pressedParamButtonId.strength,
      transitionQueue: [],
    })

  const asset: AssetPointer = PatternData.models(pressedParamButtonId)
    ? TaggedPatternPointer.make({
        pattern: pressedParamButtonId.pattern,
        accord,
        strength,
      })
    : TaggedSlowStrumPointer.make({
        accord: pressedParamButtonId.accord,
        strength,
      })

  const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
  const playbackStartedAtSecond = yield* getAudioNow

  const playback = yield* StartFreshPlayback.run(audioBuffer, {
    isLooping: PatternData.models(pressedParamButtonId),
    startAtSecond: playbackStartedAtSecond,
  })

  if (TaggedPatternPointer.models(asset))
    return PatternState.make({
      playbackStartedAtSecond,
      transitionQueue: [
        PatternPlayback.make({ asset, playback, playbackStartedAtSecond }),
      ],
    })

  return SlowStrumState.make({
    playbackStartedAtSecond,
    transitionQueue: [
      SlowStrumPlayback.make({ asset, playback, playbackStartedAtSecond }),
    ],
  })
})
