import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'

import type { AssetPointer } from '../../audioAssetHelpers.ts'
import { getLocalAssetFileName } from '../../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../../opfs.ts'
import { RootDirectoryHandle } from '../RootDirectoryHandle.ts'

export const getAudioBufferOfAsset = Effect.fn('getAudioBufferOfAsset')(
  function* (pointer: AssetPointer) {
    const audioContext = yield* EAudioContext.EAudioContext
    const rootDirectoryHandle = yield* RootDirectoryHandle

    const assetFileHandle = yield* getFileHandle({
      dirHandle: rootDirectoryHandle,
      fileName: getLocalAssetFileName(pointer),
    })

    const fileArrayBuffer = yield* readFileBuffer(assetFileHandle)

    return yield* EAudioContext.decodeAudioData(audioContext, fileArrayBuffer)
  },
)
