import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { AudioPlayback } from '../common.ts'
import {
  type BlissfulGridTimingsMathAtAnyQuant,
  BlissfulGridTimingsMathAtLastQuant,
} from '../timingsMath.ts'
import { RestoreFullVolume } from '../webAudioSideEffects/RestoreFullVolume.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout extends Schema.TaggedClass<BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout>()(
  'BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout',
  {
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    beginningMath: BlissfulGridTimingsMathAtLastQuant,
    endingMath: BlissfulGridTimingsMathAtLastQuant,
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
    beginningMath: BlissfulGridTimingsMathAtLastQuant,
    endingMath: BlissfulGridTimingsMathAtLastQuant,
  ) =>
    this.make({
      asset,
      playback,
      cleanupFiberToolkit,
      beginningMath,
      endingMath,
    })

  /** 🏁 */
  cancelShortFadeoutAndRestore(now: number) {
    return Effect.gen({ self: this }, function* () {
      yield* RestoreFullVolume.run(this.playback, now)
      yield* this.cleanupFiberToolkit.cancelCleanup
      return PatternPlayback.makeSimple(
        this.asset,
        this.playback,
        this.endingMath,
      )
    }).pipe(
      Effect.withSpan(
        'BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.cancelShortFadeoutAndRestore',
      ),
    )
  }

  /** 🏁 */
  becomeLongFadeoutToSilence(
    now: number,
    blissfulGridTimingsMath: BlissfulGridTimingsMathAtAnyQuant,
  ) {
    return Effect.gen({ self: this }, function* () {
      const livePlayback = yield* this.cancelShortFadeoutAndRestore(now)
      return yield* livePlayback.beginLongFadeoutToSilence(
        blissfulGridTimingsMath,
      )
    }).pipe(
      Effect.withSpan(
        'BeginningPatternPlaybackAtInitialQuantWithShortFadeinAndEndingAtLastQuantWithShortFadeout.becomeLongFadeoutToSilence',
      ),
    )
  }

  dispose() {
    return disposeOf(this.playback)
  }
}
