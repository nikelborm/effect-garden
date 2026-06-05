import * as Schema from 'effect/Schema'

import { TaggedSlowStrumPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { AudioPlayback } from './common.ts'

export class PlayingSlowStrum extends Schema.TaggedClass<PlayingSlowStrum>()(
  'PlayingSlowStrum',
  {
    playbackStartedAtSecond: Schema.Number,
    asset: TaggedSlowStrumPointer,
    playback: AudioPlayback,
  },
) {
  getDuration() {
    return this.playback.getDuration()
  }
}
