import * as Effect from 'effect/Effect'
import * as KeyedPool from 'effect/KeyedPool'
import * as Struct from 'effect/Struct'

import type { AssetPointer } from '../brandsAndDatas/AssetPointer.ts'
import { getLocalAssetFileName } from '../helpers/audioAssetFileNameAndPath.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { getFileHandle } from './opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class OpfsWritableHandleManager extends Effect.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/OpfsWritableHandleManager',
  {
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const pool = yield* KeyedPool.make({
        size: 1,
        acquire: Effect.fn('OpfsWritableHandleManager.acquireWritable')(
          function* (pointer: AssetPointer) {
            const fileHandle = yield* getFileHandle({
              dirHandle: rootDirectoryHandle,
              fileName: getLocalAssetFileName(pointer),
              create: true,
            })

            const file = yield* Effect.promise(() => fileHandle.getFile())
            const size = file.size
            yield* estimationMap.setVerified(pointer, size)

            const writablePointingAtTheEnd = yield* Effect.promise(async () => {
              const writable = await fileHandle.createWritable({
                keepExistingData: true,
              })
              await writable.seek(size)
              return writable
            })

            return {
              appendDataToTheEndOfFile: (data: ArrayBuffer) =>
                Effect.zipRight(
                  Effect.promise(() => writablePointingAtTheEnd.write(data)),
                  estimationMap.increaseAndUnverifyAssetSize(
                    pointer,
                    data.byteLength,
                  ),
                ),
              close: Effect.zipRight(
                Effect.promise(() => writablePointingAtTheEnd.close()),
                estimationMap.verify(pointer),
              ),
            }
          },
        ),
      })

      return {
        getWriter: (selector: AssetPointer) =>
          pool.get(selector).pipe(
            Effect.acquireRelease(Struct.get('close')),
            Effect.acquireRelease(() =>
              Effect.log(
                `OPFS writer finalizer for accord=${selector.accord} ${
                  selector.pattern ? `pattern=${selector.pattern}` : `         `
                } strength=${selector.strength} ran`,
              ),
            ),
            Effect.map(Struct.omit('close')),
          ),
      }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
