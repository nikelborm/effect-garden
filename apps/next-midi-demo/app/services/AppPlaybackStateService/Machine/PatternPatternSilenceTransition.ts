import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { AccordData, AccordSchema } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { StrengthData, StrengthSchema } from '../../../domain/Strength.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { FadingOutPatternPlayback, getAudioNow } from '../loopElements.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'

export const TwoPatternsFadingToSilenceQueue = Schema.Tuple([
  FadingOutPatternPlayback,
  FadingOutPatternPlayback,
])
export const isTwoPatternsFadingToSilenceQueue = Schema.is(
  TwoPatternsFadingToSilenceQueue,
)

export class PatternPatternSilenceTransitionState extends Schema.TaggedClass<PatternPatternSilenceTransitionState>()(
  'PatternPatternSilenceTransitionState',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: TwoPatternsFadingToSilenceQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
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
    const now = yield* getAudioNow
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      oldest.playbackStartedAtSecond,
      now,
    )
    return PatternPatternPatternTransitionState.make({
      playbackStartedAtSecond: oldest.playbackStartedAtSecond,
      transitionQueue: [
        oldest,
        fading,
        yield* oldest.scheduleNextPattern(asset, now, blissfulGridTimingsMath),
      ],
    })
  }
}
