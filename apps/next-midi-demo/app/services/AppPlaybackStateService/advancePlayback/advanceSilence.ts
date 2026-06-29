import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import {
  type AssetPointer,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../../domain/AssetPointer.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { createLoopingPlaybackInContext } from '../playbackNodes/createLoopingPlayback.ts'
import { createOneshotPlaybackInContext } from '../playbackNodes/createOneshotPlayback.ts'
import { LoopBoundPlayback } from '../types/LoopBoundPlayback.ts'
import { PlayingLoopPlayback } from '../types/loopElements.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import {
  type PureSilenceState,
  SilenceBoundPlayback,
} from '../types/SilenceBoundPlayback.ts'
import type { Signal } from './signal.ts'

// Pure silence (queue = []). The carried base accord+strength ride on oldState.
export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: PureSilenceState,
  signal: Signal,
) {
  const { accord, strength } = oldState

  // While silent we can freely change the strength — no playback is scheduled,
  // we just remember the new base selection.
  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      accord,
      strength: signal.strength,
      transitionQueue: [],
    })

  const audioBufferStore = yield* AudioBufferStore

  const asset: AssetPointer = PatternData.models(signal)
    ? TaggedPatternPointer.make({
        pattern: signal.pattern,
        accord,
        strength,
      })
    : TaggedSlowStrumPointer.make({ accord: signal.accord, strength })

  const audioBuffer = yield* audioBufferStore.getByAsset(asset)
  const playbackStartedAtSecond = yield* EAudioContext.currentTimeFromContext
  const playback = yield* (
    PatternData.models(signal)
      ? createLoopingPlaybackInContext
      : createOneshotPlaybackInContext
  )(audioBuffer)

  yield* Effect.sync(() => {
    playback.gainNode.gain.setValueAtTime(
      maxLoudness,
      asEarlyAsPossibleInSeconds,
    )
    playback.bufferSource.start(playbackStartedAtSecond)
  })

  return LoopBoundPlayback.make({
    playbackStartedAtSecond,
    transitionQueue: TaggedPatternPointer.models(asset)
      ? [PlayingLoopPlayback.make({ asset, playback, playbackStartedAtSecond })]
      : [PlayingSlowStrum.make({ asset, playback, playbackStartedAtSecond })],
  })
})
