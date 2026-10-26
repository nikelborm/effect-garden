import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { ChordData } from '../../../domain/Chord.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { StrengthData } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../consts/constants.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition⏳.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilencePatternTransitionState } from './PatternSilencePatternTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

export const PatternSilenceTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternSilenceTransitionState extends Schema.TaggedClass<PatternSilenceTransitionState>()(
  'PatternSilenceTransitionState',
  {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: PatternSilenceTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const { chord, strength } = this
    const [current] = this.transitionQueue

    if (StrengthData.models(pressedParamButtonId))
      return PatternSilenceTransitionState.makeSimple(
        this
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        current,
      )

    if (ChordData.models(pressedParamButtonId))
      return yield* Effect.die(
        new Error(
          'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
        ),
      )

    const now = yield* GetAudioNow.run

    const fadingLoopFadeoutStartsAtSecond =
      current.math
        .patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit
    const fadingLoopFadeoutIsStillRevocable =
      now <= fadingLoopFadeoutStartsAtSecond - schedulingSafeBufferInSeconds

    if (pressedParamButtonId.pattern === current.asset.pattern) {
      if (!fadingLoopFadeoutIsStillRevocable)
        return yield* Effect.die(
          new Error(
            're-press of the same pattern during active fade-out: not yet handled',
          ),
        )

      const revived = yield* current.cancelLongFadeoutAndRestore(now)
      return PatternState.makeSimple(
        revived.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        revived,
      )
    }

    const asset = TaggedPatternPointer.makeSimple(
      pressedParamButtonId.pattern,
      chord,
      strength,
    )
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      current.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    const incoming = yield* IncomingPatternFadingIn.init(
      asset,
      blissfulGridTimingsMath,
    )

    if (
      current._tag ===
      'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern'
    )
      return PatternPatternTransitionState.makeSimple(
        current.math
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        current,
        incoming,
      )

    return PatternSilencePatternTransitionState.makeSimple(
      current.math
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      current,
      incoming,
    )
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    playback: PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [playback],
    })

  get chord() {
    return this.transitionQueue[0].asset.chord
  }

  get strength() {
    return this.transitionQueue[0].asset.strength
  }
}
