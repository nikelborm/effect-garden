import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import type { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
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

  static init = Effect.fn('IncomingPatternFadingIn.init')(function* (
    asset: TaggedPatternPointer,
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) {
    const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
    const fadeInStartsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
      fadeInEndsAtSecond =
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit

    const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
      startAtSecond: now,
      bufferPhaseOffsetSeconds:
        blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
      fadeInStartsAtSecond,
      fadeInEndsAtSecond,
    })
    return IncomingPatternFadingIn.make({
      asset,
      playback,
      fadeInStartsAtSecond,
      playbackStartedAtSecond: now,
    })
  })
}
