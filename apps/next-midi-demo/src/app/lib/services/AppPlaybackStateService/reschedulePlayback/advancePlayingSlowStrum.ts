import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createLoopScheduledAfterSlowStrum,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import type {
  PlayingSlowStrum,
  SlowStrumLoopTransition,
} from '../types/index.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const advancePlayingSlowStrum = Effect.fn('advancePlayingSlowStrum')(
  function* (
    oldState: PlayingSlowStrum,
    asset: AssetPointer,
    deps: ReschedulePlaybackDeps,
  ) {
    const audioContext = yield* EAudioContext.EAudioContext
    const [current] = oldState.transitionQueue

    if (Equal.equals(current.asset, asset)) return oldState

    if (Option.isNone(asset.pattern)) {
      // Different accord/strength → interrupt immediately, start new slow strum
      const secondsSinceAudioContextInit =
        yield* EAudioContext.currentTime(audioContext)
      yield* helpGarbageCollectionOfPlayback(current.playback)
      const audioBuffer = yield* getAudioBufferOfAsset(asset)
      const newPlayback = yield* createOneshotPlayback(
        audioContext,
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
    const audioBuffer = yield* getAudioBufferOfAsset(asset)
    const newLoopPlayback = yield* createLoopScheduledAfterSlowStrum(
      audioContext,
      audioBuffer,
      slowStrumEndsAtSecond,
    )
    return {
      _tag: 'SlowStrumLoopTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [current, { asset, playback: newLoopPlayback }],
    } satisfies SlowStrumLoopTransition
  },
)
