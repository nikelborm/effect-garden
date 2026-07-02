import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { createLoopingPlayback } from '../playbackNodes/createLoopingPlayback.ts'
import { createOneshotPlayback } from '../playbackNodes/createOneshotPlayback.ts'
import type { AudioPlayback } from '../types/common.ts'

export interface FreshPlaybackTiming {
  readonly isLooping: boolean
  // when the buffer is started, at full volume, no fade
  readonly startAtSecond: number
}

// Creates and starts a single brand-new playback at full volume right now —
// no fade, no phase offset. Used only to leave pure silence, where there is
// no other playback yet to crossfade against. Never touches any OTHER
// playback.
export class StartFreshPlayback extends Context.Tag(
  'next-midi-demo/StartFreshPlayback',
)<
  StartFreshPlayback,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FreshPlaybackTiming,
  ) => Effect.Effect<AudioPlayback>
>() {
  static Live = Layer.effect(
    this,
    Effect.map(
      EAudioContext.EAudioContext,
      context =>
        (audioBuffer: EAudioBuffer.EAudioBuffer, timing: FreshPlaybackTiming) =>
          Effect.map(
            (timing.isLooping ? createLoopingPlayback : createOneshotPlayback)(
              context,
              audioBuffer,
            ),
            playback => {
              playback.gainNode.gain.setValueAtTime(
                maxLoudness,
                asEarlyAsPossibleInSeconds,
              )
              playback.bufferSource.start(timing.startAtSecond)
              return playback
            },
          ),
    ),
  )

  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FreshPlaybackTiming,
  ) => Effect.flatMap(this, startFresh => startFresh(audioBuffer, timing))
}
