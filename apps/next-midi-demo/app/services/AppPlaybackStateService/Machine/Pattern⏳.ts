import { distributeExplicit } from '@evadev/effect-helpers/distributeMake.ts'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { PatternPlayback } from '../Elements/PatternPlayback.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  calcBlissfulGridTimingsMath,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import type {
  AsPatternPatternTransitionQueueMake,
  // biome-ignore lint/suspicious/noImportCycles: expected
} from './PatternPatternTransition⏳.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition⏳.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternState extends Schema.TaggedClass<PatternState>()(
  'PatternState',
  {
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
      Schema.Finite,
    transitionQueue: PatternQueue,
  },
) {
  declare protected '~brand~': never
  static models = Schema.is(this);

  /** ⚠️ */
  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [current] = this.transitionQueue

    if (theSameChordOrStrengthWasPressed(pressedParamButtonId, current.asset))
      return this

    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      this
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      yield* GetAudioNow.run,
    )
    const blissfulGridTimingsMathAtLastQuant =
      calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath)
    const blissfulGridTimingsMathAtMiddleQuant =
      calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath)

    const mathAtAnyQuant =
      blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
        ? blissfulGridTimingsMathAtLastQuant
        : blissfulGridTimingsMathAtMiddleQuant

    if (theSamePatternWasPressed(pressedParamButtonId, current.asset))
      return PatternSilenceTransitionState.makeSimple(
        this
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        /** ⚠️ */
        yield* current.beginLongFadeoutToSilence(mathAtAnyQuant),
      )

    const desiredAsset = current.asset.makePatchedFrom(pressedParamButtonId)

    const transitionQueue =
      yield* distributeExplicit<AsPatternPatternTransitionQueueMake>()(
        blissfulGridTimingsMath =>
          Effect.all([
            current.beginShortFadeoutBeforeAnotherPattern(
              blissfulGridTimingsMath,
            ),
            current.beginAnotherPatternPlaybackWithShortFadein(
              desiredAsset,
              blissfulGridTimingsMath,
            ),
          ]),

        mathAtAnyQuant,
      )

    return PatternPatternTransitionState.makeSimple(
      this
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      ...transitionQueue,
    )
  }

  /** 🏁 */
  static init = Effect.fn('PatternState.init')(
    { self: this },
    function* (asset: TaggedPatternPointer) {
      const now = yield* GetAudioNow.run
      const math = calcBlissfulGridTimingsMath(now, now)

      return this.makeSimple(now, yield* PatternPlayback.init(asset, math))
    },
  )

  /** 🏁 */
  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    playback: PatternPlayback,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [playback],
    })

  /** 🏁 */
  get chord() {
    return this.transitionQueue[0].asset.chord
  }

  /** 🏁 */
  get pattern() {
    return this.transitionQueue[0].asset.pattern
  }

  /** 🏁 */
  get strength() {
    return this.transitionQueue[0].asset.strength
  }
}
