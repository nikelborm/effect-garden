import * as Effect from 'effect/Effect'
import * as KeyedPool from 'effect/KeyedPool'

import {
  type AssetPointer,
  getLocalAssetFileName,
} from '../audioAssetHelpers.ts'
import { getFileHandle } from '../opfs.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class OpfsWritableHandleManager extends Effect.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/OpfsWritableHandleManager',
  {
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const pool = yield* KeyedPool.make({
        acquire: Effect.fn('OpfsWritableHandleManager.acquireWritable')(
          function* (pointer: AssetPointer) {
            const fileHandle = yield* getFileHandle({
              dirHandle: rootDirectoryHandle,
              fileName: getLocalAssetFileName(pointer),
              create: true,
            })

            const file = yield* Effect.promise(() => fileHandle.getFile())

            const writablePointingAtTheEnd = yield* Effect.promise(async () => {
              const writable = await fileHandle.createWritable({
                keepExistingData: true,
              })
              await writable.seek(file.size)
              return writable
            })

            return {
              appendDataToTheEndOfFile: (data: ArrayBuffer) =>
                Effect.zipRight(
                  Effect.promise(() => writablePointingAtTheEnd.write(data)),
                  estimationMap.increaseAssetSize(pointer, data.byteLength),
                ),
              close: Effect.promise(() => writablePointingAtTheEnd.close()),
            }
          },
        ),
        size: 1,
      })

      return {
        getWriter: (selector: AssetPointer) =>
          pool.get(selector).pipe(
            Effect.acquireRelease(e => e.close),
            Effect.acquireRelease(e =>
              Effect.log(
                `OPFS writer finalizer is run a=${selector.accordIndex} p=${selector.patternIndex} s=${selector.strength}`,
                selector,
              ),
            ),
          ),
      }
    }),
  },
) {}
