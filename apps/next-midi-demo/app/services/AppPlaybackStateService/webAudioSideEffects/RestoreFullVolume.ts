import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { maxLoudness } from '../constants.ts'
import type { AudioPlayback } from '../types/common.ts'

// Wipes a single playback's scheduled gain ramp and pins it back to full
// volume right now — the "un-fade" used to revive a loop mid-transition.
// Never touches any OTHER playback.
export class RestoreFullVolume extends Context.Tag(
  'next-midi-demo/RestoreFullVolume',
)<
  RestoreFullVolume,
  (playback: AudioPlayback, atSecond: number) => Effect.Effect<void>
>() {
  static Live = Layer.succeed(this, (playback, atSecond) =>
    Effect.sync(() => {
      playback.gainNode.gain.cancelScheduledValues(atSecond)
      playback.gainNode.gain.setValueAtTime(maxLoudness, atSecond)
    }),
  )

  static run = (playback: AudioPlayback, atSecond: number) =>
    Effect.flatMap(this, restore => restore(playback, atSecond))
}
