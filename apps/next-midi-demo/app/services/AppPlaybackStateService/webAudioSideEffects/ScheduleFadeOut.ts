import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioPlayback } from '../common.ts'
import { maxLoudness, minLoudness } from '../constants.ts'
import type { Slot } from '../zones.ts'

export class ScheduleFadeOut extends Context.Service<
  ScheduleFadeOut,
  (playback: AudioPlayback, slot: Slot) => Effect.Effect<void>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/ScheduleFadeOut',
) {
  static run = (playback: AudioPlayback, slot: Slot) =>
    this.use(scheduleFadeOut => scheduleFadeOut(playback, slot))
}

export const ScheduleFadeOutLayer = Layer.succeed(
  ScheduleFadeOut,
  (playback: AudioPlayback, slot: Slot) =>
    Effect.sync(() => {
      playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        slot.fadeoutStartsAtSecond,
      )
      playback.gainNode.gain.exponentialRampToValueAtTime(
        minLoudness,
        slot.fadeoutEndsAtSecond,
      )
    }),
)
