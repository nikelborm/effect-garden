import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import type { CurrentSelectedAsset } from '../../CurrentlySelectedAssetState.ts'
import {
  createLoopScheduledAfterSlowStrum,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import type {
  PlayingSlowStrum,
  ScheduledSlowStrumToLoopTransition,
} from '../types.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const fromPlayingSlowStrum = Effect.fn('fromPlayingSlowStrum')(
  function* (
    oldState: PlayingSlowStrum,
    asset: CurrentSelectedAsset,
    deps: ReschedulePlaybackDeps,
  ) {
    const [current] = oldState.transitionQueue

    if (Equal.equals(current.asset, asset)) return oldState

    if (Option.isNone(asset.pattern)) {
      // Different accord/strength → interrupt immediately, start new slow strum
      const secondsSinceAudioContextInit = yield* EAudioContext.currentTime(
        deps.audioContext,
      )
      yield* helpGarbageCollectionOfPlayback(current.playback)
      const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)
      const newPlayback = yield* createOneshotPlayback(
        deps.audioContext,
        audioBuffer,
      )
      yield* Effect.sync(() => {
        newPlayback.gainNode.gain.setValueAtTime(
          maxLoudness,
          asEarlyAsPossibleInSeconds,
        )
        newPlayback.bufferSource.start(secondsSinceAudioContextInit)
      })
      const durationSeconds = getAudioBufferDurationSeconds(audioBuffer)
      return {
        _tag: 'PlayingSlowStrum' as const,
        playbackStartedAtSecond: secondsSinceAudioContextInit,
        transitionQueue: [{ asset, playback: newPlayback, durationSeconds }],
      } satisfies PlayingSlowStrum
    }

    // Pattern was selected while slow strum is playing → schedule loop to start after slow strum ends
    const slowStrumEndsAtSecond =
      oldState.playbackStartedAtSecond + current.durationSeconds
    const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)
    const newLoopPlayback = yield* createLoopScheduledAfterSlowStrum(
      deps.audioContext,
      audioBuffer,
      slowStrumEndsAtSecond,
    )
    return {
      _tag: 'ScheduledSlowStrumToLoopTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [current, { asset, playback: newLoopPlayback }],
    } satisfies ScheduledSlowStrumToLoopTransition
  },
)
