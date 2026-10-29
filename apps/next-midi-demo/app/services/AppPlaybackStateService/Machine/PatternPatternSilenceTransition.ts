import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { type Chord, ChordData, ChordSchema } from '../../../domain/Chord.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  type Strength,
  StrengthData,
  StrengthSchema,
} from '../../../domain/Strength.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from '../Elements/PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'

export const PatternPatternSilenceTransitionQueue = Schema.Tuple([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternPatternSilenceTransitionState extends Schema.TaggedClass<PatternPatternSilenceTransitionState>()(
  'PatternPatternSilenceTransitionState',
  {
    transitionQueue: PatternPatternSilenceTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const { chord, strength } = this
    const [oldest, fading] = this.transitionQueue

    if (StrengthData.models(pressedParamButtonId))
      return PatternPatternSilenceTransitionState.makeSimple(oldest, fading)

    if (ChordData.models(pressedParamButtonId))
      return yield* Effect.die(
        new Error(
          'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
        ),
      )

    const asset = TaggedPatternPointer.makeSimple(
      pressedParamButtonId.pattern,
      chord,
      strength,
    )
    const now = yield* GetAudioNow.run
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      oldest.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    return PatternPatternPatternTransitionState.makeSimple(
      oldest.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      oldest,
      yield* Effect.flatMap(fading.cancelLongFadeoutAndRestore(now), playback =>
        // WHY does it need blissfulGridTimingsMath???
        playback.beginShortFadeoutBeforeAnotherPattern(blissfulGridTimingsMath),
      ),
      yield* IncomingPatternFadingIn.init(asset, blissfulGridTimingsMath),
    )
  }

  static makeSimple = (
    oldest: PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
    fading: PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  ) => this.make({ transitionQueue: [oldest, fading] })

  /** 🏁 */
  get chord() {
    return this.transitionQueue[1].asset.chord
  }

  /** 🏁 */
  get pattern() {
    return this.transitionQueue[1].asset.pattern
  }

  /** 🏁 */
  get strength() {
    return this.transitionQueue[1].asset.strength
  }
}
