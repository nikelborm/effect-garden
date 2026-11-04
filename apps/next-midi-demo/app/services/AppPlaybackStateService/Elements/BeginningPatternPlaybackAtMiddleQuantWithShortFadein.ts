import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import {
  type BlissfulGridTimingsMathAtAnyQuant,
  type BlissfulGridTimingsMathAtLastQuant,
  BlissfulGridTimingsMathAtMiddleQuant,
} from '../timingsMath.ts'
import type { DisposePlayback } from '../webAudioSideEffects/DisposePlayback.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout } from './BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.ts'
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
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToShortFadingOut(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtLastQuant,
  ): Effect.Effect<
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout,
    never,
    ScheduleFadeOut | CleanupFiberMaker | DisposePlayback
  >
  promoteToShortFadingOut(
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtMiddleQuant,
  ): Effect.Effect<
    BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout,
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
        return BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.makeSimple(
          this.asset,
          this.playback,
          cleanupFiberToolkit,
          this.math,
          blissfulGridTimingsMath,
        )

      return BeginningPatternPlaybackAtMiddleQuantWithShortFadeinAndEndingAtMiddleQuantWithShortFadeout.makeSimple(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        this.math,
        blissfulGridTimingsMath,
      )
    }).pipe(
      Effect.withSpan(
        'BeginningPatternPlaybackAtMiddleQuantWithShortFadein.promoteToShortFadingOut',
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
  )(function* (
    asset: TaggedPatternPointer,
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtMiddleQuant,
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
