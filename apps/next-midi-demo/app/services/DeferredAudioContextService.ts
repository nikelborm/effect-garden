import * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'

import { AudioPlayback } from './AppPlaybackStateService/types/common.ts'

// TODO: need to handle the path of crash (DONT FUCKING DELETE THIS COMMENT)
// export type AudioContextInitError = EAudioContext.MakeError
export type AudioContextInitError = never

export type AudioContextDecodeError = EAudioContext.DecodeAudioDataError

export interface CreatePlayback {
  /**
   * @param audioBuffer An already decoded buffer to play.
   */
  (
    audioBuffer: EAudioBuffer.EAudioBuffer,
  ): Effect.Effect<AudioPlayback, AudioContextInitError>
}

export interface DeferredAudioContextServiceShape {
  readonly currentTime: EAudioContext.CurrentTimeEffect<AudioContextInitError>

  readonly decodeAudioData: EAudioContext.DecodeAudioDataWith<AudioContextInitError>

  readonly createPlayback: CreatePlayback
}

export class DeferredAudioContextService extends Context.Service<
  DeferredAudioContextService,
  DeferredAudioContextServiceShape
>()('next-midi-demo/DeferredAudioContextService') {}

export const layer = (
  config?: Readonly<EAudioContext.MakeAudioContextOptions>,
) =>
  Effect.gen(function* (): Effect.gen.Return<
    DeferredAudioContextServiceShape,
    never,
    Scope.Scope
  > {
    const deferred = yield* Deferred.make<
      EAudioContext.Instance,
      AudioContextInitError
    >()

    yield* EAudioContext.make(config).pipe(
      // TODO: show the user nice warning about audio context not supported in
      // their browser (DONT FUCKING DELETE THIS COMMENT)
      Effect.orDie,
      Deferred.into(deferred),
      Effect.forkScoped,
    )

    const deferredAudioContext = Deferred.await(deferred)

    return {
      currentTime: Effect.flatMap(
        deferredAudioContext,
        EAudioContext.currentTime,
      ),

      decodeAudioData: (encodedAudioBuffer: ArrayBuffer) =>
        Effect.flatMap(
          deferredAudioContext,
          EAudioContext.decodeAudioData(encodedAudioBuffer),
        ),

      createPlayback: (
        audioBuffer: EAudioBuffer.EAudioBuffer,
      ): Effect.Effect<AudioPlayback, AudioContextInitError> =>
        Effect.map(deferredAudioContext, instance => {
          const nativeAudioContext =
            EAudioContext.unsafeNativeAudioContext(instance)
          const bufferSource = nativeAudioContext.createBufferSource()
          const gainNode = nativeAudioContext.createGain()
          bufferSource.buffer =
            EAudioBuffer.unsafeNativeAudioBuffer(audioBuffer)
          bufferSource.connect(gainNode)
          gainNode.connect(nativeAudioContext.destination)
          return AudioPlayback.make({ bufferSource, gainNode })
        }),
    }
  }).pipe(Layer.effect(DeferredAudioContextService))

export const DeferredAudioContextServiceLayer = layer()
