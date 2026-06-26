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
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import type { Signal } from './signal.ts'

// Pure silence (queue = []). The carried base accord+strength are passed in.
export const advanceSilence = Effect.fn('advanceSilence')(function* (
  accord: SilenceBoundPlayback['accord'],
  strength: SilenceBoundPlayback['strength'],
  signal: Signal,
) {
  // While silent we can freely change the strength — no playback is scheduled,
  // we just remember the new base selection.
  if (StrengthData.models(signal))
    return SilenceBoundPlayback.make({
      accord,
      strength: signal.strength,
      transitionQueue: [],
    })

  const audioBufferStore = yield* AudioBufferStore

  let asset: AssetPointer
  if (PatternData.models(signal)) {
    asset = TaggedPatternPointer.make({
      pattern: signal.pattern,
      accord,
      strength,
    })
  } else {
    asset = TaggedSlowStrumPointer.make({ accord: signal.accord, strength })
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

  // Branch (rather than a ternary inside the tuple) so the single element lands
  // on the right one-element queue union member.
  if (TaggedPatternPointer.models(asset))
    return LoopBoundPlayback.make({
      playbackStartedAtSecond,
      transitionQueue: [
        PlayingLoopPlayback.make({ asset, playback, playbackStartedAtSecond }),
      ],
    })
  return LoopBoundPlayback.make({
    playbackStartedAtSecond,
    transitionQueue: [
      PlayingSlowStrum.make({ asset, playback, playbackStartedAtSecond }),
    ],
  })
})
