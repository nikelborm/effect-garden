import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import type * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'
import { createLoopingPlayback } from './createLoopingPlayback.ts'

export const createLoopScheduledAfterSingleShot = (
  audioContext: EAudioContext.Instance,
  audioBuffer: EAudioBuffer.EAudioBuffer,
  singleShotEndsAtSecond: number,
) =>
  Effect.map(createLoopingPlayback(audioContext, audioBuffer), pb => {
    pb.gainNode.gain.setValueAtTime(minLoudness, asEarlyAsPossibleInSeconds)
    pb.gainNode.gain.setValueAtTime(maxLoudness, singleShotEndsAtSecond)
    pb.bufferSource.start(singleShotEndsAtSecond)
    return pb
  })
