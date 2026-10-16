import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import type { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { IncomingPatternFadingIn } from './IncomingPatternFadingIn.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from './PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'

export class PatternPlayback extends Schema.TaggedClass<PatternPlayback>()(
  'PatternPlayback',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: Schema.Finite,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: number,
  ) => this.make({ asset, playback, playbackStartedAtSecond })

  beginShortFadeoutBeforeAnotherPattern = Effect.fn(
    'PatternPlayback.beginShortFadeoutBeforeAnotherPattern',
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

  beginLongFadeoutToSilence = Effect.fn(
    'PatternPlayback.beginLongFadeoutToSilence',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      const { playbackStartedAtSecond } = this
      //!!!! PROBLEMATIC INCORRECT TIMINGS
      const fadeoutStartsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit

      const fadeoutEndsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit

      const fadeoutTimings = { fadeoutStartsAtSecond, fadeoutEndsAtSecond }
      yield* ScheduleFadeOut.run(this.playback, fadeoutTimings)

      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        { playbackStartedAtSecond, fadeoutStartsAtSecond },
      )
    },
  )
}
