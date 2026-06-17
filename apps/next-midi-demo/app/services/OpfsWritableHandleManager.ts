import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Mailbox from 'effect/Mailbox'
import * as Ref from 'effect/Ref'
import * as Sink from 'effect/Sink'
import * as Stream from 'effect/Stream'

import type { AssetPointer } from '../brandsAndDatas/AssetPointer.ts'
import { getLocalAssetFileName } from '../helpers/audioAssetFileNameAndPath.ts'
import { makeAssetPointerMapFactory } from '../helpers/makeAssetPointerMap.ts'
import { LoadedAssetSizeEstimationMap } from './LoadedAssetSizeEstimationMap.ts'
import { getFileHandle } from './opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class OpfsWritableHandleManager extends Effect.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/OpfsWritableHandleManager',
  {
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const makeAssetPointerMap = yield* makeAssetPointerMapFactory
      const ref = yield* Ref.make(
        makeAssetPointerMap(() => Effect.unsafeMakeSemaphore(1)),
      )

      const acquireScopedWritePermit = (asset: AssetPointer) =>
        ref.pipe(
          Effect.map(HashMap.unsafeGet(asset)),
          Effect.flatMap(semaphore =>
            Effect.acquireRelease(semaphore.take(1), () =>
              semaphore.release(1),
            ),
          ),
          Effect.asVoid,
        )

      const acquireFileSink = (asset: AssetPointer) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan({ asset })
          yield* acquireScopedWritePermit(asset)
          const fileName = getLocalAssetFileName(asset)

          const mailbox = yield* Mailbox.make<Uint8Array<ArrayBuffer>>()

          yield* Mailbox.toStream(mailbox).pipe(
            Stream.mapEffect(data =>
              pipe(
                Effect.promise(() => writablePointingAtTheEnd.write(data)),
                Effect.andThen(
                  estimationMap.increaseAndUnverifyAssetSize(
                    asset,
                    data.byteLength,
                  ),
                ),
                Effect.withSpan('OpfsWritableHandle.appendDataToTheEndOfFile', {
                  attributes: { fileName, asset, sizeToAdd: data.byteLength },
                }),
              ),
            ),
            Stream.runDrain,
            Effect.uninterruptible,
            // What are implications of not using Effect.forkScoped here? I want
            // to ensure that the data would be written, but Effect.forkScoped
            // might trigger the interruption of drain operation when the stream
            // that is drained into the current sink finishes
            Effect.forkDaemon,
          )

          yield* Effect.addFinalizer(_exit =>
            pipe(
              Effect.all([
                mailbox.end,
                mailbox.await,
                Effect.promise(() => writablePointingAtTheEnd.close()),
                estimationMap.verify(asset),
                Effect.log(
                  `OPFS writer finalizer for accord=${asset.accord} ${
                    asset.pattern ? `pattern=${asset.pattern}` : `         `
                  } strength=${asset.strength} ran`,
                ),
              ]),
              Effect.withSpan('OpfsWritableHandle.close', {
                attributes: { fileName, asset },
              }),
            ),
          )

          const fileHandle = yield* getFileHandle({
            dirHandle: rootDirectoryHandle,
            fileName,
            create: true,
          })

          const file = yield* Effect.promise(() => fileHandle.getFile()).pipe(
            Effect.withSpan('OPFS.getFile', {
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

          // biome-ignore lint/suspicious/useIterableCallbackReturn: false positive
          return Sink.forEach((data: Uint8Array<ArrayBuffer>) =>
            Effect.asVoid(mailbox.offer(data)),
          )
        }).pipe(
          Effect.withSpan('OpfsWritableHandleManager.acquireFileSink'),
          Sink.unwrapScoped,
        )

      return { acquireFileSink }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
