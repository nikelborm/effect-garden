import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { AudioPlayback } from '../common.ts'
import { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { RestoreFullVolume } from '../webAudioSideEffects/RestoreFullVolume.ts'
import { ScheduleFadeIntoLoopPlayback } from '../webAudioSideEffects/ScheduleFadeIntoLoopPlayback.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { IncomingPatternFadingIn } from './IncomingPatternFadingIn.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'

export class PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern extends Schema.TaggedClass<PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern>()(
  'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    math: BlissfulGridTimingsMath,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  /** 🏁 */
  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    math: BlissfulGridTimingsMath,
  ) => this.make({ asset, playback, cleanupFiberToolkit, math })

  /** 🏁 */
  cancelFadeoutAndRestore = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.cancelFadeoutAndRestore',
  )({ self: this }, function* (now: number) {
    yield* RestoreFullVolume.run(this.playback, now)
    yield* this.cleanupFiberToolkit.cancelCleanup
    return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
  })

  reanchorFadeoutOnto = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.reanchorFadeoutOnto',
  )(
    { self: this },
    function* (now: number, blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      yield* this.cleanupFiberToolkit.cancelCleanup
      yield* RestoreFullVolume.run(this.playback, now)
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
    },
  )

  scheduleNextPattern = Effect.fn(
    'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.scheduleNextPattern',
  )(
    { self: this },
    function* (
      desiredAsset: TaggedPatternPointer,
      now: number,
      blissfulGridTimingsMath: BlissfulGridTimingsMath,
    ) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(desiredAsset)
      const playback = yield* ScheduleFadeIntoLoopPlayback.run(audioBuffer, {
        startAtSecond: now,
        skippedSecondsDuringStart:
          blissfulGridTimingsMath.secondsDecimalPassedSince_LATEST_PatternPlaybackOfTheCurrentGridStarted,
        fadeInStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeInEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadein_ENDS_AT_SECONDS_SinceAudioContextInit,
      })
      return IncomingPatternFadingIn.makeSimple(
        desiredAsset,
        playback,
        blissfulGridTimingsMath,
      )
    },
  )

  dispose() {
    return disposeOf(this.playback)
  }
}
