import * as Equal from 'effect/Equal'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from '../Elements/PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
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
    const [current, incoming] = this.transitionQueue

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const now = yield* GetAudioNow.run
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      current.math
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
        // TODO: cancel current's old short fadeout and schedule the new long fadeout
        return PatternSilenceTransitionState.makeSimple(
          current.math
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          current,
        )
      }

      return PatternPatternSilenceTransitionState.makeSimple(
        incoming.asset.chord,
        incoming.asset.strength,
        current,
        yield* incoming.promoteToFadingOut(blissfulGridTimingsMath),
      )
    }

    const desiredAsset = incoming.asset.makePatchedFrom(pressedParamButtonId)

    if (
      incomingFadeInIsStillRevocable &&
      Equal.equals(desiredAsset, current.asset)
    ) {
      const revived = yield* current.cancelFadeoutAndRestore(now)
      yield* incoming.drop()
      return PatternState.makeSimple(
        revived.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        revived,
      )
    }

    if (!incomingFadeInIsStillRevocable) {
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
    }

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
    })
}
