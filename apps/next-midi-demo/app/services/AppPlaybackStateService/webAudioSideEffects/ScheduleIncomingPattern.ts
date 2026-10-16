import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioContextInitError } from '../../DeferredAudioContextService.ts'
import { DeferredAudioContextService } from '../../DeferredAudioContextService.ts'
import type { AudioPlayback } from '../common.ts'
import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'

export interface ScheduledNextPlaybackTiming {
  readonly startAtSecond: number

  readonly bufferPhaseOffsetSeconds: number

  readonly patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit: number

  readonly patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit: number
}

export class ScheduleIncomingPattern extends Context.Service<
  ScheduleIncomingPattern,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) => Effect.Effect<AudioPlayback, AudioContextInitError>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/ScheduleIncomingPattern',
) {
  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) => this.use(scheduleIncoming => scheduleIncoming(audioBuffer, timing))
}
export const ScheduleIncomingPatternLayer = DeferredAudioContextService.pipe(
  Effect.map(
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
            timing.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
          )
          playback.gainNode.gain.exponentialRampToValueAtTime(
            maxLoudness,
            timing.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
          )
          playback.bufferSource.start(
            timing.startAtSecond,
            timing.bufferPhaseOffsetSeconds,
          )
          return playback
        }),
  ),
  Layer.effect(ScheduleIncomingPattern),
)
