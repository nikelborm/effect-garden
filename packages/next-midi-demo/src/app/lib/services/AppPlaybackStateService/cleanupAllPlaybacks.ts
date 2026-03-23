import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'

import { minLoudness, transitionTimeInSeconds } from './constants.ts'
import { helpGarbageCollectionOfPlayback } from './playbackNodes/index.ts'
import type { PlayingAppPlaybackStates } from './types.ts'

export const makeCleanupAllPlaybacks = (audioContext: EAudioContext.Instance) =>
  Effect.fn(function* (state: PlayingAppPlaybackStates) {
    const secondsSinceAudioContextInit =
      yield* EAudioContext.currentTime(audioContext)

    yield* Effect.forEach(
      state.transitionQueue.map(_ => _.playback),
      playback => {
        playback.gainNode.gain.exponentialRampToValueAtTime(
          minLoudness,
          secondsSinceAudioContextInit + transitionTimeInSeconds,
        )

        return helpGarbageCollectionOfPlayback(playback).pipe(
          Effect.delay(Duration.seconds(transitionTimeInSeconds + 0.1)),
        )
      },
      { discard: true },
    ).pipe(Effect.tapErrorCause(Effect.logError), Effect.forkDaemon)
  })
