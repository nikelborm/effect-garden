import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from '../Elements/PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  type BlissfulGridTimingsMath,
  calcBlissfulGridTimingsMath,
} from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

export const PatternPatternTransitionQueue = Schema.Tuple([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  IncomingPatternFadingIn,
])

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

          return PatternSilenceTransitionState.makeSimple(
            fadingOut.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            /** 🤷‍♀️ ⚠️ */
            yield* Effect.flatMap(
              fadingOut.cancelShortFadeoutAndRestore(now),
              playback =>
                // WHY does it need blissfulGridTimingsMath???
                playback.beginLongFadeoutToSilence(blissfulGridTimingsMath),
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
          const [fadingOut, incoming] = this.transitionQueue

          yield* incoming.drop()
          return PatternPatternTransitionState.makeSimple(
            fadingOut.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            fadingOut,
            yield* IncomingPatternFadingIn.init(
              desiredAsset,
              blissfulGridTimingsMath,
            ),
          )
        },
      },
      whenFadingOutPlaybackIsUnsafeToRevive: {
        *onPressedThePatternOfTheIncomingOne(blissfulGridTimingsMath) {
          const [fadingOut, incoming] = this.transitionQueue

          return PatternPatternSilenceTransitionState.makeSimple(
            incoming.asset.chord,
            incoming.asset.strength,
            fadingOut,
            yield* incoming.promoteToFadeToSilence(blissfulGridTimingsMath),
          )
        },
        *onPressedAnyOtherPattern(desiredAsset, blissfulGridTimingsMath) {
          const [fadingOut, incoming] = this.transitionQueue

          return PatternPatternPatternTransitionState.makeSimple(
            fadingOut.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            fadingOut,
            yield* incoming.promoteToFadingOut(blissfulGridTimingsMath),
            yield* IncomingPatternFadingIn.init(
              desiredAsset,
              blissfulGridTimingsMath,
            ),
          )
        },
      },
    })
  }

  /** 🏁 */
  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    fadingOut: PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
    incoming: IncomingPatternFadingIn,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [fadingOut, incoming],
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

    const fadingOutPlaybackIsStillSafeToRevive =
      now <=
      fadingOut.math
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
