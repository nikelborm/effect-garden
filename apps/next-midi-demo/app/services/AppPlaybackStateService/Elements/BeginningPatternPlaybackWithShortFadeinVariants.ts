import type { LambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'

import type * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import type { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import type { AudioBufferStore } from '../../AudioBufferStore.ts'
import type {
  BlissfulGridTimingsMathAtAnyQuant,
  BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from './BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'

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
