import type { EAudioBuffer } from 'effect-web-audio/EAudioBuffer'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AssetPointer } from '../domain/AssetPointer.ts'
import { getLocalAssetFileName } from '../helpers/audioAssetFileNameAndPath.ts'
import { DeferredAudioContextService } from './DeferredAudioContextService.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { getFileHandle, readFileBuffer } from './opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class AudioBufferStore extends Context.Service<
  AudioBufferStore,
  {
    readonly getByAsset: (pointer: AssetPointer) => Effect.Effect<EAudioBuffer>
  }
>()('next-midi-demo/AudioBufferStore') {
  static getByAsset = (
    pointer: AssetPointer,
  ): Effect.Effect<EAudioBuffer, never, AudioBufferStore> =>
    this.use(store => store.getByAsset(pointer))
}

export const AudioBufferStoreLayer = Effect.gen(function* () {
  const audioContext = yield* DeferredAudioContextService
  const rootDirectoryHandle = yield* RootDirectoryHandle
  const estimationMap = yield* LoadedAssetSizeEstimationMap

  const getByAsset = Effect.fn('AudioBufferStore.getByAsset')(function* (
    pointer: AssetPointer,
  ) {
    yield* estimationMap.assertFinished(pointer)

    const assetFileHandle = yield* getFileHandle({
      dirHandle: rootDirectoryHandle,
      fileName: getLocalAssetFileName(pointer),
    })

    const fileArrayBuffer = yield* readFileBuffer(assetFileHandle)

    return yield* audioContext.decodeAudioData(fileArrayBuffer)
  }, Effect.orDie)

  return { getByAsset }
}).pipe(Layer.effect(AudioBufferStore))
