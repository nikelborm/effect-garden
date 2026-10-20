import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { CleanupFiberMaker } from '../CleanupFiberMaker.ts'
import { AudioPlayback } from '../common.ts'
import { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { ScheduleFadeOut } from '../webAudioSideEffects/ScheduleFadeOut.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackAtItsLastPlayWithScheduledLongFadeout } from './PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern } from './PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.ts'

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
  static {
    this.make = this.make.bind(this)
  }

  /** 🏁 */
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

      return PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        blissfulGridTimingsMath,
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
      yield* ScheduleFadeOut.run(this.playback, {
        fadeoutStartsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
        fadeoutEndsAtSecond:
          blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      })

      return PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.makeSimple(
        this.asset,
        this.playback,
        yield* CleanupFiberMaker.make(
          blissfulGridTimingsMath.secondsSinceNowUpUntilAntialiasingFadeoutEnds,
        ),
        blissfulGridTimingsMath,
      )
    },
  )

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
