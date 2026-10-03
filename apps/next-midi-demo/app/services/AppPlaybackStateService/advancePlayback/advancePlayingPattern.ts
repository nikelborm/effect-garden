import * as Effect from 'effect/Effect'

import { AccordData } from '../../../domain/Accord.ts'
import { PatternData } from '../../../domain/Pattern.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import {
  LoopBoundPlayback,
  type PlayingLoopState,
} from '../types/LoopBoundPlayback.ts'
import { SilenceBoundPlayback } from '../types/SilenceBoundPlayback.ts'
import { desiredAssetFromSignal } from './desiredAssetFromSignal.ts'
import type { PressedParamButtonId } from './PressedParamButtonId.ts'

export const advancePlayingPattern = Effect.fn('advancePlayingPattern')(
  function* (
    oldState: PlayingLoopState,
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
      return SilenceBoundPlayback.make({
        accord: playing.asset.accord,
        strength: playing.asset.strength,
        transitionQueue: [yield* playing.beginLongFadeoutToSilence()],
      })

    const asset = desiredAssetFromSignal(pressedParamButtonId, playing.asset)
    return LoopBoundPlayback.make({
      playbackStartedAtSecond: playing.playbackStartedAtSecond,
      transitionQueue: [
        yield* playing.beginShortFadeoutBeforeAnotherLoop(),
        yield* playing.scheduleNextLoop(asset),
      ],
    })
  },
)
