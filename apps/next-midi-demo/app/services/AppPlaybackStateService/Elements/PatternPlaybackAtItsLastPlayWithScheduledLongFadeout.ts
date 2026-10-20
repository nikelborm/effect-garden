import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../domain/AssetPointer.ts'
import { CleanupFiberToolkit } from '../CleanupFiberToolkit.ts'
import { AudioPlayback } from '../common.ts'
import { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { RestoreFullVolume } from '../webAudioSideEffects/RestoreFullVolume.ts'
import { disposeOf } from './DisposedPatternPlayback🏁.ts'
// biome-ignore lint/suspicious/noImportCycles: expected
import { PatternPlayback } from './PatternPlayback.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class PatternPlaybackAtItsLastPlayWithScheduledLongFadeout extends Schema.TaggedClass<PatternPlaybackAtItsLastPlayWithScheduledLongFadeout>()(
  'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout',
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

  static makeSimple = (
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
    cleanupFiberToolkit: CleanupFiberToolkit,
    math: BlissfulGridTimingsMath,
  ) => this.make({ asset, playback, cleanupFiberToolkit, math })

  cancelLongFadeoutAndRestore(now: number) {
    return Effect.gen({ self: this }, function* () {
      yield* RestoreFullVolume.run(this.playback, now)
      yield* this.cleanupFiberToolkit.cancelCleanup
      return PatternPlayback.makeSimple(this.asset, this.playback, this.math)
    }).pipe(
      Effect.withSpan(
        'PatternPlaybackAtItsLastPlayWithScheduledLongFadeout.cancelLongFadeoutAndRestore',
      ),
    )
  }

  dispose() {
    return disposeOf(this.playback)
  }
}
