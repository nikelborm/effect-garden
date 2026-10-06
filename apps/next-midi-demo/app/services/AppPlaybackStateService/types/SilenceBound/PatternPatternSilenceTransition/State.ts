import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { AccordData } from '../../../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../../../domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../../../domain/Strength.ts'
import type { AdvancePlaybackRequirements } from '../../AdvancePlaybackRequirements.ts'
import type { AppPlaybackState } from '../../index.ts'
import { PatternPatternPatternTransitionState } from '../../PatternBound/PatternPatternPatternTransition/State.ts'
import { SilenceBoundBaseState } from '../Base/State.ts'
import { TwoPatternsFadingToSilenceQueue } from './Queue.ts'

export class PatternPatternSilenceTransitionState extends SilenceBoundBaseState.extend<PatternPatternSilenceTransitionState>(
  'PatternPatternSilenceTransitionState',
)({
  transitionQueue: TwoPatternsFadingToSilenceQueue,
}) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternPatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  advance = Effect.fn('PatternPatternSilenceTransitionState.advance')(
    { self: this },
    function* (
      pressedParamButtonId: PressedParamButtonId,
    ): Effect.fn.Return<AppPlaybackState, never, AdvancePlaybackRequirements> {
      const { accord, strength } = this
      const [oldest, fading] = this.transitionQueue

      if (StrengthData.models(pressedParamButtonId))
        return PatternPatternSilenceTransitionState.make({
          accord,
          strength: pressedParamButtonId.strength,
          transitionQueue: [oldest, fading],
        })

      if (AccordData.models(pressedParamButtonId))
        return yield* Effect.die(
          new Error(
            'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
          ),
        )

      const asset = TaggedPatternPointer.make({
        pattern: pressedParamButtonId.pattern,
        accord,
        strength,
      })
      return PatternPatternPatternTransitionState.make({
        playbackStartedAtSecond: oldest.playbackStartedAtSecond,
        transitionQueue: [
          oldest,
          fading,
          yield* oldest.scheduleNextPattern(asset),
        ],
      })
    },
  )
}
