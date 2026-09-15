import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { maxLoudness, minLoudness } from '../constants.ts'
import type { AudioPlayback } from '../types/common.ts'
import type { Slot } from '../zones.ts'

export class ScheduleFadeOut extends Context.Service<
  ScheduleFadeOut,
  (playback: AudioPlayback, slot: Slot) => Effect.Effect<void>
>()('next-midi-demo/ScheduleFadeOut') {
  static Live = Layer.succeed(this, (playback: AudioPlayback, slot: Slot) =>
    Effect.sync(() => {
      playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        slot.fadeoutStartsAtSecond,
      )
      playback.gainNode.gain.exponentialRampToValueAtTime(
        minLoudness,
        slot.fadeoutEndsAtSecond,
      )
    }),
  )

  static run = (playback: AudioPlayback, slot: Slot) =>
    Effect.flatMap(this, scheduleFadeOut => scheduleFadeOut(playback, slot))
}
