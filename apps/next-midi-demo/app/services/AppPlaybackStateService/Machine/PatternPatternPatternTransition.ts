import * as Effect from 'effect/Effect'
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
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'

export const PatternPatternPatternTransitionQueue = Schema.Tuple([
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
  IncomingPatternFadingIn,
])

export class PatternPatternPatternTransitionState extends Schema.TaggedClass<PatternPatternPatternTransitionState>()(
  'PatternPatternPatternTransitionState',
  {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: PatternPatternPatternTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [oldest, middle, incoming] = this.transitionQueue

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, incoming.asset))
      return this

    const now = yield* GetAudioNow.run

    const incomingFadeInStartsAtSecond =
      incoming.math
        .patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit
    const incomingFadeInIsStillRevocable =
      now <= incomingFadeInStartsAtSecond - schedulingSafeBufferInSeconds

    if (theSamePatternWasPressed(pressedParamButtonId, incoming.asset)) {
      if (incomingFadeInIsStillRevocable) {
        yield* incoming.drop()
        return PatternPatternSilenceTransitionState.makeSimple(
          incoming.asset.chord,
          incoming.asset.strength,
          oldest,
          middle,
        )
      }
      yield* Effect.logError({
        oldest,
        middle,
        incoming,
        pressedParamButtonId,
      })
      return yield* Effect.die(
        new Error(
          'late deselect during a full queue (a 4th input): would need a 3rd fading-to-silence loop — excluded from the MVP',
        ),
      )
    }

    if (!incomingFadeInIsStillRevocable) {
      yield* Effect.logError({
        oldest,
        middle,
        incoming,
        pressedParamButtonId,
      })
      return yield* Effect.die(
        new Error(
          'late switch during a full queue (a 4th input): would need a 4th queue element — excluded from the MVP',
        ),
      )
    }

    const desiredAsset = incoming.asset.makePatchedFrom(pressedParamButtonId)
    yield* incoming.drop()
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      oldest.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    return PatternPatternPatternTransitionState.makeSimple(
      oldest.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      oldest,
      middle,
      yield* oldest.scheduleNextPattern(
        desiredAsset,
        now,
        blissfulGridTimingsMath,
      ),
    )
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    oldest: PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
    middle: PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern,
    incoming: IncomingPatternFadingIn,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [oldest, middle, incoming],
    })
}
