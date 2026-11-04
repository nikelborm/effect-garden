import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { ChordData } from '../../../domain/Chord.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import {
  EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants,
  EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants,
  endsAtLastQuant,
  endsAtMiddleQuant,
} from '../Elements/EndingPatternPlaybackWithShortFadeoutVariants.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  calcBlissfulGridTimingsMath,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'

// Naming convention: the short fadeout ends at some quant, the fade-to-silence
// loop is not split per quant, so only the short fadeout picks the tuple half.
export const PatternPatternSilenceTransitionQueue = Schema.Union([
  Schema.Tuple([
    EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants,
    PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  ]),
  Schema.Tuple([
    EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants,
    PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  ]),
])

export type PatternPatternSilenceTransitionQueue =
  typeof PatternPatternSilenceTransitionQueue.Type

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
      return PatternPatternSilenceTransitionState.makeSimple(
        ...this.transitionQueue,
      )

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
      oldest.endingMath
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    const nextTickIsOnThePatternBoundary =
      blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

    const fadingPlayback = yield* fading.cancelLongFadeoutAndRestore(now)

    if (nextTickIsOnThePatternBoundary) {
      // WHY does it need blissfulGridTimingsMath???
      const endingPatternPlaybackWithShortFadeout =
        yield* fadingPlayback.beginShortFadeoutBeforeAnotherPattern(
          calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
        )
      const incoming =
        yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
          asset,
          calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
        )

      if (endsAtLastQuant(oldest))
        return PatternPatternPatternTransitionState.makeSimple(
          oldest.endingMath
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          oldest,
          BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.makeSimple(
            endingPatternPlaybackWithShortFadeout.asset,
            endingPatternPlaybackWithShortFadeout.playback,
            endingPatternPlaybackWithShortFadeout.cleanupFiberToolkit,
            oldest.endingMath,
            endingPatternPlaybackWithShortFadeout.endingMath,
          ),
          incoming,
        )

      if (!endsAtMiddleQuant(oldest))
        return yield* Effect.die(
          new Error(
            'invariant: oldest must end at a known quant when the revived loop begins a short fadeout',
          ),
        )

      return PatternPatternPatternTransitionState.makeSimple(
        oldest.endingMath
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        oldest,
        BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.makeSimple(
          endingPatternPlaybackWithShortFadeout.asset,
          endingPatternPlaybackWithShortFadeout.playback,
          endingPatternPlaybackWithShortFadeout.cleanupFiberToolkit,
          oldest.endingMath,
          endingPatternPlaybackWithShortFadeout.endingMath,
        ),
        incoming,
      )
    }

    // WHY does it need blissfulGridTimingsMath???
    const endingPatternPlaybackWithShortFadeout =
      yield* fadingPlayback.beginShortFadeoutBeforeAnotherPattern(
        calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
      )
    const incoming =
      yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
        asset,
        calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
      )

    if (endsAtLastQuant(oldest))
      return PatternPatternPatternTransitionState.makeSimple(
        oldest.endingMath
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        oldest,
        BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.makeSimple(
          endingPatternPlaybackWithShortFadeout.asset,
          endingPatternPlaybackWithShortFadeout.playback,
          endingPatternPlaybackWithShortFadeout.cleanupFiberToolkit,
          oldest.endingMath,
          endingPatternPlaybackWithShortFadeout.endingMath,
        ),
        incoming,
      )

    if (!endsAtMiddleQuant(oldest))
      return yield* Effect.die(
        new Error(
          'invariant: oldest must end at a known quant when the revived loop begins a short fadeout',
        ),
      )

    return PatternPatternPatternTransitionState.makeSimple(
      oldest.endingMath
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      oldest,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.makeSimple(
        endingPatternPlaybackWithShortFadeout.asset,
        endingPatternPlaybackWithShortFadeout.playback,
        endingPatternPlaybackWithShortFadeout.cleanupFiberToolkit,
        oldest.endingMath,
        endingPatternPlaybackWithShortFadeout.endingMath,
      ),
      incoming,
    )
  }

  static makeSimple = (
    ...transitionQueue: PatternPatternSilenceTransitionQueue
  ) => this.make({ transitionQueue })

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
