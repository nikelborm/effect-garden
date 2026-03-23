import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import type * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

export const createPlayback = (
  eAudioContext: EAudioContext.Instance,
  eAudioBuffer: EAudioBuffer.EAudioBuffer,
) =>
  Effect.sync(() => {
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

    return { bufferSource, gainNode } as const
  })
