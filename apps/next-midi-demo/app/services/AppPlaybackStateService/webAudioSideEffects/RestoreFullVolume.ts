import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { maxLoudness } from '../constants.ts'
import type { AudioPlayback } from '../common.ts'

export class RestoreFullVolume extends Context.Service<
  RestoreFullVolume,
  (playback: AudioPlayback, atSecond: number) => Effect.Effect<void>
>()('next-midi-demo/RestoreFullVolume') {
  static run = (playback: AudioPlayback, atSecond: number) =>
    this.use(restore => restore(playback, atSecond))
}

export const RestoreFullVolumeLayer = Layer.succeed(
  RestoreFullVolume,
  (playback, atSecond) =>
    Effect.sync(() => {
      playback.gainNode.gain.cancelScheduledValues(atSecond)
      playback.gainNode.gain.setValueAtTime(maxLoudness, atSecond)
    }),
)
