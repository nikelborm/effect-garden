import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import type { AppPlaybackState } from './types/index.ts'

export const cleanupAllPlaybacks = Effect.fn('cleanupAllPlaybacks')(function* (
  state: AppPlaybackState,
) {
  const audioContext = yield* EAudioContext.EAudioContext
  const _secondsSinceAudioContextInit =
    yield* EAudioContext.currentTime(audioContext)

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
  // ).pipe(Effect.tapErrorCause(Effect.logError), Effect.forkDaemon)

  yield* Effect.logError(state)
  return yield* Effect.dieMessage('not implemented')
})
