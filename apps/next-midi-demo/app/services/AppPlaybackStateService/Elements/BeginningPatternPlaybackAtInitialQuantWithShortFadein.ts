import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import {
  type BlissfulGridTimingsMathAtAnyQuant,
  BlissfulGridTimingsMathAtLastQuant,
  type BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class BeginningPatternPlaybackAtInitialQuantWithShortFadein extends Schema.TaggedClass<BeginningPatternPlaybackAtInitialQuantWithShortFadein>()(
  'BeginningPatternPlaybackAtInitialQuantWithShortFadein',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMathAtLastQuant,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToShortFadingOut(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtLastQuant,
  ): Effect.Effect<
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
    never,
    ScheduleFadeOut | CleanupFiberMaker | DisposePlayback
  >
  promoteToShortFadingOut(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtMiddleQuant,
  ): Effect.Effect<
    BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
    never,
    ScheduleFadeOut | CleanupFiberMaker | DisposePlayback
  >
  promoteToShortFadingOut(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtAnyQuant,
  ) {
    return Effect.gen({ self: this }, function* () {
      yield* blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
        ? ScheduleFadeOut.runBoundaryQuantMath(
            this.playback,
            blissfulGridTimingsMath,
          )
        : ScheduleFadeOut.runMiddleQuantMath(
            this.playback,
            blissfulGridTimingsMath,
          )
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )

      if (
        blissfulGridTimingsMath.nextTickAdjustedUpwardsSafeToScheduleIsOnThePatternBoundary
      )
        return BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.makeSimple(
          this.asset,
          this.playback,
          cleanupFiberToolkit,
          this.math,
          blissfulGridTimingsMath,
        )

      return BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.makeSimple(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        this.math,
        blissfulGridTimingsMath,
      )
    }).pipe(
      Effect.withSpan(
        'BeginningPatternPlaybackAtInitialQuantWithShortFadein.promoteToShortFadingOut',
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
        'BeginningPatternPlaybackAtInitialQuantWithShortFadein.promoteToFadeToSilence',
      ),
    )
  }

  becomeLive() {
    return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
  }

  /** 🏁 */
  static init = Effect.fn(
    'BeginningPatternPlaybackAtInitialQuantWithShortFadein.init',
  )(function* <TMath extends BlissfulGridTimingsMathAtLastQuant>(
    asset: TaggedPatternPointer,
    blissfulGridTimingsMath: TMath,
  ) {
    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

    const playback = yield* ScheduleFadeIntoLoopPlayback.runBoundaryQuantMath(
      audioBuffer,
      blissfulGridTimingsMath,
    )

    return BeginningPatternPlaybackAtInitialQuantWithShortFadein.makeSimple(
      asset,
      playback,
      blissfulGridTimingsMath,
    )
  })

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMathAtLastQuant,
  ) => this.make({ asset, playback, math })
}
