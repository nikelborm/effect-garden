import type { EAudioBuffer } from 'effect-web-audio/EAudioBuffer'
import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import type { AssetPointer } from '../domain/AssetPointer.ts'
import { getLocalAssetFileName } from '../helpers/audioAssetFileNameAndPath.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { getFileHandle, readFileBuffer } from './opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class AudioBufferStore extends Context.Tag(
  'next-midi-demo/AudioBufferStore',
)<
  AudioBufferStore,
  {
    readonly getByAsset: (pointer: AssetPointer) => Effect.Effect<EAudioBuffer>
  }
>() {
  static Live = Effect.gen(this, function* () {
    const audioContext = yield* EAudioContext.EAudioContext
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

      return yield* EAudioContext.decodeAudioData(audioContext, fileArrayBuffer)
    }, Effect.orDie)

    return { getByAsset }
  }).pipe(Layer.effect(this))

  static getByAsset = (
    pointer: AssetPointer,
  ): Effect.Effect<EAudioBuffer, never, AudioBufferStore> =>
    Effect.flatMap(this, store => store.getByAsset(pointer))
}
