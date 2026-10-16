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

export interface FadeIntoLoopPlaybackTiming {
  readonly startAtSecond: number
  readonly bufferPhaseOffsetSeconds: number
  readonly fadeInStartsAtSecond: number
  readonly fadeInEndsAtSecond: number
}

export class ScheduleFadeIntoLoopPlayback extends Context.Service<
  ScheduleFadeIntoLoopPlayback,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FadeIntoLoopPlaybackTiming,
  ) => Effect.Effect<AudioPlayback, AudioContextInitError>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/ScheduleFadeIntoLoopPlayback',
) {
  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FadeIntoLoopPlaybackTiming,
  ) =>
    this.use(scheduleFadeIntoLoopPlayback =>
      scheduleFadeIntoLoopPlayback(audioBuffer, timing),
    )
}

export const ScheduleFadeIntoLoopPlaybackLayer =
  DeferredAudioContextService.pipe(
    Effect.map(
      audioContext =>
        (
          audioBuffer: EAudioBuffer.EAudioBuffer,
          timing: FadeIntoLoopPlaybackTiming,
        ) =>
          Effect.map(audioContext.createLoopPlayback(audioBuffer), playback => {
            playback.gainNode.gain.setValueAtTime(
              minLoudness,
              asEarlyAsPossibleInSeconds,
            )
            playback.gainNode.gain.setValueAtTime(
              minLoudness,
              timing.fadeInStartsAtSecond,
            )
            playback.gainNode.gain.exponentialRampToValueAtTime(
              maxLoudness,
              timing.fadeInEndsAtSecond,
            )
            playback.bufferSource.start(
              timing.startAtSecond,
              timing.bufferPhaseOffsetSeconds,
            )
            return playback
          }),
    ),
    Layer.effect(ScheduleFadeIntoLoopPlayback),
  )
