import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
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

      const acquireWritable = Effect.fn(
        'OpfsWritableHandleManager.acquireWritable',
      )(function* (asset: AssetPointer) {
        yield* Effect.annotateCurrentSpan({ asset })

        const fileName = getLocalAssetFileName(asset)

        const fileHandle = yield* getFileHandle({
          dirHandle: rootDirectoryHandle,
          fileName,
          create: true,
        })

        const file = yield* Effect.promise(() => fileHandle.getFile()).pipe(
          Effect.withSpan('fileHandle.getFile', {
            attributes: { fileName, asset },
          }),
        )

        yield* estimationMap.setVerified(asset, file.size)

        const writablePointingAtTheEnd = yield* Effect.promise(async () => {
          const writable = await fileHandle.createWritable({
            keepExistingData: true,
          })
          await writable.seek(file.size)
          return writable
        }).pipe(
          Effect.withSpan('makeWritablePointingAtTheEnd', {
            attributes: { fileName, asset },
          }),
        )

        const appendDataToTheEndOfFile = (data: ArrayBuffer) =>
          Effect.promise(() => writablePointingAtTheEnd.write(data)).pipe(
            Effect.andThen(
              estimationMap.increaseAndUnverifyAssetSize(
                asset,
                data.byteLength,
              ),
            ),
            Effect.withSpan('OpfsWritableHandle.appendDataToTheEndOfFile', {
              attributes: { fileName, asset, sizeToAdd: data.byteLength },
            }),
          )

        const close = pipe(
          Effect.promise(() => writablePointingAtTheEnd.close()),
          Effect.andThen(estimationMap.verify(asset)),
          Effect.withSpan('OpfsWritableHandle.close', {
            attributes: { fileName, asset },
          }),
        )

        return { appendDataToTheEndOfFile, close }
      })

      const pool = yield* KeyedPool.make({ size: 1, acquire: acquireWritable })

      const getWriter = (selector: AssetPointer) =>
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
          Effect.withSpanScoped('OpfsWritableHandleManager.lifetime'),
        )

      return { getWriter }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
