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
import type {
  BlissfulGridTimingsMathAtAnyQuant,
  BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { makePassthroughAccessor } from './makePassthroughAccessor.ts'

export interface FadeIntoLoopPlaybackTiming {
  readonly startAtSecond: number
  readonly skippedSecondsDuringStart: number
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
  static runBoundaryQuantMath = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    math: BlissfulGridTimingsMathAtLastQuant,
  ) =>
    // To be fair it doesnt even need a scheduled fade-in at all since it just
    // starts playing from the beginning
    this.runFromMath(audioBuffer, math, {
      startAtSecond:
        math.patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
      skippedSecondsDuringStart: 0,
    })

  static runMiddleQuantMath = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    math: BlissfulGridTimingsMathAtMiddleQuant,
  ) =>
    this.runFromMath(audioBuffer, math, {
      // TODO: we can do better than immediate "now"?
      startAtSecond: math.secondsDecimalNowPassedSinceAudioContextInit,
      skippedSecondsDuringStart:
        math.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
    })

  static runFromMath = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    math: BlissfulGridTimingsMathAtAnyQuant,
    other: { startAtSecond: number; skippedSecondsDuringStart: number },
  ) =>
    this.run(audioBuffer, {
      ...other,
      fadeInStartsAtSecond:
        math.patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
      fadeInEndsAtSecond:
        math.patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
    })

  static run = makePassthroughAccessor(this)
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
              timing.skippedSecondsDuringStart,
            )
            return playback
          }),
    ),
    Layer.effect(ScheduleFadeIntoLoopPlayback),
  )
