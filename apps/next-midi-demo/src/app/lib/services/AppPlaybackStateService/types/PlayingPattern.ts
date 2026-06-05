import * as Schema from 'effect/Schema'

import { TaggedPatternPointer } from '../../../brandsAndDatas/AssetPointer.ts'
import { AudioPlayback } from './common.ts'

export class PlayingPattern extends Schema.TaggedClass<PlayingPattern>()(
  'PlayingPattern',
  {
    playbackStartedAtSecond: Schema.Number,
    asset: TaggedPatternPointer,
    playback: AudioPlayback,
  },
) {
  getDuration() {
    return this.playback.getDuration()
  }
}
