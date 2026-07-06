import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import {
  asEarlyAsPossibleInSeconds,
  maxLoudness,
  minLoudness,
} from '../constants.ts'
import { AudioPlayback } from '../types/common.ts'
import type { Slot } from '../zones.ts'

export interface ScheduledNextPlaybackTiming {
  readonly startAtSecond: number

  readonly bufferPhaseOffsetSeconds: number

  readonly slot: Slot
}

const createLoopingPlaybackGraph = (
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
    bufferSource.loop = true

    gainNode.connect(audioContext.destination)

    return AudioPlayback.make({ bufferSource, gainNode })
  })

export class ScheduleIncomingLoop extends Context.Tag(
  'next-midi-demo/ScheduleIncomingLoop',
)<
  ScheduleIncomingLoop,
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) => Effect.Effect<AudioPlayback>
>() {
  static Live = Layer.effect(
    this,
    Effect.map(
      EAudioContext.EAudioContext,
      context =>
        (
          audioBuffer: EAudioBuffer.EAudioBuffer,
          timing: ScheduledNextPlaybackTiming,
        ) =>
          Effect.map(
            createLoopingPlaybackGraph(context, audioBuffer),
            playback => {
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
            },
          ),
    ),
  )

  static run = (
    audioBuffer: EAudioBuffer.EAudioBuffer,
    timing: ScheduledNextPlaybackTiming,
  ) =>
    Effect.flatMap(this, scheduleIncoming =>
      scheduleIncoming(audioBuffer, timing),
    )
}
