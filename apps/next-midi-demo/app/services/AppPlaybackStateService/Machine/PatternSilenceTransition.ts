import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { AccordData, AccordSchema } from '../../../domain/Accord.ts'
import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import { StrengthData, StrengthSchema } from '../../../domain/Strength.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import type { AdvanceFnReturn } from '../index.ts'
import { FadingOutPatternPlayback, getAudioNow } from '../loopElements.ts'
import { PatternState } from './Pattern.ts'
import { PatternPatternTransitionState } from './PatternPatternTransition.ts'
import { PatternSilencePatternTransitionState } from './PatternSilencePatternTransition.ts'

export const PatternSilenceTransitionQueue = Schema.Tuple([
  FadingOutPatternPlayback,
])
export const isPatternSilenceTransitionQueue = Schema.is(
  PatternSilenceTransitionQueue,
)

export class PatternSilenceTransitionState extends Schema.TaggedClass<PatternSilenceTransitionState>()(
  'PatternSilenceTransitionState',
  {
    accord: AccordSchema,
    strength: StrengthSchema,
    transitionQueue: PatternSilenceTransitionQueue,
  },
) {
  declare protected '~brand~': never
  static models: (
    candidate: unknown,
  ) => candidate is PatternSilenceTransitionState = Schema.is(this)
  static {
    this.make = this.make.bind(this)
  }

  *advance(pressedParamButtonId: PressedParamButtonId): AdvanceFnReturn {
    const { accord, strength } = this
    const [current] = this.transitionQueue

    if (StrengthData.models(pressedParamButtonId))
      return PatternSilenceTransitionState.make({
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

    const now = yield* getAudioNow

    const isInGreenZone =
      now <= current.fadeoutStartsAtSecond - schedulingSafeBufferInSeconds

    if (pressedParamButtonId.pattern === current.asset.pattern) {
      if (!isInGreenZone)
        return yield* Effect.die(
          new Error(
            're-press of the same pattern during active fade-out: not yet handled',
          ),
        )

      const revived = yield* current.cancelFadeoutAndRestore()
      return PatternState.make({
        firstPlaybackInitAtSecond: revived.playbackStartedAtSecond,
        transitionQueue: [revived],
      })
    }

    const asset = TaggedPatternPointer.make({
      pattern: pressedParamButtonId.pattern,
      accord,
      strength,
    })
    const incoming = yield* current.scheduleNextPattern(asset)

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
}
