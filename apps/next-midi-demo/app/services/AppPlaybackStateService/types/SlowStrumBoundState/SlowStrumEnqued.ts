import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../../domain/AssetPointer.ts'
import { AudioPlayback } from '../common.ts'

export class SlowStrumEnqued extends Schema.TaggedClass<SlowStrumEnqued>()(
  'SlowStrumEnqued',
  {
    playbackStartedAtSecond: Schema.Number,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  declare protected '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  getDuration() {
    return this.playback.getDuration()
  }
}
