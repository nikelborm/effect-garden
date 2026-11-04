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
  BlissfulGridTimingsMath,
  type BlissfulGridTimingsMathAtAnyQuant,
  type BlissfulGridTimingsMathAtLastQuant,
  type BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtInitialQuantWithShortFadein } from './BeginningPatternPlaybackAtInitialQuantWithShortFadein.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadein } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadein.ts'
import type {
  AsBeginningPatternPlaybackWithShortFadeinTakingAsset,
  BeginningPatternPlaybackWithShortFadein,
} from './BeginningPatternPlaybackWithShortFadeinVariants.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { EndingPatternPlaybackAtLastQuantWithShortFadeout } from './EndingPatternPlaybackAtLastQuantWithShortFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { EndingPatternPlaybackAtMiddleQuantWithShortFadeout } from './EndingPatternPlaybackAtMiddleQuantWithShortFadeout.ts'
import type {
  AsEndingPatternPlaybackBeforeAnotherPattern,
  EndingFor,
  EndingPatternPlaybackBeforeAnotherPattern,
} from './EndingPatternPlaybackWithShortFadeoutVariants.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternPlayback extends Schema.TaggedClass<PatternPlayback>()(
  'PatternPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMath,
  },
) {
  declare protected '~brand~': never
  declare readonly beginShortFadeoutBeforeAnotherPattern: AsEndingPatternPlaybackBeforeAnotherPattern
  declare readonly beginAnotherPatternPlaybackWithShortFadein: AsBeginningPatternPlaybackWithShortFadeinTakingAsset
  static {
    this.make = this.make.bind(this)
    const proto = this.prototype as Types.Mutable<PatternPlayback>
    proto.beginShortFadeoutBeforeAnotherPattern =
      lambdaAllArgs<AsEndingPatternPlaybackBeforeAnotherPattern>(function (
        this: PatternPlayback,
        blissfulGridTimingsMath,
      ) {
        return blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
          ? this.beginShortFadeoutBeforeAnotherPatternAtLastQuant(
              blissfulGridTimingsMath,
            )
          : this.beginShortFadeoutBeforeAnotherPatternAtMiddleQuant(
              blissfulGridTimingsMath,
            )
      })

    proto.beginAnotherPatternPlaybackWithShortFadein =
      lambdaAllArgs<AsBeginningPatternPlaybackWithShortFadeinTakingAsset>(
        function (
          this: PatternPlayback,
          desiredAsset,
          blissfulGridTimingsMath,
        ) {
          return blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
            ? this.beginAnotherPatternPlaybackWithShortFadeinAtLastQuant(
                desiredAsset,
                blissfulGridTimingsMath,
              )
            : this.beginAnotherPatternPlaybackWithShortFadeinAtMiddleQuant(
                desiredAsset,
                blissfulGridTimingsMath,
              )
        },
      )
  }

  /** 🏁 */

  beginShortFadeoutBeforeAnotherPatternAtLastQuant<
    TMath extends BlissfulGridTimingsMathAtLastQuant,
  >(blissfulGridTimingsMath: TMath) {
    return this.beginShortFadeoutBeforeAnotherPatternGeneral(
      blissfulGridTimingsMath,
      ScheduleFadeOut.runBoundaryQuantMath,
      EndingPatternPlaybackAtLastQuantWithShortFadeout.makeSimple,
      'Last',
    )
  }

  beginShortFadeoutBeforeAnotherPatternAtMiddleQuant<
    TMath extends BlissfulGridTimingsMathAtMiddleQuant,
  >(blissfulGridTimingsMath: TMath) {
    return this.beginShortFadeoutBeforeAnotherPatternGeneral(
      blissfulGridTimingsMath,
      ScheduleFadeOut.runMiddleQuantMath,
      EndingPatternPlaybackAtMiddleQuantWithShortFadeout.makeSimple,
      'Middle',
    )
  }

  private beginShortFadeoutBeforeAnotherPatternGeneral<
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
      endingMath: TMath,
    ) => R,
    quantSpanName: string,
  ): EndingPatternPlaybackBeforeAnotherPattern<TMath> {
    return Effect.gen({ self: this }, function* () {
      yield* scheduleFadeOut(this.playback, blissfulGridTimingsMath)

      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )

      return make(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        blissfulGridTimingsMath,
      ) as EndingFor<TMath>
    }).pipe(
      Effect.withSpan(
        `PatternPlayback.beginShortFadeoutBeforeAnotherPatternAt${quantSpanName}Quant`,
      ),
    )
  }

  /** 🏁 */
  beginAnotherPatternPlaybackWithShortFadeinAtLastQuant<
    TMath extends BlissfulGridTimingsMathAtLastQuant,
  >(desiredAsset: TaggedPatternPointer, blissfulGridTimingsMath: TMath) {
    return this.beginAnotherPatternPlaybackWithShortFadeinGeneral(
      desiredAsset,
      blissfulGridTimingsMath,
      BeginningPatternPlaybackAtInitialQuantWithShortFadein.init,
    )
  }

  /** 🏁 */
  beginAnotherPatternPlaybackWithShortFadeinAtMiddleQuant<
    TMath extends BlissfulGridTimingsMathAtMiddleQuant,
  >(desiredAsset: TaggedPatternPointer, blissfulGridTimingsMath: TMath) {
    return this.beginAnotherPatternPlaybackWithShortFadeinGeneral(
      desiredAsset,
      blissfulGridTimingsMath,
      BeginningPatternPlaybackAtMiddleQuantWithShortFadein.init,
    )
  }

  private beginAnotherPatternPlaybackWithShortFadeinGeneral<
    TMath extends BlissfulGridTimingsMathAtAnyQuant,
    R,
  >(
    desiredAsset: TaggedPatternPointer,
    blissfulGridTimingsMath: TMath,
    init: (asset: TaggedPatternPointer, math: TMath) => R,
  ): BeginningPatternPlaybackWithShortFadein<TMath> {
    return init(
      desiredAsset,
      blissfulGridTimingsMath,
    ) as BeginningPatternPlaybackWithShortFadein<TMath>
  }

  /** ⚠️ */
  beginLongFadeoutToSilence(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtAnyQuant,
  ) {
    return Effect.gen({ self: this }, function* () {
      //!!!! PROBLEMATIC INCORRECT TIMINGS
      // TODO: should use a different long fadeout instead of the antialising fadeout
      /** ⚠️ */
      yield* ScheduleFadeOut.runFromMath(this.playback, blissfulGridTimingsMath)

      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        blissfulGridTimingsMath,
      )
    }).pipe(Effect.withSpan('PatternPlayback.beginLongFadeoutToSilence'))
  }

  /** 🏁 */
  static init = Effect.fn('PatternPlayback.init')(
    { self: this },
    function* (asset: TaggedPatternPointer, math: BlissfulGridTimingsMath) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
      const playback = yield* StartFreshPlayback.runLooping(
        audioBuffer,
        math.secondsDecimalNowPassedSinceAudioContextInit,
      )

      return this.makeSimple(asset, playback, math)
    },
  )

  /** 🏁 */
  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMath,
  ) => this.make({ asset, playback, math })

  /** 🏁 */
  get chord() {
    return this.asset.chord
  }

  /** 🏁 */
  get pattern() {
    return this.asset.pattern
  }

  /** 🏁 */
  get strength() {
    return this.asset.strength
  }
}
