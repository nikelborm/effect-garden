import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { scheduleFadeOutOf } from '../playbackNodes/scheduleFadeOutOf.ts'
import type { AudioPlayback } from '../types/common.ts'
import type { Slot } from '../zones.ts'

// Ramps a single playback's gain down to silence across a slot. Never
// touches any OTHER playback.
export class ScheduleFadeOut extends Context.Tag(
  'next-midi-demo/ScheduleFadeOut',
)<
  ScheduleFadeOut,
  (playback: AudioPlayback, slot: Slot) => Effect.Effect<void>
>() {
  static Live = Layer.succeed(this, scheduleFadeOutOf)

  static run = (playback: AudioPlayback, slot: Slot) =>
    Effect.flatMap(this, scheduleFadeOut => scheduleFadeOut(playback, slot))
}
