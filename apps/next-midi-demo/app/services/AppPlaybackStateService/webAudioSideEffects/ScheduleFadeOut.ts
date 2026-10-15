import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioPlayback } from '../common.ts'
import { maxLoudness, minLoudness } from '../constants.ts'
import type { calcBlissfulGridTimingsMath } from '../timingsMath.ts'

type BlissfulGridTimingsMath = ReturnType<typeof calcBlissfulGridTimingsMath>

export class ScheduleFadeOut extends Context.Service<
  ScheduleFadeOut,
  (
    playback: AudioPlayback,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) => Effect.Effect<void>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/ScheduleFadeOut',
) {
  static run = (
    playback: AudioPlayback,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) =>
    this.use(scheduleFadeOut =>
      scheduleFadeOut(playback, blissfulGridTimingsMath)
    )
}

export const ScheduleFadeOutLayer = Layer.succeed(
  ScheduleFadeOut,
  (
    playback: AudioPlayback,
    blissfulGridTimingsMath: BlissfulGridTimingsMath,
  ) =>
    Effect.sync(() => {
      playback.gainNode.gain.setValueAtTime(
        maxLoudness,
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_STARTS_AT_SECONDS_SinceAudioContextInit,
      )
      playback.gainNode.gain.exponentialRampToValueAtTime(
        minLoudness,
        blissfulGridTimingsMath.patternPlaybackAntialiasingFadeout_ENDS_AT_SECONDS_SinceAudioContextInit,
      )
    }),
)
