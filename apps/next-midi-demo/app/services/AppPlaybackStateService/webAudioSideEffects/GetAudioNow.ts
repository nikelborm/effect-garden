import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

// Reads the AudioContext's clock. Every scheduling decision (which zone
// we're in, when a fade should land) is derived from this single impure
// read, so it's the seam between the pure zone math (zones.ts) and the real
// WebAudio clock — the one thing a test needs to fake to control timing.
// Touches no playback at all.
export class GetAudioNow extends Context.Tag('next-midi-demo/GetAudioNow')<
  GetAudioNow,
  () => Effect.Effect<number>
>() {
  static Live = Layer.effect(
    this,
    Effect.map(
      EAudioContext.EAudioContext,
      context => () => EAudioContext.currentTime(context),
    ),
  )

  static run = () => Effect.flatMap(this, getNow => getNow())
}
