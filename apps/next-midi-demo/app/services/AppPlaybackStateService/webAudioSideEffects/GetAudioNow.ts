import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { identity } from 'effect/Function'
import * as Layer from 'effect/Layer'

import type { AudioContextInitError } from '../../DeferredAudioContextService.ts'
import * as DeferredAudioContextService from '../../DeferredAudioContextService.ts'

export class GetAudioNow extends Context.Service<
  GetAudioNow,
  Effect.Effect<number, AudioContextInitError>
>()(
  'next-midi-demo/app/services/AppPlaybackStateService/webAudioSideEffects/GetAudioNow',
) {
  static run = this.use(identity)
}

export const GetAudioNowLayer =
  DeferredAudioContextService.DeferredAudioContextService.pipe(
    Effect.map(context => context.currentTime),
    Layer.effect(GetAudioNow),
  )
