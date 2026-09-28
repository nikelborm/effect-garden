import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

export class GetAudioNow extends Context.Service<
  GetAudioNow,
  () => Effect.Effect<number>
>()('next-midi-demo/GetAudioNow') {
  static run = () => this.use(getNow => getNow())
}

export const GetAudioNowLayer = Layer.effect(
  GetAudioNow,
  Effect.map(
    EAudioContext.EAudioContext,
    context => () => EAudioContext.currentTime(context),
  ),
)
