import * as Effect from 'effect/Effect'

import { DeferredAudioContextService } from '../DeferredAudioContextService.ts'
import type { AppPlaybackState } from './types/index.ts'

export const cleanupAllPlaybacks = Effect.fn('cleanupAllPlaybacks')(function* (
  state: AppPlaybackState,
) {
  const audioContext = yield* DeferredAudioContextService
  const _secondsSinceAudioContextInit = yield* audioContext.currentTime

  // yield* Effect.forEach(
  //   state.transitionQueue.map(_ => _.playback),
  //   playback => {
  //     playback.gainNode.gain.exponentialRampToValueAtTime(
  //       minLoudness,
  //       secondsSinceAudioContextInit + transitionTimeInSeconds,
  //     )

  //     return helpGarbageCollectionOfPlayback(playback).pipe(
  //       Effect.delay(Duration.seconds(transitionTimeInSeconds + 0.1)),
  //     )
  //   },
  //   { discard: true },
  // ).pipe(Effect.tapCause(Effect.logError), Effect.forkDaemon)

  yield* Effect.logError(state)
  return yield* Effect.die(new Error('not implemented'))
})
