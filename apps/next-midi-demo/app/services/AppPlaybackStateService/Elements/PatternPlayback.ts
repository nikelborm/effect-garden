import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import type { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
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

  /** 🏁 */
  beginShortFadeoutBeforeAnotherPattern = Effect.fn(
    'PatternPlayback.beginShortFadeoutBeforeAnotherPattern',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      const { playbackStartedAtSecond } = this,
        fadeoutStartsAtSecond =
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond =
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit

      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond,
        fadeoutEndsAtSecond,
      })

      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        { playbackStartedAtSecond, fadeoutStartsAtSecond },
      )
    },
  )

  /** ⚠️ */
  beginLongFadeoutToSilence = Effect.fn(
    'PatternPlayback.beginLongFadeoutToSilence',
  )(
    { self: this },
    function* (blissfulGridTimingsMath: BlissfulGridTimingsMath) {
      //!!!! PROBLEMATIC INCORRECT TIMINGS
      /** ⚠️ */
      const { playbackStartedAtSecond } = this,
        fadeoutStartsAtSecond =
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond =
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit

      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond,
        fadeoutEndsAtSecond,
      })

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

  /** 🏁 */
  static init = Effect.fn('PatternPlayback.init')(
    { self: this },
    function* (asset: TaggedPatternPointer, now: number) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
      const playback = yield* StartFreshPlayback.runLooping(audioBuffer, now)

      return this.makeSimple(asset, playback, now)
    },
  )

  /** 🏁 */
  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: number,
  ) => this.make({ asset, playback, playbackStartedAtSecond })

  /** 🏁 */
  get accord() {
    return this.asset.accord
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
