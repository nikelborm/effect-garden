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
  PlayingLoopState,
  PlayingSlowStrumState,
} from '../types/LoopBoundPlayback.ts'
import { getAudioNow, PlayingLoopPlayback } from '../types/loopElements.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import { PureSilenceState } from '../types/SilenceBoundPlayback.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/index.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: PureSilenceState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const { accord, strength } = oldState

  if (StrengthData.models(pressedParamButtonId))
    return PureSilenceState.make({
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
    return PlayingLoopState.make({
      playbackStartedAtSecond,
      transitionQueue: [
        PlayingLoopPlayback.make({ asset, playback, playbackStartedAtSecond }),
      ],
    })

  return PlayingSlowStrumState.make({
    playbackStartedAtSecond,
    transitionQueue: [
      PlayingSlowStrum.make({ asset, playback, playbackStartedAtSecond }),
    ],
  })
})
