import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import { asEarlyAsPossibleInSeconds, maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createLoopScheduledAfterSingleShot,
  createOneshotPlayback,
  helpGarbageCollectionOfPlayback,
} from '../playbackNodes/index.ts'
import { PatternTransitionQueueElement } from '../types/common.ts'
import type { PlayingSlowStrum } from '../types/PlayingSlowStrum.ts'
import { SlowStrumPatternTransition } from '../types/SlowStrumPatternTransition.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advancePlayingSlowStrum = Effect.fn('advancePlayingSlowStrum')(
  function* (
    oldState: PlayingSlowStrum,
    signal: Signal,
    deps: AdvancePlaybackDeps,
  ) {
    // const audioContext = yield* EAudioContext.EAudioContext
    // const [current] = oldState.transitionQueue

    // if (Equal.equals(current.asset, asset)) return oldState

    // if (Option.isNone(asset.pattern)) {
    //   // Different accord/strength → interrupt immediately, start new slow strum
    //   const secondsSinceAudioContextInit =
    //     yield* EAudioContext.currentTime(audioContext)
    //   yield* helpGarbageCollectionOfPlayback(current.playback)
    //   const audioBuffer = yield* getAudioBufferOfAsset(asset)
    //   const newPlayback = yield* createOneshotPlayback(
    //     audioContext,
    //     audioBuffer,
    //   )
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

    // // Pattern was selected while slow strum is playing → schedule loop to start after slow strum ends
    // const slowStrumEndsAtSecond =
    //   oldState.playbackStartedAtSecond + current.durationSeconds
    // const audioBuffer = yield* getAudioBufferOfAsset(asset)
    // const newPatternPlayback = yield* createLoopScheduledAfterSingleShot(
    //   audioContext,
    //   audioBuffer,
    //   slowStrumEndsAtSecond,
    // )
    // return SlowStrumPatternTransition.make({
    //   playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    //   transitionQueue: [
    //     current,
    //     PatternTransitionQueueElement.make({
    //       asset,
    //       playback: newPatternPlayback,
    //     }),
    //   ],
    // })

    yield* Effect.logError({ oldState, signal, deps })
    return yield* Effect.dieMessage('not implemented')
  },
)
