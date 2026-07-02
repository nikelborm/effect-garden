import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { AudioPlayback } from '../types/common.ts'

export interface FreshPlaybackTiming {
  readonly isLooping: boolean
  // when the buffer is started, at full volume, no fade
  readonly startAtSecond: number
}

const createPlaybackGraph = (
  eAudioContext: EAudioContext.Instance,
  eAudioBuffer: EAudioBuffer.EAudioBuffer,
) =>
  Effect.sync<AudioPlayback>(() => {
    const audioBufferImplHack = eAudioBuffer as EAudioBuffer.EAudioBuffer & {
      _audioBuffer: AudioBuffer
    }
    const audioContextImplHack = eAudioContext as EAudioContext.Instance & {
      _audioContext: AudioContext
    }
    const audioContext = audioContextImplHack._audioContext
    const bufferSource = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    bufferSource.buffer = audioBufferImplHack._audioBuffer
    bufferSource.connect(gainNode)

    gainNode.connect(audioContext.destination)

    return AudioPlayback.make({ bufferSource, gainNode })
  })

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
          Effect.map(createPlaybackGraph(context, audioBuffer), playback => {
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

  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: FreshPlaybackTiming,
  ) => Effect.flatMap(this, startFresh => startFresh(audioBuffer, timing))
}
