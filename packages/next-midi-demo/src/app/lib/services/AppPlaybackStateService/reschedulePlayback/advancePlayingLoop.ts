import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Option from 'effect/Option'

import type { AssetPointer } from '../../../audioAssetHelpers.ts'
import {
  createScheduledNextPlayback,
  scheduleFadeOutOf,
} from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import type {
  LoopToLoopTransition,
  LoopToSilenceTransition,
  PlayingLoop,
} from '../types/index.ts'
import type { ReschedulePlaybackDeps } from './deps.ts'

export const advancePlayingLoop = Effect.fn('advancePlayingLoop')(function* (
  oldState: PlayingLoop,
  asset: AssetPointer,
  deps: ReschedulePlaybackDeps,
) {
  const [current] = oldState.transitionQueue

  if (Equal.equals(current.asset, asset)) return oldState

  if (Option.isNone(asset.pattern)) {
    // Pattern was deselected while loop was playing — fade out to silence
    const math = calcTimingsMath(
      oldState.playbackStartedAtSecond,
      yield* EAudioContext.currentTime(deps.audioContext),
    )
    yield* scheduleFadeOutOf(current.playback, math)
    return {
      _tag: 'LoopToSilenceTransition' as const,
      playbackStartedAtSecond: oldState.playbackStartedAtSecond,
      transitionQueue: [
        {
          ...current,
          cleanupFiberToolkit: yield* deps.makeCleanupFibers(
            math.secondsSinceNowUpUntilFadeoutEnds,
          ),
          fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
          fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
        },
      ],
    } satisfies LoopToSilenceTransition
  }

  const audioBuffer = yield* deps.getAudioBufferOfAsset(asset)

  const math = calcTimingsMath(
    oldState.playbackStartedAtSecond,
    yield* EAudioContext.currentTime(deps.audioContext),
  )

  yield* scheduleFadeOutOf(current.playback, math)

  return {
    _tag: 'LoopToLoopTransition' as const,
    playbackStartedAtSecond: oldState.playbackStartedAtSecond,
    transitionQueue: [
      {
        ...current,
        cleanupFiberToolkit: yield* deps.makeCleanupFibers(
          math.secondsSinceNowUpUntilFadeoutEnds,
        ),
        fadeoutStartsAtSecond: math.playbackFadeoutStartsAt,
        fadeoutEndsAtSecond: math.playbackFadeoutEndsAt,
      },
      {
        asset,
        playback: yield* createScheduledNextPlayback(
          deps.audioContext,
          audioBuffer,
          math,
        ),
      },
    ],
  } satisfies LoopToLoopTransition
})
