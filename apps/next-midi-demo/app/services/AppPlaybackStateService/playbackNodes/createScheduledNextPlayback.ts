import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'
import type { Slot } from '../zones.ts'
import { createLoopingPlayback } from './createLoopingPlayback.ts'

export interface ScheduledNextPlaybackTiming {
  // when the buffer is started (silently) — usually `now`
  readonly startAtSecond: number
  // track-phase offset into the buffer so the new loop stays grid-aligned
  readonly bufferPhaseOffsetSeconds: number
  // the fade-in window: silent until fadeoutStartsAtSecond, full by fadeoutEndsAtSecond
  readonly slot: Slot
}

export const createScheduledNextPlayback = (
  audioContext: EAudioContext.Instance,
  audioBuffer: EAudioBuffer.EAudioBuffer,
  timing: ScheduledNextPlaybackTiming,
) =>
  Effect.map(createLoopingPlayback(audioContext, audioBuffer), pb => {
    pb.gainNode.gain.setValueAtTime(minLoudness, asEarlyAsPossibleInSeconds)
    pb.gainNode.gain.setValueAtTime(
      minLoudness,
      timing.slot.fadeoutStartsAtSecond,
    )
    pb.gainNode.gain.exponentialRampToValueAtTime(
      maxLoudness,
      timing.slot.fadeoutEndsAtSecond,
    )
    pb.bufferSource.start(timing.startAtSecond, timing.bufferPhaseOffsetSeconds)
    return pb
  })

export const createScheduledNextPlaybackInContext = (
  audioBuffer: EAudioBuffer.EAudioBuffer,
  timing: ScheduledNextPlaybackTiming,
) =>
  Effect.flatMap(EAudioContext.EAudioContext, context =>
    createScheduledNextPlayback(context, audioBuffer, timing),
  )
