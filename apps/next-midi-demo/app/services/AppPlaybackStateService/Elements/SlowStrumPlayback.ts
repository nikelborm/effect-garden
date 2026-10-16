import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import { AudioBufferStore } from '../../AudioBufferStore.ts'
import { AudioPlayback } from '../common.ts'
import { StartFreshPlayback } from '../webAudioSideEffects/StartFreshPlayback.ts'

export class SlowStrumPlayback extends Schema.TaggedClass<SlowStrumPlayback>()(
  'SlowStrumPlayback',
  {
    playbackStartedAtSecond: Schema.Finite,
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
    function* (asset: TaggedSlowStrumPointer, now: number) {
      const audioBuffer = yield* AudioBufferStore.getByAsset(asset)
      const playback = yield* StartFreshPlayback.runOnce(audioBuffer, now)

      return this.makeSimple(asset, playback, now)
    },
  )

  static makeSimple = (
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
    playbackStartedAtSecond: number,
  ) => this.make({ asset, playback, playbackStartedAtSecond })

  get accord() {
    return this.asset.accord
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
