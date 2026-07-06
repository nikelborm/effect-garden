import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { maxLoudness } from '../constants.ts'
import type { AudioPlayback } from '../types/common.ts'

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
