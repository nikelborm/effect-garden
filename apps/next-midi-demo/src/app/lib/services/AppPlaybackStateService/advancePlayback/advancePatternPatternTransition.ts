import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'
import * as Struct from 'effect/Struct'

import type { AssetPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { maxLoudness } from '../constants.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import {
  createScheduledNextPlayback,
  helpGarbageCollectionOfPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import type {
  PatternPatternPatternTransition,
  PatternPatternSilenceTransition,
  PatternPatternTransition,
  PatternSilenceTransition,
  PlayingPattern,
} from '../types/index.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advancePatternPatternTransition = Effect.fn(
  'advancePatternPatternTransition',
)(function* (
  oldState: PatternPatternTransition,
  signal: Signal,
  deps: AdvancePlaybackDeps,
) {
  const [current, latest] = oldState.transitionQueue

  if (Equal.equals(latest.asset, asset)) return oldState

  const audioContext = yield* EAudioContext.EAudioContext

  const secondsSinceAudioContextInit =
    yield* EAudioContext.currentTime(audioContext)

  const math = calcTimingsMath(
    oldState.playbackStartedAtSecond,
    secondsSinceAudioContextInit,
  )

  if (Option.isNone(asset.pattern)) {
    if (math.fitsIntoBufferOfClosestTransition) {
      // Pattern deselected before transition — cancel latest, keep current fading to silence
      yield* helpGarbageCollectionOfPlayback(latest.playback)
      return {
        _tag: 'PatternSilenceTransition' as const,
        playbackStartedAtSecond: oldState.playbackStartedAtSecond,
        transitionQueue: [current],
      } satisfies PatternSilenceTransition
    }
    // Transition already in progress — latest is fading in; schedule its fade-out too
    yield* scheduleFadeOutOf(latest.playback, math)
    return {
      _tag: 'PatternPatternSilenceTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        current,
        {
          ...latest,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
        },
      ],
    } satisfies PatternPatternSilenceTransition
  }

  if (
    math.fitsIntoBufferOfClosestTransition &&
    Equal.equals(current.asset, asset)
  ) {
    yield* Effect.sync(() => {
      current.playback.gainNode.gain.cancelScheduledValues(
        secondsSinceAudioContextInit,
      )
      current.playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        secondsSinceAudioContextInit,
      )
    })
    yield* current.cleanupFiberToolkit.cancelCleanup
    yield* helpGarbageCollectionOfPlayback(latest.playback)
    return {
      _tag: 'PlayingPattern',
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [Struct.pick(current, 'asset', 'playback')],
    } satisfies PlayingPattern
  }

  const audioBuffer = yield* getAudioBufferOfAsset(asset)
  const playback = yield* createScheduledNextPlayback(
    audioContext,
    audioBuffer,
    math,
  )

  if (!math.fitsIntoBufferOfClosestTransition) {
    yield* scheduleFadeOutOf(latest.playback, math)
    return {
      _tag: 'PatternPatternPatternTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        current,
        {
          ...latest,
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
        },
        { asset, playback },
      ],
    } satisfies PatternPatternPatternTransition
  }

  return {
    _tag: 'PatternPatternTransition' as const,
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [current, { asset, playback }],
  } satisfies PatternPatternTransition
})
