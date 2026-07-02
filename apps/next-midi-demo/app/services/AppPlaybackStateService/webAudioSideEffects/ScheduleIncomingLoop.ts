import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import {
  createScheduledNextPlayback,
  type ScheduledNextPlaybackTiming,
} from '../playbackNodes/createScheduledNextPlayback.ts'
import type { AudioPlayback } from '../types/common.ts'

export type { ScheduledNextPlaybackTiming }

// Creates and starts a single brand-new looping playback, silent until its
// fade-in window and ramped to full volume by the end of it — the incoming
// half of a crossfade. Never touches any OTHER playback.
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
      context => (audioBuffer, timing) =>
        createScheduledNextPlayback(context, audioBuffer, timing),
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
