import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createLoopingPlayback,
  createOneshotPlayback,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import { PlayingPattern } from '../types/PlayingPattern.ts'
import { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import type { SlowStrumPatternTransition } from '../types/SlowStrumPatternTransition.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advanceSlowStrumPatternTransition = Effect.fn(
  'advanceSlowStrumPatternTransition',
)(function* (
  oldState: SlowStrumPatternTransition,
  signal: Signal,
  deps: AdvancePlaybackDeps,
) {
  // const audioContext = yield* EAudioContext.EAudioContext
  // const [slowStrum, queuedPattern] = oldState.transitionQueue

  // if (Equal.equals(queuedPattern.asset, asset)) return oldState

  // const secondsSinceAudioContextInit =
  //   yield* EAudioContext.currentTime(audioContext)

  // yield* helpGarbageCollectionOfPlayback(slowStrum.playback)
  // yield* helpGarbageCollectionOfPlayback(queuedPattern.playback)

  // if (Option.isNone(asset.pattern)) {
  //   // Pattern deselected again — start a new slow strum immediately
  //   const audioBuffer = yield* getAudioBufferOfAsset(asset)
  //   const newPlayback = yield* createOneshotPlayback(audioContext, audioBuffer)
  //   yield* Effect.sync(() => {
  //     newPlayback.gainNode.gain.setValueAtTime(
  //       maxLoudness,
  //       asEarlyAsPossibleInSeconds,
  //     )
  //     newPlayback.bufferSource.start(secondsSinceAudioContextInit)
  //   })
  //   return PlayingSlowStrum.make({
  //     playbackStartedAtSecond: secondsSinceAudioContextInit,
  //     asset,
  //     playback: newPlayback,
  //   })
  // }

  // // New pattern/accord: start loop immediately
  // const audioBuffer = yield* getAudioBufferOfAsset(asset)
  // const newPatternPlayback = yield* createLoopingPlayback(
  //   audioContext,
  //   audioBuffer,
  // )
  // yield* Effect.sync(() => {
  //   newPatternPlayback.gainNode.gain.setValueAtTime(
  //     maxLoudness,
  //     asEarlyAsPossibleInSeconds,
  //   )
  //   newPatternPlayback.bufferSource.start(secondsSinceAudioContextInit)
  // })
  // return PlayingPattern.make({
  //   playbackStartedAtSecond: secondsSinceAudioContextInit,
  //   asset,
  //   playback: newPatternPlayback,
  // })

  yield* Effect.logError({ oldState, signal, deps })
  return yield* Effect.dieMessage('not implemented')
})
