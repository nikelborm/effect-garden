import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioPlayback } from '../common.ts'
import { maxLoudness, minLoudness } from '../constants.ts'
import { makePassthroughAccessor } from './makePassthroughAccessor.ts'

export interface FadeoutTiming {
  readonly fadeoutStartsAtSecond: number
  readonly fadeoutEndsAtSecond: number
}

export class ScheduleFadeOut extends Context.Service<
  ScheduleFadeOut,
  (playback: AudioPlayback, timing: FadeoutTiming) => Effect.Effect<void>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/ScheduleFadeOut',
) {
  static run = makePassthroughAccessor(this)
}

export const ScheduleFadeOutLayer = Layer.succeed(
  ScheduleFadeOut,
  (playback: AudioPlayback, timing: FadeoutTiming) =>
    Effect.sync(() => {
      playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        timing.fadeoutStartsAtSecond,
      )
      playback.gainNode.gain.exponentialRampToValueAtTime(
        minLoudness,
        timing.fadeoutEndsAtSecond,
      )
    }),
)
