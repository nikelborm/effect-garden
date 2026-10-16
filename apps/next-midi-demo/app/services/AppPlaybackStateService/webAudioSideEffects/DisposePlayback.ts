import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioPlayback } from '../common.ts'

export class DisposePlayback extends Context.Service<
  DisposePlayback,
  (playback: AudioPlayback) => Effect.Effect<void>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/DisposePlayback',
) {
  static run = (playback: AudioPlayback) =>
    this.use(dispose => dispose(playback))
}

export const DisposePlaybackLayer = Layer.succeed(
  DisposePlayback,
  ({ bufferSource, gainNode }: AudioPlayback) =>
    Effect.sync(() => {
      bufferSource.stop()
      bufferSource.disconnect()
      gainNode.gain.cancelScheduledValues(0)
      gainNode.disconnect()
    }),
)
