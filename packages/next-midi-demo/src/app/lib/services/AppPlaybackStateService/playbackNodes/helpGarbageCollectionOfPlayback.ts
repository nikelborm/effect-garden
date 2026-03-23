import * as Effect from 'effect/Effect'

import type { AudioPlayback } from '../types.ts'

export const helpGarbageCollectionOfPlayback = ({
  bufferSource,
  gainNode,
}: AudioPlayback) =>
  Effect.sync(() => {
    bufferSource.stop()
    bufferSource.disconnect()
    gainNode.gain.cancelScheduledValues(0)
    gainNode.disconnect()
  })
