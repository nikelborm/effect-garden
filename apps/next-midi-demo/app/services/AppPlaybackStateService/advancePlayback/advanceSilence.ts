import * as Effect from 'effect/Effect'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { LoopBoundPlayback } from '../types/LoopBoundPlayback.ts'
import { getAudioNow, PlayingLoopPlayback } from '../types/loopElements.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import {
  type PureSilenceState,
  SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/index.ts'
import type { Signal } from './signal.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: PureSilenceState,
  signal: Signal,
) {
  const { accord, strength } = oldState

  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      accord,
      strength: signal.strength,
      transitionQueue: [],
    })

  const asset: AssetPointer = PatternData.models(signal)
    ? TaggedPatternPointer.make({
        pattern: signal.pattern,
        accord,
        strength,
      })
    : TaggedSlowStrumPointer.make({ accord: signal.accord, strength })

  const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
  const playbackStartedAtSecond = yield* getAudioNow

  const playback = yield* StartFreshPlayback.run(audioBuffer, {
    isLooping: PatternData.models(signal),
    startAtSecond: playbackStartedAtSecond,
  })

  return LoopBoundPlayback.make({
    playbackStartedAtSecond,
    transitionQueue: TaggedPatternPointer.models(asset)
      ? [PlayingLoopPlayback.make({ asset, playback, playbackStartedAtSecond })]
      : [PlayingSlowStrum.make({ asset, playback, playbackStartedAtSecond })],
  })
})
