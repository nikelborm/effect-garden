import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioContextInitError } from '../../DeferredAudioContextService.ts'
import { DeferredAudioContextService } from '../../DeferredAudioContextService.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import type { AudioPlayback } from '../common.ts'

export interface FreshPlaybackTiming {
  readonly isLooping: boolean
  readonly startAtSecond: number
}

export class StartFreshPlayback extends Context.Service<
  StartFreshPlayback,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FreshPlaybackTiming,
  ) => Effect.Effect<AudioPlayback, AudioContextInitError>
>()('next-midi-demo/StartFreshPlayback') {
  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FreshPlaybackTiming,
  ) => this.use(startFresh => startFresh(audioBuffer, timing))
}

export const StartFreshPlaybackLayer = Layer.effect(
  StartFreshPlayback,
  Effect.map(
    DeferredAudioContextService,
    context =>
      (audioBuffer: EAudioBuffer.EAudioBuffer, timing: FreshPlaybackTiming) =>
        Effect.map(context.createPlayback(audioBuffer), playback => {
          playback.bufferSource.loop = timing.isLooping
          playback.gainNode.gain.setValueAtTime(
            maxLoudness,
            asEarlyAsPossibleInSeconds,
          )
          playback.bufferSource.start(timing.startAtSecond)
          return playback
        }),
  ),
)
