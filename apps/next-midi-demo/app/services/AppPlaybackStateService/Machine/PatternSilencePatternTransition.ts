import * as Effect from 'effect/Effect'
import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../consts/constants.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { PatternPatternPatternTransitionState } from './PatternPatternPatternTransition.ts'
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

export const PatternSilencePatternTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  IncomingPatternFadingIn,
])

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

      return PatternPatternSilenceTransitionState.makeSimple(
        incoming.asset.chord,
        incoming.asset.strength,

        yield* Effect.flatMap(
          dying.cancelLongFadeoutAndRestore(now),
          playback =>
            // WHY does it need blissfulGridTimingsMath???
            playback.beginShortFadeoutBeforeAnotherPattern(
              blissfulGridTimingsMath,
            ),
        ),
        yield* incoming.promoteToFadeToSilence(blissfulGridTimingsMath),
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
      return PatternPatternPatternTransitionState.makeSimple(
        dying.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        yield* Effect.flatMap(
          dying.cancelLongFadeoutAndRestore(now),
          playback =>
            // WHY does it need blissfulGridTimingsMath???
            playback.beginShortFadeoutBeforeAnotherPattern(
              blissfulGridTimingsMath,
            ),
        ),
        yield* incoming.promoteToShortFadingOut(blissfulGridTimingsMath),
        yield* IncomingPatternFadingIn.init(
          desiredAsset,
          blissfulGridTimingsMath,
        ),
      )
    }

    yield* incoming.drop()
    return PatternSilencePatternTransitionState.makeSimple(
      dying.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      dying,
      yield* IncomingPatternFadingIn.init(
        desiredAsset,
        blissfulGridTimingsMath,
      ),
    )
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    dying: PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
    incoming: IncomingPatternFadingIn,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [dying, incoming],
    })
}
