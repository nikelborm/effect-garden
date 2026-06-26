import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../domain/AssetPointer.ts'
import { AudioPlayback } from './common.ts'

export class PlayingSlowStrum extends Schema.TaggedClass<PlayingSlowStrum>()(
  'PlayingSlowStrum',
  {
    playbackStartedAtSecond: Schema.Number,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }

  getDuration() {
    return this.playback.getDuration()
  }
}
