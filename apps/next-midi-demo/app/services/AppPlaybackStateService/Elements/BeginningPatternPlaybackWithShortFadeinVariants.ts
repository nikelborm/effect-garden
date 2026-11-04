import type { LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'

import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { AudioBufferStore } from '../../AudioBufferStore.ts'
import type { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import {
  type BlissfulGridTimingsMathAtAnyQuant,
  type BlissfulGridTimingsMathAtLastQuant,
  type BlissfulGridTimingsMathAtMiddleQuant,
  calcBlissfulGridTimingsMathAtLastQuant,
  calcBlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import type { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import type { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from './BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import type { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import type { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import type { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
import type { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'

export const BeginningPatternPlaybackWithShortFadeinVariants = Schema.Union([
  BeginningPatternPlaybackAtInitialQuantWithShortFadein,
  BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
])

export type BeginningPatternPlaybackWithShortFadeinVariants =
  typeof BeginningPatternPlaybackWithShortFadeinVariants.Type

/**
 * The short fadein class that begins at the quant of the passed math, decided at
 * the type level so that a function taking a union of maths can still say which
 * fadein each member of the union produces.
 */
export type BeginningFor<Math> = [Math] extends [
  BlissfulGridTimingsMathAtLastQuant,
]
  ? BeginningPatternPlaybackAtInitialQuantWithShortFadein
  : [Math] extends [BlissfulGridTimingsMathAtMiddleQuant]
    ? BeginningPatternPlaybackAtMiddleQuantWithShortFadein
    : never

/**
 * The incoming element of a short-fadeout switch as a type lambda, so that a
 * caller holding a union of maths can distribute over it and keep the pairing
 * with the outgoing element instead of collapsing both into one tuple of unions.
 */
export interface AsBeginningPatternPlaybackWithShortFadeinTakingAsset
  extends LambdaAllArgs {
  <TMath extends BlissfulGridTimingsMathAtAnyQuant>(
    desiredAsset: TaggedPatternPointer,
    blissfulGridTimingsMath: TMath,
  ): BeginningPatternPlaybackWithShortFadein<TMath>
  readonly '~lambda.inAllArgsTuple': Parameters<this>
  readonly '~lambda.out': BeginningPatternPlaybackWithShortFadein<
    this['~lambda.inAllArgsTuple'][1]
  >
}

export interface BeginningPatternPlaybackWithShortFadein<TMath>
  extends Effect.Effect<
    BeginningFor<TMath>,
    never,
    AudioBufferStore | ScheduleFadeIntoLoopPlayback
  > {}

/**
 * Starts the next incoming playback at the quant class of the passed math. The
 * branch is the same one every transition state needs, and keeping it here means
 * a union of maths can be fed through {@link distribute} instead of spelling out
 * the two branches at every call site.
 */
export const beginAnotherPatternPlaybackWithShortFadein = <
  TMath extends BlissfulGridTimingsMathAtAnyQuant,
>(
  desiredAsset: TaggedPatternPointer,
  blissfulGridTimingsMath: TMath,
): BeginningPatternPlaybackWithShortFadein<TMath> =>
  (blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
    ? BeginningPatternPlaybackAtInitialQuantWithShortFadein.init(
        desiredAsset,
        calcBlissfulGridTimingsMathAtLastQuant(blissfulGridTimingsMath),
      )
    : BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init(
        desiredAsset,
        calcBlissfulGridTimingsMathAtMiddleQuant(blissfulGridTimingsMath),
      )) as BeginningPatternPlaybackWithShortFadein<TMath>

/**
 * The short-fadeout class a fadein turns into when it is promoted to fade out:
 * its `beginningMath` still says where the fadein began, its `endingMath` says
 * where the short fadeout ends. The four combined classes are matched by quant
 * class here instead of relying on the naming convention.
 */
export type BeginningAndEndingFor<TBeginningMath, TEndingMath> = [
  TBeginningMath,
] extends [BlissfulGridTimingsMathAtLastQuant]
  ? [TEndingMath] extends [BlissfulGridTimingsMathAtLastQuant]
    ? BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout
    : [TEndingMath] extends [BlissfulGridTimingsMathAtMiddleQuant]
      ? BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout
      : never
  : [TBeginningMath] extends [BlissfulGridTimingsMathAtMiddleQuant]
    ? [TEndingMath] extends [BlissfulGridTimingsMathAtLastQuant]
      ? BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout
      : [TEndingMath] extends [BlissfulGridTimingsMathAtMiddleQuant]
        ? BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout
        : never
    : never

/**
 * The result of promoting a short fadein to a short fadeout as an effect. Both
 * quant classes stay type parameters, so a caller that knows only one of them
 * keeps the correlation instead of collapsing into the union of the four
 * combined classes.
 */
export interface BeginningPatternPlaybackPromotedToShortFadingOut<
  TBeginningMath,
  TEndingMath,
> extends Effect.Effect<
    BeginningAndEndingFor<TBeginningMath, TEndingMath>,
    never,
    CleanupFiberMaker | DisposePlayback | ScheduleFadeOut
  > {}

/**
 * The promoted element of a short-fadeout switch as a type lambda. The beginning
 * quant is fixed by the class the method sits on, so it is a parameter of the
 * lambda itself; the ending quant comes from the call, which keeps a caller
 * holding a union of maths able to distribute instead of collapsing the pair
 * into one union of combined classes.
 */
export interface AsPromoteToShortFadingOut<TBeginningMath>
  extends LambdaAllArgs {
  <TEndingMath extends BlissfulGridTimingsMathAtAnyQuant>(
    blissfulGridTimingsMath: TEndingMath,
  ): BeginningPatternPlaybackPromotedToShortFadingOut<
    TBeginningMath,
    TEndingMath
  >
  readonly '~lambda.inAllArgsTuple': [BlissfulGridTimingsMathAtAnyQuant]
  readonly '~lambda.out': BeginningPatternPlaybackPromotedToShortFadingOut<
    TBeginningMath,
    this['~lambda.inAllArgsTuple'][0]
  >
}

/**
 * A whole switch away from the currently fading-in pattern: the old incoming
 * element is promoted to a short fadeout, and a new incoming element begins at
 * the same quant. Both depend on the math, and the promoted element also depends
 * on the class of the old incoming one, so a caller holding either as a union
 * has to distribute over both to keep the resulting queue element pair
 * correlated instead of collapsing into one tuple of unions.
 */
export interface AsShortFadeinSwitchedToAnotherPatternMake
  extends LambdaAllArgs {
  <
    TIncoming extends BeginningPatternPlaybackWithShortFadeinVariants,
    TMath extends BlissfulGridTimingsMathAtAnyQuant,
  >(
    incoming: TIncoming,
    desiredAsset: TaggedPatternPointer,
    blissfulGridTimingsMath: TMath,
  ): Effect.Effect<
    [BeginningAndEndingFor<TIncoming['math'], TMath>, BeginningFor<TMath>],
    never,
    | CleanupFiberMaker
    | DisposePlayback
    | ScheduleFadeOut
    | AudioBufferStore
    | ScheduleFadeIntoLoopPlayback
  >
  readonly '~lambda.inAllArgsTuple': [
    BeginningPatternPlaybackWithShortFadeinVariants,
    TaggedPatternPointer,
    BlissfulGridTimingsMathAtAnyQuant,
  ]
  readonly '~lambda.out': Effect.Effect<
    [
      BeginningAndEndingFor<
        this['~lambda.inAllArgsTuple'][0]['math'],
        this['~lambda.inAllArgsTuple'][2]
      >,
      BeginningFor<this['~lambda.inAllArgsTuple'][2]>,
    ],
    never,
    | CleanupFiberMaker
    | DisposePlayback
    | ScheduleFadeOut
    | AudioBufferStore
    | ScheduleFadeIntoLoopPlayback
  >
}
