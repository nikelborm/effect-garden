import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import type { PatternState } from '../types/PatternBound/Pattern/State.ts'
import { PatternPatternTransitionState } from '../types/PatternBound/PatternPatternTransition/State.ts'
import { PatternSilenceTransitionState } from '../types/SilenceBound/PatternSilenceTransition/State.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePattern = Effect.fn('advancePattern')(function* (
  oldState: PatternState,
  pressedParamButtonId: PressedParamButtonId,
) {
  const [playing] = oldState.transitionQueue

  if (
    (AccordData.models(pressedParamButtonId) &&
      pressedParamButtonId.accord === playing.asset.accord) ||
    (StrengthData.models(pressedParamButtonId) &&
      pressedParamButtonId.strength === playing.asset.strength)
  )
    return oldState

  if (
    PatternData.models(pressedParamButtonId) &&
    pressedParamButtonId.pattern === playing.asset.pattern
  )
    return PatternSilenceTransitionState.make({
      accord: playing.asset.accord,
      strength: playing.asset.strength,
      transitionQueue: [yield* playing.beginLongFadeoutToSilence()],
    })

  const asset = desiredAssetFromSignal(pressedParamButtonId, playing.asset)
  return PatternPatternTransitionState.make({
    playbackStartedAtSecond: playing.playbackStartedAtSecond,
    transitionQueue: [
      yield* playing.beginShortFadeoutBeforeAnotherPattern(),
      yield* playing.scheduleNextPattern(asset),
    ],
  })
})
