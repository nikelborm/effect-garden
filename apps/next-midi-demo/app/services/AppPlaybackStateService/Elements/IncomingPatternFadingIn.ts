import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import type { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { disposeOf } from './DisposedPatternPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from './PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'

export class IncomingPatternFadingIn extends Schema.TaggedClass<IncomingPatternFadingIn>()(
  'IncomingPatternFadingIn',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    fadeInStartsAtSecond: Schema.Finite,
    fadeInEndsAtSecond: Schema.Finite,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  drop() {
    return disposeOf(this.playback)
  }

  promoteToFadingOut = Effect.fn('IncomingPatternFadingIn.promoteToFadingOut')(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  promoteToFadeToSilence = Effect.fn(
    'IncomingPatternFadingIn.promoteToFadeToSilence',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      const cleanupFiberToolkit = yield* CleanupFiberMaker.make(
        blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
      )
      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.make({
        asset: this.asset,
        playback: this.playback,
        playbackStartedAtSecond: this.playbackStartedAtSecond,
        cleanupFiberToolkit,
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
      })
    },
  )

  becomeLive() {
    return PatternPlayback.makeSimple(
      this.asset,
      this.playback,
      this.playbackStartedAtSecond,
    )
  }
}
