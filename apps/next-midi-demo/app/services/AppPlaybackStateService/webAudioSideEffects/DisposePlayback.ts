import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { helpGarbageCollectionOfPlayback } from '../playbackNodes/helpGarbageCollectionOfPlayback.ts'
import type { AudioPlayback } from '../types/common.ts'

// Stops and disconnects a single playback's nodes. Terminal — the playback
// is never scheduled again afterward. Never touches any OTHER playback.
export class DisposePlayback extends Context.Tag(
  'next-midi-demo/DisposePlayback',
)<DisposePlayback, (playback: AudioPlayback) => Effect.Effect<void>>() {
  static Live = Layer.succeed(this, helpGarbageCollectionOfPlayback)

  static run = (playback: AudioPlayback) =>
    Effect.flatMap(this, dispose => dispose(playback))
}
