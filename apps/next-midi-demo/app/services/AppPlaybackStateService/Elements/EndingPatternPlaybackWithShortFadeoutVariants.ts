import type { LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'

import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import type {
  BlissfulGridTimingsMathAtAnyQuant,
  BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import type { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { EndingPatternPlaybackAtLastQuantWithShortFadeout } from './EndingPatternPlaybackAtLastQuantWithShortFadeout.ts'
import { EndingPatternPlaybackAtMiddleQuantWithShortFadeout } from './EndingPatternPlaybackAtMiddleQuantWithShortFadeout.ts'

// All short fadeouts whose name ends at the last quant. They pair only with a
// fadein that begins at the initial quant of the incoming pattern.
export const EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants =
  Schema.Union([
    EndingPatternPlaybackAtLastQuantWithShortFadeout,
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
  ])

export type EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants =
  typeof EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants.Type

// All short fadeouts whose name ends mid-pattern. They pair only with a fadein
// that begins mid-pattern.
export const EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants =
  Schema.Union([
    EndingPatternPlaybackAtMiddleQuantWithShortFadeout,
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
  ])

export type EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants =
  typeof EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants.Type

export const EndingPatternPlaybackWithShortFadeoutVariants = Schema.Union([
  EndingPatternPlaybackAtLastQuantWithShortFadeout,
  EndingPatternPlaybackAtMiddleQuantWithShortFadeout,
  BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
  BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
  BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
  BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
])

export type EndingPatternPlaybackWithShortFadeoutVariants =
  typeof EndingPatternPlaybackWithShortFadeoutVariants.Type

/** Narrows on the quant class that the short fadeout ends at. */
export const endsAtLastQuant = (
  endingPatternPlayback: EndingPatternPlaybackWithShortFadeoutVariants,
): endingPatternPlayback is EndingPatternPlaybackAtLastQuantWithShortFadeoutVariants =>
  endingPatternPlayback.endingMath
    .nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

/** Narrows on the quant class that the short fadeout ends at. */
export const endsAtMiddleQuant = (
  endingPatternPlayback: EndingPatternPlaybackWithShortFadeoutVariants,
): endingPatternPlayback is EndingPatternPlaybackAtMiddleQuantWithShortFadeoutVariants =>
  !endingPatternPlayback.endingMath
    .nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary

/**
 * The short fadeout class that ends at the quant of the passed math, decided at
 * the type level so that a function taking a union of maths can still say which
 * fadeout each member of the union produces.
 */
export type EndingFor<TMath> = [TMath] extends [
  BlissfulGridTimingsMathAtLastQuant,
]
  ? EndingPatternPlaybackAtLastQuantWithShortFadeout
  : [TMath] extends [BlissfulGridTimingsMathAtMiddleQuant]
    ? EndingPatternPlaybackAtMiddleQuantWithShortFadeout
    : never

export type EndingPatternPlaybackAtAnyQuantWithShortFadeout =
  | EndingPatternPlaybackAtLastQuantWithShortFadeout
  | EndingPatternPlaybackAtMiddleQuantWithShortFadeout

/**
 * The outgoing element of a short-fadeout switch as a type lambda, so that a
 * caller holding a union of maths can distribute over it and keep the pairing
 * with the incoming element instead of collapsing both into one tuple of unions.
 */
export interface AsEndingPatternPlaybackBeforeAnotherPattern
  extends LambdaAllArgs {
  <TMath extends BlissfulGridTimingsMathAtAnyQuant>(
    blissfulGridTimingsMath: TMath,
  ): EndingPatternPlaybackBeforeAnotherPattern<TMath>
  readonly '~lambda.inAllArgsTuple': [BlissfulGridTimingsMathAtAnyQuant]
  readonly '~lambda.out': EndingPatternPlaybackBeforeAnotherPattern<
    this['~lambda.inAllArgsTuple'][0]
  >
}

export interface EndingPatternPlaybackBeforeAnotherPattern<TMath>
  extends Effect.Effect<
    EndingFor<TMath>,
    never,
    CleanupFiberMaker | DisposePlayback | ScheduleFadeOut
  > {}
