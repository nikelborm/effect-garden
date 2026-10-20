import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from './PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class IncomingPatternFadingIn extends Schema.TaggedClass<IncomingPatternFadingIn>()(
  'IncomingPatternFadingIn',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMath,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToShortFadingOut(blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return Effect.gen({ self: this }, function* () {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.makeSimple(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        blissfulGridTimingsMath,
      )
    }).pipe(Effect.withSpan('IncomingPatternFadingIn.promoteToShortFadingOut'))
  }

  promoteToFadeToSilence(blissfulGridTimingsMath: BlissfulGridTimingsMath) {
    return Effect.gen({ self: this }, function* () {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        cleanupFiberToolkit,
        blissfulGridTimingsMath,
      )
    }).pipe(Effect.withSpan('IncomingPatternFadingIn.promoteToFadeToSilence'))
  }

  becomeLive() {
    return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
  }

  /** 🏁 */
  static init = Effect.fn('IncomingPatternFadingIn.init')(function* (
    asset: TaggedPatternPointer,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)

    const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
      startAtSecond:
        blissfulGridTimingsMath.secondsDecimalNowPassedSinceAudioContextInit,
      skippedSecondsDuringStart:
        blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
      fadeInStartsAtSecond:
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
      fadeInEndsAtSecond:
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
    })

    return IncomingPatternFadingIn.makeSimple(
      asset,
      playback,
      blissfulGridTimingsMath,
    )
  })

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMath,
  ) => this.make({ asset, playback, math })
}
