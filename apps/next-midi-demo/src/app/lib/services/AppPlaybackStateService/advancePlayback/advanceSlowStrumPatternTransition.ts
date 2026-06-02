import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import type { AssetPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
  getAudioBufferDurationSeconds,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import type {
  PlayingPattern,
  PlayingSlowStrum,
  SlowStrumPatternTransition,
} from '../types/index.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advanceSlowStrumPatternTransition = Effect.fn(
  'advanceSlowStrumPatternTransition',
)(function* (
  oldState: SlowStrumPatternTransition,
  signal: Signal,
  _deps: AdvancePlaybackDeps,
) {
  const audioContext = yield* EAudioContext.EAudioContext
  const [slowStrum, queuedPattern] = oldState.transitionQueue

  if (Equal.equals(queuedPattern.asset, asset)) return oldState

  const secondsSinceAudioContextInit =
    yield* EAudioContext.currentTime(audioContext)

  yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
  yield* helpGarbageCollectionOfPlayback(queuedPattern.playback)

  if (Option.isNone(asset.pattern)) {
    // Pattern deselected again — start a new slow strum immediately
    const audioBuffer = yield* getAudioBufferOfAsset(asset)
    const newPlayback = yield* createOneshotPlayback(audioContext, audioBuffer)
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
  const audioBuffer = yield* getAudioBufferOfAsset(asset)
  const newPatternPlayback = yield* createLoopingPlayback(
    audioContext,
    audioBuffer,
  )
  yield* Effect.sync(() => {
    newPatternPlayback.gainNode.gain.setValueAtTime(
      maxLoudness,
      asEarlyAsPossibleInSeconds,
    )
    newPatternPlayback.bufferSource.start(secondsSinceAudioContextInit)
  })
  return {
    _tag: 'PlayingPattern' as const,
    playbackStartedAtSecond: secondsSinceAudioContextInit,
    transitionQueue: [{ asset, playback: newPatternPlayback }],
  } satisfies PlayingPattern
})
