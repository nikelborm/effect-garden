import type * as EAudioBuffer from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import type * as Scope from 'effect/Scope'

import { AudioPlayback } from './AppPlaybackStateService/types/common.ts'

// TODO: need to handle the path of crash
// export type AudioContextInitError = Effect.Error<
//   ReturnType<typeof EAudioContext.make>
// >
export type AudioContextInitError = never

export type AudioContextDecodeError =
  Effect.Error<EAudioContext.DecodedAudioDataEffect>


// TODO: fix upstream effect-web-audio, to avoid this hack
const unwrapNativeContext = (instance: EAudioContext.Instance): AudioContext =>
  (instance as EAudioContext.Instance & { _audioContext: AudioContext })
    ._audioContext

// TODO: fix upstream effect-web-audio, to avoid this hack
const unwrapNativeBuffer = (buffer: EAudioBuffer.EAudioBuffer): AudioBuffer =>
  (buffer as EAudioBuffer.EAudioBuffer & { _audioBuffer: AudioBuffer })
    ._audioBuffer

export interface DeferredAudioContextServiceShape {
  readonly currentTime: Effect.Effect<number, AudioContextInitError>
  readonly decodeAudioData: (
    encodedAudioBuffer: ArrayBuffer,
  ) => Effect.Effect<
    EAudioBuffer.EAudioBuffer,
    AudioContextInitError | AudioContextDecodeError
  >
  readonly createPlayback: (
    audioBuffer: EAudioBuffer.EAudioBuffer,
  ) => Effect.Effect<AudioPlayback, AudioContextInitError>
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
      // their browser
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
        Effect.flatMap(deferredAudioContext, instance =>
          Effect.sync(() => {
            const nativeAudioContext = unwrapNativeContext(instance)
            const bufferSource = nativeAudioContext.createBufferSource()
            const gainNode = nativeAudioContext.createGain()
            bufferSource.buffer = unwrapNativeBuffer(audioBuffer)
            bufferSource.connect(gainNode)
            gainNode.connect(nativeAudioContext.destination)
            return AudioPlayback.make({ bufferSource, gainNode })
          }),
        ),
    }
  }).pipe(Layer.effect(DeferredAudioContextService))

export const DeferredAudioContextServiceLayer = layer()
