import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'

export const getAudioBufferDurationSeconds = (
  audioBuffer: EAudioBuffer.EAudioBuffer,
) =>
  (
    audioBuffer as EAudioBuffer.EAudioBuffer & {
      _audioBuffer: AudioBuffer
    }
  )._audioBuffer.duration
