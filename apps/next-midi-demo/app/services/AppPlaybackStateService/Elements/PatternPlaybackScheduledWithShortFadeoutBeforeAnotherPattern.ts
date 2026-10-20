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

// @effect-diagnostics-next-line schemaClassMissingBrand:off
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
  cancelShortFadeoutAndRestore(now: number) {
    return Effect.gen({ self: this }, function* () {
      yield* RestoreFullVolume.run(this.playback, now)
      yield* this.cleanupFiberToolkit.cancelCleanup
      return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
    }).pipe(
      Effect.withSpan(
        'PatternPlaybackScheduledWithShortFadeoutBeforeAnotherPattern.cancelShortFadeoutAndRestore',
      ),
    )
  }

  dispose() {
    return disposeOf(this.playback)
  }
}
