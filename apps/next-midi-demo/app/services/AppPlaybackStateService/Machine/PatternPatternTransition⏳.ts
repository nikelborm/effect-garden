import type { LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'
import type { Identity } from '@evadev/effect-helpers/Identity.ts'

import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import type { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import type { BeginningFor } from '../Elements/BeginningPatternPlaybackWithShortFadeinVariants.ts'
import { EndingPatternPlaybackAtLastQuantWithShortFadeout } from '../Elements/EndingPatternPlaybackAtLastQuantWithShortFadeout.ts'
import { EndingPatternPlaybackAtMiddleQuantWithShortFadeout } from '../Elements/EndingPatternPlaybackAtMiddleQuantWithShortFadeout.ts'
import type { EndingFor } from '../Elements/EndingPatternPlaybackWithShortFadeoutVariants.ts'
import {
  endsAtLastQuant,
  endsAtMiddleQuant,
} from '../Elements/EndingPatternPlaybackWithShortFadeoutVariants.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  type BlissfulGridTimingsMath,
  type BlissfulGridTimingsMathAtAnyQuant,
  calcBlissfulGridTimingsMath,
  calcBlissfulGridTimingsMathAtAnyQuantFromMath,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import type { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import type { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

export const PatternMidPatternTransitionQueue = Schema.Tuple([
  EndingPatternPlaybackAtMiddleQuantWithShortFadeout,
  BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
])

export interface PatternMidPatternTransitionQueue
  // @effect-diagnostics-next-line unnecessaryTypeofType:off
  extends Identity<typeof PatternMidPatternTransitionQueue.Type> {}

export const PatternEvenBoundaryPatternTransitionQueue = Schema.Tuple([
  EndingPatternPlaybackAtLastQuantWithShortFadeout,
  BeginningPatternPlaybackAtInitialQuantWithShortFadein,
])

export interface PatternEvenBoundaryPatternTransitionQueue
  // @effect-diagnostics-next-line unnecessaryTypeofType:off
  extends Identity<typeof PatternEvenBoundaryPatternTransitionQueue.Type> {}

export const PatternPatternTransitionQueue = Schema.Union([
  PatternEvenBoundaryPatternTransitionQueue,
  PatternMidPatternTransitionQueue,
])

export type PatternPatternTransitionQueue =
  typeof PatternPatternTransitionQueue.Type

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternPatternTransitionState extends Schema.TaggedClass<PatternPatternTransitionState>()(
  'PatternPatternTransitionState',
  {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: PatternPatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const now = yield* GetAudioNow.run

    return yield* this.matchOnPressedParamButton(now, pressedParamButtonId, {
      whenFadingOutPlaybackIsStillSafeToRevive: {
        /** 🤷‍♀️ ⚠️ */
        *onPressedThePatternOfTheIncomingOne(blissfulGridTimingsMath) {
          const [fadingOut, incoming] = this.transitionQueue

          yield* incoming.drop()

          const blissfulGridTimingsMathAtQuantBoundary =
            calcBlissfulGridTimingsMathAtAnyQuantFromMath(
              blissfulGridTimingsMath,
            )

          return PatternSilenceTransitionState.makeSimple(
            fadingOut.endingMath
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            /** 🤷‍♀️ ⚠️ */
            yield* Effect.flatMap(
              fadingOut.cancelShortFadeoutAndRestore(now),
              playback =>
                // WHY does it need blissfulGridTimingsMath???
                playback.beginLongFadeoutToSilence(
                  blissfulGridTimingsMathAtQuantBoundary,
                ),
            ),
          )
        },
        /** 🏁 */
        *onFadingOutAssetBroughtBack() {
          const [fadingOut, incoming] = this.transitionQueue

          const revived = yield* fadingOut.cancelShortFadeoutAndRestore(now)
          yield* incoming.drop()
          return PatternState.makeSimple(
            revived.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            revived,
          )
        },
        *onPressedAnyOtherPattern(desiredAsset, blissfulGridTimingsMath) {
          const [fadingOut] = this.transitionQueue

          if (
            blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
          ) {
            if (!endsAtLastQuant(fadingOut))
              return yield* Effect.die(
                new Error(
                  'invariant: an outgoing short fadeout paired with an initial-quant incoming one must end at the last quant',
                ),
              )

            const incoming =
              yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
                desiredAsset,
                calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
              )

            return PatternPatternTransitionState.makeSimple(
              fadingOut.endingMath
                .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
              fadingOut,
              incoming,
            )
          }

          if (!endsAtMiddleQuant(fadingOut))
            return yield* Effect.die(
              new Error(
                'invariant: an outgoing short fadeout paired with a mid-pattern incoming one must end mid-pattern',
              ),
            )

          const incoming =
            yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
              desiredAsset,
              calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
            )

          return PatternPatternTransitionState.makeSimple(
            fadingOut.endingMath
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            fadingOut,
            incoming,
          )
        },
      },
      whenFadingOutPlaybackIsUnsafeToRevive: {
        *onPressedThePatternOfTheIncomingOne(blissfulGridTimingsMath) {
          const [fadingOut, incoming] = this.transitionQueue

          const fadeToSilence = yield* incoming.promoteToFadeToSilence(
            calcBlissfulGridTimingsMathAtAnyQuantFromMath(
              blissfulGridTimingsMath,
            ),
          )

          if (
            incoming._tag ===
            'BeginningPatternPlaybackAtInitialQuantWithShortFadein'
          ) {
            if (!endsAtLastQuant(fadingOut))
              return yield* Effect.die(
                new Error(
                  'invariant: the old incoming began at the initial quant, so the outgoing one must end at the last quant',
                ),
              )
            return PatternPatternSilenceTransitionState.makeSimple(
              fadingOut,
              fadeToSilence,
            )
          }

          if (!endsAtMiddleQuant(fadingOut))
            return yield* Effect.die(
              new Error(
                'invariant: the old incoming began mid-pattern, so the outgoing one must end mid-pattern',
              ),
            )
          return PatternPatternSilenceTransitionState.makeSimple(
            fadingOut,
            fadeToSilence,
          )
        },
        *onPressedAnyOtherPattern(desiredAsset, blissfulGridTimingsMath) {
          const [fadingOut, incoming] = this.transitionQueue
          const nextTickIsOnThePatternBoundary =
            blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

          if (
            incoming._tag ===
            'BeginningPatternPlaybackAtInitialQuantWithShortFadein'
          ) {
            if (nextTickIsOnThePatternBoundary)
              return PatternPatternPatternTransitionState.makeSimple(
                fadingOut.endingMath
                  .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
                fadingOut,
                yield* incoming.promoteToShortFadingOut(
                  calcBlissfulGridTimingsMathAtLastQuant(
                    blissfulGridTimingsMath,
                  ),
                ),
                yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
                  desiredAsset,
                  calcBlissfulGridTimingsMathAtLastQuant(
                    blissfulGridTimingsMath,
                  ),
                ),
              )

            return PatternPatternPatternTransitionState.makeSimple(
              fadingOut.endingMath
                .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
              fadingOut,
              yield* incoming.promoteToShortFadingOut(
                calcBlissfulGridTimingsMathAtMiddleQuant(
                  blissfulGridTimingsMath,
                ),
              ),
              yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
                desiredAsset,
                calcBlissfulGridTimingsMathAtMiddleQuant(
                  blissfulGridTimingsMath,
                ),
              ),
            )
          }

          if (nextTickIsOnThePatternBoundary)
            return PatternPatternPatternTransitionState.makeSimple(
              fadingOut.endingMath
                .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
              fadingOut,
              yield* incoming.promoteToShortFadingOut(
                calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
              ),
              yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
                desiredAsset,
                calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
              ),
            )

          return PatternPatternPatternTransitionState.makeSimple(
            fadingOut.endingMath
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            fadingOut,
            yield* incoming.promoteToShortFadingOut(
              calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
            ),
            yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
              desiredAsset,
              calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
            ),
          )
        },
      },
    })
  }

  /** 🏁 */
  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    ...transitionQueue: PatternPatternTransitionQueue
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue,
    });

  *matchOnPressedParamButton(
    now: number,
    pressedParamButtonId: PressedParamButtonId,
    {
      whenFadingOutPlaybackIsStillSafeToRevive: onSafe,
      whenFadingOutPlaybackIsUnsafeToRevive: onUnsafe,
    }: OnPressedParamButtonMatchHandlers,
  ): AdvanceFnReturn {
    const [fadingOut, incoming] = this.transitionQueue
    // there's nothing guaranteeing that fadingOut and incoming will differ in
    // only one dimension. The user can quickly click on all 3 different
    // buttons, each of which will trigger a new overwrite and rescheduling of
    // the latest pattern, while the base will stay as is

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    // TODO: extract these things generating bools into methods. feed arbitrary
    // inputs into it and test for mutual exclusivity of the condition branches
    // below

    const fadingOutPlaybackIsStillSafeToRevive =
      now <=
      fadingOut.endingMath
        .patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit -
        schedulingSafeBufferInSeconds

    const pressedThePatternOfTheIncomingOne = theSamePatternWasPressed(
      pressedParamButtonId,
      incoming.asset,
    )
    const desiredAsset = incoming.asset.makePatchedFrom(pressedParamButtonId)
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      this
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )

    if (fadingOutPlaybackIsStillSafeToRevive) {
      if (pressedThePatternOfTheIncomingOne)
        return yield* onSafe.onPressedThePatternOfTheIncomingOne.call(
          this,
          blissfulGridTimingsMath,
        )

      if (Equal.equals(desiredAsset, fadingOut.asset))
        return yield* onSafe.onFadingOutAssetBroughtBack.call(this)

      return yield* onSafe.onPressedAnyOtherPattern.call(
        this,
        desiredAsset,
        blissfulGridTimingsMath,
      )
    }

    if (pressedThePatternOfTheIncomingOne)
      return yield* onUnsafe.onPressedThePatternOfTheIncomingOne.call(
        this,
        blissfulGridTimingsMath,
      )

    return yield* onUnsafe.onPressedAnyOtherPattern.call(
      this,
      desiredAsset,
      blissfulGridTimingsMath,
    )
  }
}

export interface OnPressedParamButtonMatchHandlers {
  whenFadingOutPlaybackIsStillSafeToRevive: {
    onPressedThePatternOfTheIncomingOne(
      this: PatternPatternTransitionState,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ): AdvanceFnReturn
    onFadingOutAssetBroughtBack(
      this: PatternPatternTransitionState,
    ): AdvanceFnReturn
    onPressedAnyOtherPattern(
      this: PatternPatternTransitionState,
      desiredAsset: TaggedPatternPointer,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ): AdvanceFnReturn
  }

  whenFadingOutPlaybackIsUnsafeToRevive: {
    onPressedThePatternOfTheIncomingOne(
      this: PatternPatternTransitionState,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ): AdvanceFnReturn
    onPressedAnyOtherPattern(
      this: PatternPatternTransitionState,
      desiredAsset: TaggedPatternPointer,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ): AdvanceFnReturn
  }
}

/**
 * A short-fadeout switch is one decision expressed by two elements: whichever
 * quant the tick lands on, the outgoing one has to end exactly where the
 * incoming one begins. The pairing is written down once, as a type lambda whose
 * call signature keeps the quant generic, so that applying it to a union of
 * maths gives the union of the tuples each member produces instead of one tuple
 * of unions.
 */
export interface AsPatternPatternTransitionQueueMake extends LambdaAllArgs {
  <TMath extends BlissfulGridTimingsMathAtAnyQuant>(
    blissfulGridTimingsMath: TMath,
  ): SpecificPatternPatternTransitionQueueFrom<TMath>
  readonly '~lambda.inAllArgsTuple': [BlissfulGridTimingsMathAtAnyQuant]
  readonly '~lambda.out': SpecificPatternPatternTransitionQueueFrom<
    this['~lambda.inAllArgsTuple'][0]
  >
}

export interface SpecificPatternPatternTransitionQueueFrom<TMath>
  extends Effect.Effect<
    [EndingFor<TMath>, BeginningFor<TMath>],
    never,
    | CleanupFiberMaker
    | DisposePlayback
    | ScheduleFadeOut
    | AudioBufferStore
    | ScheduleFadeIntoLoopPlayback
  > {}
