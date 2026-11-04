import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { PressedParamButtonId } from '../../../domain/PressedParamButtonId.ts'
import {
  theSameChordOrStrengthWasPressed,
  theSamePatternWasPressed,
} from '../../../helpers/theSameWasPressed.ts'
import { schedulingSafeBufferInSeconds } from '../constants.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from '../Elements/BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import {
  EndingPatternPlaybackWithShortFadeoutVariants,
  endsAtLastQuant,
  endsAtMiddleQuant,
} from '../Elements/EndingPatternPlaybackWithShortFadeoutVariants.ts'
import type { AdvanceFnReturn } from '../index.ts'
import {
  calcBlissfulGridTimingsMath,
  calcBlissfulGridTimingsMathAtAnyQuant,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { GetAudioNow } from '../webAudioSideEffects/GetAudioNow.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPatternSilenceTransitionState } from './PatternPatternSilenceTransition.ts'

// Naming convention: a short fadeout's *ending* quant is the pair of the next
// fadein's *beginning* quant (last ↔ initial, mid ↔ mid). `oldest` is independent:
// it keeps the quant class of an earlier switch, and in the revived-long path it
// was never paired with `middle`. `middle`+`incoming` are always one pair.
export const PatternPatternPatternTransitionQueue = Schema.Union([
  Schema.Tuple([
    EndingPatternPlaybackWithShortFadeoutVariants,
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
    BeginningPatternPlaybackAtInitialQuantWithShortFadein,
  ]),
  Schema.Tuple([
    EndingPatternPlaybackWithShortFadeoutVariants,
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
  ]),
  Schema.Tuple([
    EndingPatternPlaybackWithShortFadeoutVariants,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
    BeginningPatternPlaybackAtInitialQuantWithShortFadein,
  ]),
  Schema.Tuple([
    EndingPatternPlaybackWithShortFadeoutVariants,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
  ]),
])

export type PatternPatternPatternTransitionQueue =
  typeof PatternPatternPatternTransitionQueue.Type

// The correlated tail of a 3-queue: the middle's ending quant fixes the incoming's
// beginning quant.
export const PatternPatternPatternTransitionMiddleAndIncomingQueue =
  Schema.Union([
    Schema.Tuple([
      BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
      BeginningPatternPlaybackAtInitialQuantWithShortFadein,
    ]),
    Schema.Tuple([
      BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
    ]),
    Schema.Tuple([
      BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
      BeginningPatternPlaybackAtInitialQuantWithShortFadein,
    ]),
    Schema.Tuple([
      BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
    ]),
  ])

export type PatternPatternPatternTransitionMiddleAndIncomingQueue =
  typeof PatternPatternPatternTransitionMiddleAndIncomingQueue.Type

// @effect-diagnostics-next-line schemaClassMissingBrand:off
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

        const blissfulGridTimingsMathAtQuantBoundary =
          calcBlissfulGridTimingsMathAtAnyQuant(
            oldest.endingMath
              .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
            now,
          )

        const fadeToSilence = yield* middle.becomeLongFadeoutToSilence(
          now,
          blissfulGridTimingsMathAtQuantBoundary,
        )

        if (endsAtLastQuant(oldest))
          return PatternPatternSilenceTransitionState.makeSimple(
            oldest,
            fadeToSilence,
          )

        if (endsAtMiddleQuant(oldest))
          return PatternPatternSilenceTransitionState.makeSimple(
            oldest,
            fadeToSilence,
          )

        return yield* Effect.die(
          new Error(
            'invariant: oldest must end at a known quant when it starts fading to silence',
          ),
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
      oldest.endingMath
        .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      now,
    )
    const nextTickIsOnThePatternBoundary =
      blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

    // The new incoming must begin where `middle` ends, and `oldest` must end
    // where `middle` began. Each case therefore fixes the whole triple.
    switch (middle._tag) {
      case 'BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout': {
        if (!endsAtLastQuant(oldest))
          return yield* Effect.die(
            new Error(
              'invariant: oldest must end at the last quant when middle began at the initial quant',
            ),
          )
        if (!nextTickIsOnThePatternBoundary)
          return yield* Effect.die(
            new Error(
              'invariant: middle ends at the last quant, so the next switch must also be at the last quant',
            ),
          )

        return PatternPatternPatternTransitionState.makeSimple(
          oldest.endingMath
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          oldest,
          middle,
          yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
            desiredAsset,
            calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
          ),
        )
      }
      case 'BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout': {
        if (!endsAtLastQuant(oldest))
          return yield* Effect.die(
            new Error(
              'invariant: oldest must end at the last quant when middle began at the initial quant',
            ),
          )
        if (nextTickIsOnThePatternBoundary)
          return yield* Effect.die(
            new Error(
              'invariant: middle ends mid-pattern, so the next switch must also be mid-pattern',
            ),
          )

        return PatternPatternPatternTransitionState.makeSimple(
          oldest.endingMath
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          oldest,
          middle,
          yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
            desiredAsset,
            calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
          ),
        )
      }
      case 'BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout': {
        if (!endsAtMiddleQuant(oldest))
          return yield* Effect.die(
            new Error(
              'invariant: oldest must end mid-pattern when middle began mid-pattern',
            ),
          )
        if (!nextTickIsOnThePatternBoundary)
          return yield* Effect.die(
            new Error(
              'invariant: middle ends at the last quant, so the next switch must also be at the last quant',
            ),
          )

        return PatternPatternPatternTransitionState.makeSimple(
          oldest.endingMath
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          oldest,
          middle,
          yield* BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
            desiredAsset,
            calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
          ),
        )
      }
      case 'BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout': {
        if (!endsAtMiddleQuant(oldest))
          return yield* Effect.die(
            new Error(
              'invariant: oldest must end mid-pattern when middle began mid-pattern',
            ),
          )
        if (nextTickIsOnThePatternBoundary)
          return yield* Effect.die(
            new Error(
              'invariant: middle ends mid-pattern, so the next switch must also be mid-pattern',
            ),
          )

        return PatternPatternPatternTransitionState.makeSimple(
          oldest.endingMath
            .firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
          oldest,
          middle,
          yield* BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
            desiredAsset,
            calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
          ),
        )
      }
      default:
        return yield* Effect.die(
          new Error('invariant: unknown middle element class'),
        )
    }
  }

  static makeSimple = (
    firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit: number,
    ...transitionQueue: PatternPatternPatternTransitionQueue
  ) =>
    this.make({
      firstPatternPlaybackOfTheCurrentGridStartedAtDecimalSecondSinceAudioContextInit,
      transitionQueue,
    })
}
