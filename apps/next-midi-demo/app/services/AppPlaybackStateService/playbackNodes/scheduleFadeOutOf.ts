import * as Effect from 'effect/Effect'

import { maxLoudness, minLoudness } from '../constants.ts'
import type { AudioPlayback } from '../types/common.ts'
import type { Slot } from '../zones.ts'

export const scheduleFadeOutOf = (playback: AudioPlayback, slot: Slot) =>
  Effect.sync(() => {
    playback.gainNode.gain.setValueAtTime(
      maxLoudness,
      slot.fadeoutStartsAtSecond,
    )
    playback.gainNode.gain.exponentialRampToValueAtTime(
      minLoudness,
      slot.fadeoutEndsAtSecond,
    )
  })
