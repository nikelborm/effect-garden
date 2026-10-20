import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { AudioPlayback } from '../common.ts'
import { BlissfulGridTimingsMath } from '../timingsMath.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'

// @effect-diagnostics-next-line schemaClassMissingBrand:off
export class SlowStrumPlayback extends Schema.TaggedClass<SlowStrumPlayback>()(
  'SlowStrumPlayback',
  {
    math: BlissfulGridTimingsMath,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  static init = Effect.fn('SlowStrumPlayback.init')(
    { self: this },
    function* (asset: TaggedSlowStrumPointer, math: BlissfulGridTimingsMath) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
      const playback = yield* StartFreshPlayback.runOnce(
        audioBuffer,
        math.secondsDecimalNowPassedSinceAudioContextInit,
      )

      return this.makeSimple(asset, playback, math)
    },
  )

  static makeSimple = (
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
    math: BlissfulGridTimingsMath,
  ) => this.make({ asset, playback, math })

  get chord() {
    return this.asset.chord
  }

  get pattern() {
    return this.asset.pattern
  }

  get strength() {
    return this.asset.strength
  }

  getDuration() {
    return this.playback.getDuration()
  }
}
