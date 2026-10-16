import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import {
  type Accord,
  AccordData,
  AccordSchema,
} from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  type Strength,
  StrengthData,
  StrengthSchema,
} from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import type { AdvanceFnReturn } from '../index.ts'
import type { FadingOutPatternPlayback } from '../Elements/FadingOutPatternPlayback.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from '../Elements/PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
import { calcBlissfulGridTimingsMath } from '../timingsMath.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternTransitionState } from './PatternPatternTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternSilencePatternTransitionState } from './PatternSilencePatternTransition.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternState } from './Pattern⏳.ts'

export const PatternSilenceTransitionQueue = Schema.Tuple([
  PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
])
export const isPatternSilenceTransitionQueue = Schema.is(
  PatternSilenceTransitionQueue,
)

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
    const { accord, strength } = this
    const [current] = this.transitionQueue

    if (StrengthData.models(pressedParamButtonId))
      return PatternSilenceTransitionState.make({
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
          this
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
        accord,
        strength: pressedParamButtonId.strength,
        transitionQueue: [current],
      })

    if (AccordData.models(pressedParamButtonId))
      return yield* Effect.die(
        new Error(
          'slow strum request during fade-to-silence: not yet handled (slow strums deferred)',
        ),
      )

    const now = yield* GetAudioNow.run

    const fadingLoopFadeoutIsStillRevocable =
      now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

    if (pressedParamButtonId.pattern === current.asset.pattern) {
      if (!fadingLoopFadeoutIsStillRevocable)
        return yield* Effect.die(
          new Error(
            're-press of the same pattern during active fade-out: not yet handled',
          ),
        )

      const revived = yield* current.cancelFadeoutAndRestore(now)
      return PatternState.make({
        firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit:
          revived.playbackStartedAtSecond,
        transitionQueue: [revived],
      })
    }

    const asset = TaggedPatternPointer.make({
      pattern: pressedParamButtonId.pattern,
      accord,
      strength,
    })
    const blissfulGridTimingsMath = calcBlissfulGridTimingsMath(
      current.playbackStartedAtSecond,
      now,
    )
    const incoming = yield* current.scheduleNextPattern(
      asset,
      now,
      blissfulGridTimingsMath,
    )

    if (
      current._tag ===
      'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern'
    )
      return PatternPatternTransitionState.make({
        playbackStartedAtSecond: current.playbackStartedAtSecond,
        transitionQueue: [current, incoming],
      })

    return PatternSilencePatternTransitionState.make({
      playbackStartedAtSecond: current.playbackStartedAtSecond,
      transitionQueue: [current, incoming],
    })
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    playback: PatternPlaybackAtItsLastPlayWithScheduledLongFadeout,
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue: [playback],
    })

  get accord() {
    return this.transitionQueue[0].asset.accord
  }

  get strength() {
    return this.transitionQueue[0].asset.strength
  }
}
