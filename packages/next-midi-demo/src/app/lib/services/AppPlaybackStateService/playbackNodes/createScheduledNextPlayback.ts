import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import type * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'
import type { calcTimingsMath } from '../timingMath.ts'
import { createLoopingPlayback } from './createLoopingPlayback.ts'

export const createScheduledNextPlayback = (
  audioContext: EAudioContext.Instance,
  audioBuffer: EAudioBuffer.EAudioBuffer,
  math: ReturnType<typeof calcTimingsMath>,
) =>
  Effect.map(createLoopingPlayback(audioContext, audioBuffer), pb => {
    pb.gainNode.gain.setValueAtTime(minLoudness, asEarlyAsPossibleInSeconds)
    pb.gainNode.gain.setValueAtTime(minLoudness, math.playbackFadeoutStartsAt)
    pb.gainNode.gain.exponentialRampToValueAtTime(
      maxLoudness,
      math.playbackFadeoutEndsAt,
    )
    pb.bufferSource.start(
      math.secondsSinceAudioContextInit,
      math.secondsSinceLatestTrackLoopStart,
    )
    return pb
  })
