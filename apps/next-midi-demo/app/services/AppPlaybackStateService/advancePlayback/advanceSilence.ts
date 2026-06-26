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
import { PlayingPattern } from '../types/PlayingPattern.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import { Silence } from '../types/Silence.ts'
import type { Signal } from './signal.ts'

export const advanceSilence = Effect.fn('advanceSilence')(function* (
  oldState: Silence,
  signal: Signal,
) {
  const audioBufferStore = yield* AudioBufferStore

  // While silent we can freely change the strength — no playback is scheduled,
  // we just remember the new base selection.
  if (StrengthData.models(signal))
    return Silence.make({ accord: oldState.accord, strength: signal.strength })

  let asset: AssetPointer
  if (PatternData.models(signal)) {
    asset = TaggedPatternPointer.make({
      pattern: signal.pattern,
      accord: oldState.accord,
      strength: oldState.strength,
    })
  } else {
    asset = TaggedSlowStrumPointer.make({
      accord: signal.accord,
      strength: oldState.strength,
    })
  }

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

  return TaggedPatternPointer.models(asset)
    ? new PlayingPattern({ playback, asset, playbackStartedAtSecond })
    : new PlayingSlowStrum({ playback, asset, playbackStartedAtSecond })
})
