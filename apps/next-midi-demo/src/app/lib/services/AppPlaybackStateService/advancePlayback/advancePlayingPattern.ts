import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import { AccordData } from '../../../brandsAndDatas/Accord.ts'
import { TaggedPatternPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { PatternData } from '../../../brandsAndDatas/Pattern.ts'
import { StrengthData } from '../../../brandsAndDatas/Strength.ts'
import { AccordRegistry } from '../../AccordRegistry.ts'
import { StrengthRegistry } from '../../StrengthRegistry.ts'
import { getAudioBufferOfAsset } from '../getAudioBufferOfAsset.ts'
import { createScheduledNextPlaybackInContext } from '../playbackNodes/createScheduledNextPlayback.ts'
import { scheduleFadeOutOf } from '../playbackNodes/index.ts'
import { calcTimingsMath } from '../timingMath.ts'
import { PatternPatternTransition } from '../types/PatternPatternTransition.ts'
import { PatternSilenceTransition } from '../types/PatternSilenceTransition.ts'
import type { PlayingPattern } from '../types/PlayingPattern.ts'
import type { AdvancePlaybackDeps } from './deps.ts'
import type { Signal } from './signal.ts'

export const advancePlayingPattern = Effect.fn('advancePlayingPattern')(
  function* (
    oldState: PlayingPattern,
    signal: Signal,
    deps: AdvancePlaybackDeps,
  ) {
    const [current] = oldState.transitionQueue

    if (AccordData.models(signal) && signal.accord === current.asset.accord)
      return oldState

    if (
      StrengthData.models(signal) &&
      signal.strength === current.asset.strength
    )
      return oldState

    if (PatternData.models(signal)) {
      if (signal.pattern === current.asset.pattern) {
        // Pattern was deselected while loop was playing — fade out to silence
        const math = calcTimingsMath(
          oldState.playbackStartedAtSecond,
          yield* EAudioContext.currentTimeFromContext,
        )

        yield* scheduleFadeOutOf(current.playback, math)

        return new PatternSilenceTransition({
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
        })
      }

      const asset = new TaggedPatternPointer({
        ...signal,
        accord: yield* AccordRegistry.currentlySelectedAccord,
        strength: yield* StrengthRegistry.currentlySelectedStrength,
      })

      const audioBuffer = yield* getAudioBufferOfAsset(asset)

      const math = calcTimingsMath(
        oldState.playbackStartedAtSecond,
        yield* EAudioContext.currentTimeFromContext,
      )

      yield* scheduleFadeOutOf(current.playback, math)

      return new PatternPatternTransition({
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
            playback: yield* createScheduledNextPlaybackInContext(
              audioBuffer,
              math,
            ),
          },
        ],
      })
    }
    yield* Effect.logError({ oldState, signal, deps })
    return yield* Effect.dieMessage('Unhandled case in advancePlayingPattern')
  },
)
