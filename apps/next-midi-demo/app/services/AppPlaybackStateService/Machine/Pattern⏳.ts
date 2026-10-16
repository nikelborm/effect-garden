import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameAccordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { PatternPlayback } from '../Elements/PatternPlayback.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilenceTransitionState } from './PatternSilenceTransition.ts'

export const PatternQueue = Schema.Tuple([PatternPlayback])
export const isPatternQueue = Schema.is(PatternQueue)

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

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const [current] = this.transitionQueue
    const { asset } = current

    if (theSameAccordOrStrengthWasPressed(pressedParamButtonId, asset))
      return this

    const now = yield* GetAudioNow.run
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      current.playbackStartedAtSecond,
      now,
    )

    if (theSamePatternWasPressed(pressedParamButtonId, asset))
      return PatternSilenceTransitionState.makeSimple(
        this
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        yield* current.beginLongFadeoutToSilence(blissfulGridTimingsMath),
      )

    return PatternPatternTransitionState.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
        this
          .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [
        yield* current.beginShortFadeoutBeforeAnotherPattern(
          blissfulGridTimingsMath,
        ),
        yield* current.scheduleNextPattern(
          asset.makePatchedFrom(pressedParamButtonId),
          now,
          blissfulGridTimingsMath,
        ),
      ],
    })
  }

  static init = Effect.fn('PatternState.init')(
    { self: this },
    function* (asset: TaggedPatternPointer) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

      const firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit =
        yield* GetAudioNow.run

      const playback = yield* StartFreshPlayback.runLooping(
        audioBuffer,
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      )

      return this.makeSimple(
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        PatternPlayback.makeSimple(
          asset,
          playback,
          firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        ),
      )
    },
  )

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    playback: PatternPlayback,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [playback],
    })

  get accord() {
    return this.transitionQueue[0].asset.accord
  }

  get pattern() {
    return this.transitionQueue[0].asset.pattern
  }

  get strength() {
    return this.transitionQueue[0].asset.strength
  }

  // handleSecondTapForDeactivation
}
