import { distributeExplicit } from '@evadev/effect-helpers/distributeMake.ts'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import type { AsShortFadeinSwitchedToAnotherPatternMake } from '../Elements/BeginningPatternPlaybackWithShortFadeinVariants.ts'
import { beginAnotherPatternPlaybackWithShortFadein } from '../Elements/BeginningPatternPlaybackWithShortFadeinVariants.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  calcBlissfulGridTimingsMath,
  calcBlissfulGridTimingsMathAtAnyQuantFromMath,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

// Naming convention: the fade-to-silence loop is not split per quant, so it does
// not constrain the quant class the incoming fadein begins at. The two tuples
// still spell out both possible beginning classes.
export const PatternSilencePatternTransitionQueue = Schema.Union([
  Schema.Tuple([
    PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
    BeginningPatternPlaybackAtInitialQuantWithShortFadein,
  ]),
  Schema.Tuple([
    PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
  ]),
])

export type PatternSilencePatternTransitionQueue =
  typeof PatternSilencePatternTransitionQueue.Type

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternSilencePatternTransitionState extends Schema.TaggedClass<PatternSilencePatternTransitionState>()(
  'PatternSilencePatternTransitionState',
  {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: PatternSilencePatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [dying, incoming] = this.transitionQueue

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const now = yield* GetAudioNow.run
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      dying.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    const nextTickIsOnThePatternBoundary =
      blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

    const incomingFadeInStartsAtSecond =
      incoming.math
        .patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit
    const incomingFadeInIsStillRevocable =
      now <= incomingFadeInStartsAtSecond - schedulingSafeBufferInSeconds

    if (theSamePatternWasPressed(pressedParamButtonId, incoming.asset)) {
      if (incomingFadeInIsStillRevocable) {
        yield* incoming.drop()
        return PatternSilenceTransitionState.makeSimple(
          dying.math
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          dying,
        )
      }

      const revived = yield* dying.cancelLongFadeoutAndRestore(now)
      const fadeToSilence = yield* incoming.promoteToFadeToSilence(
        calcBlissfulGridTimingsMathAtAnyQuantFromMath(blissfulGridTimingsMath),
      )

      if (nextTickIsOnThePatternBoundary) {
        // WHY does it need blissfulGridTimingsMath???
        const endingPatternPlaybackWithShortFadeout =
          yield* revived.beginShortFadeoutBeforeAnotherPattern(
            calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
          )
        return PatternPatternSilenceTransitionState.makeSimple(
          endingPatternPlaybackWithShortFadeout,
          fadeToSilence,
        )
      }

      // WHY does it need blissfulGridTimingsMath???
      const endingPatternPlaybackWithShortFadeout =
        yield* revived.beginShortFadeoutBeforeAnotherPattern(
          calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
        )
      return PatternPatternSilenceTransitionState.makeSimple(
        endingPatternPlaybackWithShortFadeout,
        fadeToSilence,
      )
    }

    const desiredAsset = incoming.asset.makePatchedFrom(pressedParamButtonId)

    if (
      incomingFadeInIsStillRevocable &&
      Equal.equals(desiredAsset, dying.asset)
    ) {
      const revived = yield* dying.cancelLongFadeoutAndRestore(now)
      yield* incoming.drop()
      return PatternState.makeSimple(
        revived.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        revived,
      )
    }

    if (!incomingFadeInIsStillRevocable) {
      const revived = yield* dying.cancelLongFadeoutAndRestore(now)
      const mathAtAnyQuant = calcBlissfulGridTimingsMathAtAnyQuantFromMath(
        blissfulGridTimingsMath,
      )

      const endingPatternPlaybackWithShortFadeout =
        yield* revived.beginShortFadeoutBeforeAnotherPattern(mathAtAnyQuant)

      const transitionQueue =
        yield* distributeExplicit<AsShortFadeinSwitchedToAnotherPatternMake>()(
          (incoming, desiredAsset, blissfulGridTimingsMath) =>
            Effect.all([
              incoming.promoteToShortFadingOut(blissfulGridTimingsMath),
              beginAnotherPatternPlaybackWithShortFadein(
                desiredAsset,
                blissfulGridTimingsMath,
              ),
            ]),
          incoming,
          desiredAsset,
          mathAtAnyQuant,
        )

      return PatternPatternPatternTransitionState.makeSimple(
        dying.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        endingPatternPlaybackWithShortFadeout,
        ...transitionQueue,
      )
    }

    yield* incoming.drop()

    if (nextTickIsOnThePatternBoundary)
      return PatternSilencePatternTransitionState.makeSimple(
        dying.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        dying,
        yield* beginAnotherPatternPlaybackWithShortFadein(
          desiredAsset,
          calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
        ),
      )

    return PatternSilencePatternTransitionState.makeSimple(
      dying.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      dying,
      yield* beginAnotherPatternPlaybackWithShortFadein(
        desiredAsset,
        calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
      ),
    )
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    ...transitionQueue: PatternSilencePatternTransitionQueue
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue,
    })
}
