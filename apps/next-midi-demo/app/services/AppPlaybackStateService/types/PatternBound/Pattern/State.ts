import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { AccordData } from '../../../../../domain/Accord.ts'
import { desiredAssetFromSignal } from '../../../../../domain/desiredAssetFromSignal.ts'
import { PatternData } from '../../../../../domain/Pattern.ts'
import type { PressedParamButtonId } from '../../../../../domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../../../domain/Strength.ts'
import type { AdvanceFnReturn } from '../../index.ts'
import { PatternSilenceTransitionState } from '../../SilenceBound/PatternSilenceTransition/State.ts'
import { PatternBoundStateBase } from '../Base/State.ts'
import { PatternPatternTransitionState } from '../PatternPatternTransition/State.ts'
import { PatternQueue } from './Queue.ts'

export class PatternState extends PatternBoundStateBase.extend<PatternState>(
  'PatternState',
)({
  transitionQueue: PatternQueue,
}) {
  declare protected '~brand~': never
  static models: (candidate: unknown) => candidate is PatternState =
    Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  advance = Effect.fn('PatternState.advance')(
    { self: this },
    function* (pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
      const [playing] = this.transitionQueue

      if (
        (AccordData.models(pressedParamButtonId) &&
          pressedParamButtonId.accord === playing.asset.accord) ||
        (StrengthData.models(pressedParamButtonId) &&
          pressedParamButtonId.strength === playing.asset.strength)
      )
        return this

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
    },
  )
}
