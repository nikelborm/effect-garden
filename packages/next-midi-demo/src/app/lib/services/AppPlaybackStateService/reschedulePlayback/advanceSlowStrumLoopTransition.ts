import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import type {
  PlayingLoop,
  PlayingSlowStrum,
  SlowStrumLoopTransition,
} from '../types/index.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const advanceSlowStrumLoopTransition = Effect.fn(
  'advanceSlowStrumLoopTransition',
)(function* (
  oldState: SlowStrumLoopTransition,
  asset: AssetPointer,
  deps: ReschedulePlaybackDeps,
) {
  const [slowStrum, queuedLoop] = oldState.transitionQueue

  if (Equal.equals(queuedLoop.asset, asset)) return oldState

  // Asset changed while waiting for slow strum to finish → interrupt slow strum, start loop now
  const secondsSinceAudioContextInit = yield* EAudioContext.currentTime(
    deps.audioContext,
  )
  yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
  // Cancel the already-scheduled loop playback
  yield* helpGarbageCollectionOfPlayback(queuedLoop.playback)

  if (Option.isNone(asset.pattern)) {
    // Pattern deselected again — start a new slow strum immediately
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

  // New pattern/accord: start loop immediately
  const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)
  const newLoopPlayback = yield* createLoopingPlayback(
    deps.audioContext,
    audioBuffer,
  )
  yield* Effect.sync(() => {
    newLoopPlayback.gainNode.gain.setValueAtTime(
      maxLoudness,
      asEarlyAsPossibleInSeconds,
    )
    newLoopPlayback.bufferSource.start(secondsSinceAudioContextInit)
  })
  return {
    _tag: 'PlayingLoop' as const,
    playbackStartedAtSecond: secondsSinceAudioContextInit,
    transitionQueue: [{ asset, playback: newLoopPlayback }],
  } satisfies PlayingLoop
})
