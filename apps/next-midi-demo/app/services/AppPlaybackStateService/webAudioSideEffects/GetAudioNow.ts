import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

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
