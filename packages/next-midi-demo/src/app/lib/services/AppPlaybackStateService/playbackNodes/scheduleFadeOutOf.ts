import * as Effect from 'effect/Effect'

import { maxLoudness, minLoudness } from '../constants.ts'
import type { calcTimingsMath } from '../timingMath.ts'
import type { AudioPlayback } from '../types/index.ts'

export const scheduleFadeOutOf = (
  playback: AudioPlayback,
  math: ReturnType<typeof calcTimingsMath>,
) =>
  Effect.sync(() => {
    playback.gainNode.gain.setValueAtTime(
      maxLoudness,
      math.playbackFadeoutStartsAt,
    )
    playback.gainNode.gain.exponentialRampToValueAtTime(
      minLoudness,
      math.playbackFadeoutEndsAt,
    )
  })
