import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AudioContextInitError } from '../../DeferredAudioContextService.ts'
import * as DeferredAudioContextService from '../../DeferredAudioContextService.ts'

export class GetAudioNow extends Context.Service<
  GetAudioNow,
  () => Effect.Effect<number, AudioContextInitError>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/GetAudioNow',
) {
  static run = () => this.use(getNow => getNow())
}

export const GetAudioNowLayer = Layer.effect(
  GetAudioNow,
  Effect.map(
    DeferredAudioContextService.DeferredAudioContextService,
    context => () => context.currentTime,
  ),
)
