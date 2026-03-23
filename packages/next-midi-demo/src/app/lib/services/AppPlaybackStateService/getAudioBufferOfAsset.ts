import * as EAudioContext from 'effect-web-audio/EAudioContext'

import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'

import {
  getLocalAssetFileName,
  TaggedPatternPointer,
  TaggedSlowStrumPointer,
} from '../../audioAssetHelpers.ts'
import { getFileHandle, readFileBuffer } from '../../opfs.ts'
import type { CurrentSelectedAsset } from '../CurrentlySelectedAssetState.ts'

export const makeGetAudioBufferOfAsset = (
  audioContext: EAudioContext.Instance,
  rootDirectoryHandle: FileSystemDirectoryHandle,
) =>
  Effect.fn('getAudioBufferOfAsset')(function* ({
    accord,
    pattern,
    strength,
  }: CurrentSelectedAsset) {
    const pointer = Option.match(pattern, {
      onNone: () =>
        new TaggedSlowStrumPointer({
          accordIndex: accord.index,
          strength,
        }),
      onSome: p =>
        new TaggedPatternPointer({
          accordIndex: accord.index,
          patternIndex: p.index,
          strength,
        }),
    })
    const assetFileHandle = yield* getFileHandle({
      dirHandle: rootDirectoryHandle,
      fileName: getLocalAssetFileName(pointer),
    })

    const fileArrayBuffer = yield* readFileBuffer(assetFileHandle)

    return yield* EAudioContext.decodeAudioData(audioContext, fileArrayBuffer)
  })
