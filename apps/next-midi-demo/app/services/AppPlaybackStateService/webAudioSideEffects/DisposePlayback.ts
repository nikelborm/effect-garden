import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioPlayback } from '../types/common.ts'

export class DisposePlayback extends Context.Tag(
  'next-midi-demo/DisposePlayback',
)<DisposePlayback, (playback: AudioPlayback) => Effect.Effect<void>>() {
  static Live = Layer.succeed(
    this,
    ({ bufferSource, gainNode }: AudioPlayback) =>
      Effect.sync(() => {
        bufferSource.stop()
        bufferSource.disconnect()
        gainNode.gain.cancelScheduledValues(0)
        gainNode.disconnect()
      }),
  )

  static run = (playback: AudioPlayback) =>
    Effect.flatMap(this, dispose => dispose(playback))
}
