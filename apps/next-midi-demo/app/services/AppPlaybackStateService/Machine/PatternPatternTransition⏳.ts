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
      onSecondPlaybackIsStillSafeToCancel: {
        *onPressedThePatternOfTheIncomingOne(blissfulGridTimingsMath) {
          const [current, incoming] = this.transitionQueue

          yield* incoming.drop()

          return PatternSilenceTransitionState.makeSimple(
            current.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            yield* Effect.flatMap(current.cancelFadeoutAndRestore(now), e =>
              e.beginLongFadeoutToSilence(blissfulGridTimingsMath),
            ),
          )
        },
        /** 🏁 */
        *onPressedThePatternOfTheOneThatIsFadingOut() {
          const [current, incoming] = this.transitionQueue

          const revived = yield* current.cancelFadeoutAndRestore(now)
          yield* incoming.drop()
          return PatternState.makeSimple(
            revived.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            revived,
          )
        },
        *onPressedAnyOtherPattern(desiredAsset, blissfulGridTimingsMath) {
          const [current, incoming] = this.transitionQueue

          yield* incoming.drop()
          return PatternPatternTransitionState.makeSimple(
            current.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            yield* current.reanchorFadeoutOnto(now, blissfulGridTimingsMath),
            yield* current.scheduleNextPattern(
              desiredAsset,
              now,
              blissfulGridTimingsMath,
            ),
          )
        },
      },
      onSecondPlaybackUnsafeToCancel: {
        *onPressedThePatternOfTheIncomingOne(blissfulGridTimingsMath) {
          const [current, incoming] = this.transitionQueue

          return PatternPatternSilenceTransitionState.makeSimple(
            incoming.asset.chord,
            incoming.asset.strength,
            current,
            yield* incoming.promoteToFadeToSilence(blissfulGridTimingsMath),
          )
        },
        *onPressedAnyOtherPattern(desiredAsset, blissfulGridTimingsMath) {
          const [current, incoming] = this.transitionQueue

          return PatternPatternPatternTransitionState.makeSimple(
            current.math
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            current,
            yield* incoming.promoteToFadingOut(blissfulGridTimingsMath),
            yield* current.scheduleNextPattern(
              desiredAsset,
              now,
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
      onSecondPlaybackIsStillSafeToCancel: onSafe,
      onSecondPlaybackUnsafeToCancel: onUnsafe,
    }: OnPressedParamButtonMatchHandlers,
  ): AdvanceFnReturn {
    const [fadingOut, incoming] = this.transitionQueue

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const incomingPlaybackIsStillSafeToCancel =
      now <=
      incoming.math
        .patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit -
        schedulingSafeBufferInSeconds

    const pressedThePatternOfTheIncomingOne = theSamePatternWasPressed(
      pressedParamButtonId,
      incoming.asset,
    )
    const desiredAsset = incoming.asset.makePatchedFrom(pressedParamButtonId)
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      fadingOut.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )

    if (incomingPlaybackIsStillSafeToCancel) {
      if (pressedThePatternOfTheIncomingOne)
        return yield* onSafe.onPressedThePatternOfTheIncomingOne.call(
          this,
          blissfulGridTimingsMath,
        )

      if (Equal.equals(desiredAsset, fadingOut.asset))
        return yield* onSafe.onPressedThePatternOfTheOneThatIsFadingOut.call(
          this,
        )

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

export interface SecondPlaybackIsStillSafeToCancelHandlers {
  onPressedThePatternOfTheIncomingOne(
    this: PatternPatternTransitionState,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ): AdvanceFnReturn
  onPressedThePatternOfTheOneThatIsFadingOut(
    this: PatternPatternTransitionState,
  ): AdvanceFnReturn
  onPressedAnyOtherPattern(
    this: PatternPatternTransitionState,
    desiredAsset: TaggedPatternPointer,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ): AdvanceFnReturn
}

export interface SecondPlaybackIsUnsafeToCancelHandlers {
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

export interface OnPressedParamButtonMatchHandlers {
  onSecondPlaybackIsStillSafeToCancel: SecondPlaybackIsStillSafeToCancelHandlers
  onSecondPlaybackUnsafeToCancel: SecondPlaybackIsUnsafeToCancelHandlers
}
