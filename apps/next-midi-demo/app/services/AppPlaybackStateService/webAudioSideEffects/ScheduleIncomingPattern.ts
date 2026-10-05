import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioContextInitError } from '../../DeferredAudioContextService.ts'
import { DeferredAudioContextService } from '../../DeferredAudioContextService.ts'
import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'
import type { AudioPlayback } from '../types/common.ts'
import type { Slot } from '../zones.ts'

export interface ScheduledNextPlaybackTiming {
  readonly startAtSecond: number

  readonly bufferPhaseOffsetSeconds: number

  readonly slot: Slot
}

export class ScheduleIncomingPattern extends Context.Service<
  ScheduleIncomingPattern,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) => Effect.Effect<AudioPlayback, AudioContextInitError>
>()('next-midi-demo/ScheduleIncomingPattern') {
  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) => this.use(scheduleIncoming => scheduleIncoming(audioBuffer, timing))
}

export const ScheduleIncomingPatternLayer = Layer.effect(
  ScheduleIncomingPattern,
  Effect.map(
    DeferredAudioContextService,
    context =>
      (
        audioBuffer: EAudioBuffer.EAudioBuffer,
        timing: ScheduledNextPlaybackTiming,
      ) =>
        Effect.map(context.createLoopPlayback(audioBuffer), playback => {
          playback.gainNode.gain.setValueAtTime(
            minLoudness,
            asEarlyAsPossibleInSeconds,
          )
          playback.gainNode.gain.setValueAtTime(
            minLoudness,
            timing.slot.fadeoutStartsAtSecond,
          )
          playback.gainNode.gain.exponentialRampToValueAtTime(
            maxLoudness,
            timing.slot.fadeoutEndsAtSecond,
          )
          playback.bufferSource.start(
            timing.startAtSecond,
            timing.bufferPhaseOffsetSeconds,
          )
          return playback
        }),
  ),
)
