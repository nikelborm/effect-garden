import { lambdaAllArgs } from '@evadev/effect-helpers/distributeMake.ts'

import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import type * as Types from 'effect/Types'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import type { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { AudioPlayback } from '../common.ts'
import {
  type BlissfulGridTimingsMathAtAnyQuant,
  type BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import type {
  AsPromoteToShortFadingOut,
  BeginningAndEndingFor,
  BeginningPatternPlaybackPromotedToShortFadingOut,
} from './BeginningPatternPlaybackWithShortFadeinVariants.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class BeginningPatternPlaybackAtMiddleQuantWithShortFadein extends Schema.TaggedClass<BeginningPatternPlaybackAtMiddleQuantWithShortFadein>()(
  'BeginningPatternPlaybackAtMiddleQuantWithShortFadein',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMathAtMiddleQuant,
  },
) {
  declare protected '~brand~': never
  declare readonly promoteToShortFadingOut: AsPromoteToShortFadingOut<BlissfulGridTimingsMathAtMiddleQuant>
  static {
    this.make = this.make.bind(this)
    const proto = this
      .prototype as Types.Mutable<BeginningPatternPlaybackAtMiddleQuantWithShortFadein>
    proto.promoteToShortFadingOut = lambdaAllArgs<
      AsPromoteToShortFadingOut<BlissfulGridTimingsMathAtMiddleQuant>
    >(function (
      this: BeginningPatternPlaybackAtMiddleQuantWithShortFadein,
      blissfulGridTimingsMath,
    ) {
      return blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
        ? this.promoteToShortFadingOutAtLastQuant(blissfulGridTimingsMath)
        : this.promoteToShortFadingOutAtMiddleQuant(blissfulGridTimingsMath)
    })
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToShortFadingOutAtLastQuant<
    TMath extends BlissfulGridTimingsMathAtLastQuant,
  >(blissfulGridTimingsMath: TMath) {
    return this.promoteToShortFadingOutGeneral(
      blissfulGridTimingsMath,
      ScheduleFadeOut.runBoundaryQuantMath,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.makeSimple,
      'Last',
    )
  }

  promoteToShortFadingOutAtMiddleQuant<
    TMath extends BlissfulGridTimingsMathAtMiddleQuant,
  >(blissfulGridTimingsMath: TMath) {
    return this.promoteToShortFadingOutGeneral(
      blissfulGridTimingsMath,
      ScheduleFadeOut.runMiddleQuantMath,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.makeSimple,
      'Middle',
    )
  }

  private promoteToShortFadingOutGeneral<
    TMath extends BlissfulGridTimingsMathAtAnyQuant,
    R,
  >(
    blissfulGridTimingsMath: TMath,
    scheduleFadeOut: (
      playback: AudioPlayback,
      math: TMath,
    ) => Effect.Effect<void, never, ScheduleFadeOut>,
    make: (
      asset: TaggedPatternPointer,
      playback: AudioPlayback,
      cleanupFiberToolkit: CleanupFiberToolkit,
      beginningMath: BlissfulGridTimingsMathAtMiddleQuant,
      endingMath: TMath,
    ) => R,
    quantSpanName: string,
  ): BeginningPatternPlaybackPromotedToShortFadingOut<
    BlissfulGridTimingsMathAtMiddleQuant,
    TMath
  > {
    return Effect.gen({ self: this }, function* () {
      yield* scheduleFadeOut(this.playback, blissfulGridTimingsMath)

      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )

      return make(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        this.math,
        blissfulGridTimingsMath,
      ) as BeginningAndEndingFor<BlissfulGridTimingsMathAtMiddleQuant, TMath>
    }).pipe(
      Effect.withSpan(
        `BeginningPatternPlaybackAtMiddleQuantWithShortFadein.promoteToShortFadingOutAt${quantSpanName}Quant`,
      ),
    )
  }

  promoteToFadeToSilence(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtAnyQuant,
  ) {
    return Effect.gen({ self: this }, function* () {
      // TODO: should use a different long fadeout instead of the antialising fadeout
      yield* ScheduleFadeOut.runFromMath(this.playback, blissfulGridTimingsMath)
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        blissfulGridTimingsMath,
      )
    }).pipe(
      Effect.withSpan(
        'BeginningPatternPlaybackAtMiddleQuantWithShortFadein.promoteToFadeToSilence',
      ),
    )
  }

  becomeLive() {
    return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
  }

  /** 🏁 */
  static init = Effect.fn(
    'BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init',
  )(function* <TMath extends BlissfulGridTimingsMathAtMiddleQuant>(
    asset: TaggedPatternPointer,
    blissfulGridTimingsMath: TMath,
  ) {
    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

    const playback = yield* ScheduleFadeIntoLoopPlayback.runMiddleQuantMath(
      audioBuffer,
      blissfulGridTimingsMath,
    )

    return BeginningPatternPlaybackAtMiddleQuantWithShortFadein.makeSimple(
      asset,
      playback,
      blissfulGridTimingsMath,
    )
  })

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMathAtMiddleQuant,
  ) => this.make({ asset, playback, math })
}
