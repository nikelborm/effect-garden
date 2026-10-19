import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { IncomingPatternFadingIn } from '../Elements/IncomingPatternFadingIn.ts'
import { PatternPlayback } from '../Elements/PatternPlayback.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition⏳.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])

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

    if (theSamePatternWasPressed(pressedParamButtonId, current.asset))
      return PatternSilenceTransitionState.makeSimple(
        this
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        /** ⚠️ */
        yield* current.beginLongFadeoutToSilence(blissfulGridTimingsMath),
      )

    return PatternPatternTransitionState.makeSimple(
      this
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      yield* current.beginShortFadeoutBeforeAnotherPattern(
        blissfulGridTimingsMath,
      ),
      yield* IncomingPatternFadingIn.init(
        current.asset.makePatchedFrom(pressedParamButtonId),
        blissfulGridTimingsMath,
      ),
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
