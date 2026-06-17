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
import {
  closeWritable,
  createWritable,
  getFile,
  getFileHandle,
  type OPFSError,
  seek,
  write,
} from './opfs.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

export class OpfsWritableHandleManager extends Effect.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/OpfsWritableHandleManager',
  {
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const makeAssetPointerMap = yield* makeAssetPointerMapFactory
      const assetToSemaphoreMap = makeAssetPointerMap(() =>
        Effect.unsafeMakeSemaphore(1),
      )

      const acquireScopedWritePermit = (asset: AssetPointer) =>
        assetToSemaphoreMap.pipe(
          HashMap.unsafeGet(asset),
          semaphore =>
            Effect.acquireRelease(semaphore.take(1), () =>
              semaphore.release(1),
            ),
          Effect.asVoid,
        )

      const acquireFileSink = (asset: AssetPointer) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan({ asset })
          yield* acquireScopedWritePermit(asset)
          const fileName = getLocalAssetFileName(asset)

          const fileHandle = yield* getFileHandle({
            dirHandle: rootDirectoryHandle,
            fileName,
            create: true,
          })

          const file = yield* getFile(fileHandle)

          yield* estimationMap.setVerified(asset, file.size)

          const writablePointingAtTheEnd = yield* pipe(
            createWritable(fileHandle),
            Effect.tap(writable => seek(writable, file.size)),
            Effect.withSpan('makeWritablePointingAtTheEnd'),
          )

          const mailbox = yield* Mailbox.make<
            Uint8Array<ArrayBuffer>,
            OPFSError
          >()

          const writerFiber = yield* Mailbox.toStream(mailbox).pipe(
            Stream.mapEffect(data =>
              Effect.zip(
                write(writablePointingAtTheEnd, data),
                estimationMap.increaseAndUnverifyAssetSize(
                  asset,
                  data.byteLength,
                ),
              ),
            ),
            Stream.runDrain,
            Effect.tapErrorCause(cause => mailbox.failCause(cause)),
            Effect.uninterruptible,
            // What are implications of not using Effect.forkScoped here? I want
            // to ensure that the data would be written, but Effect.forkScoped
            // might trigger the interruption of drain operation when the stream
            // that is drained into the current sink finishes
            Effect.forkDaemon,
          )

          const closeErrorOptionRef = yield* Ref.make<OPFSError | null>(null)

          const closeWritableAndPreserveError = pipe(
            closeWritable(writablePointingAtTheEnd),
            Effect.tapError(error => Ref.set(closeErrorOptionRef, error)),
            Effect.ignoreLogged,
          )

          yield* Effect.addFinalizer(_exit =>
            pipe(
              Effect.all([
                Effect.flatMap(mailbox.end, isNotAlreadyDone =>
                  isNotAlreadyDone
                    ? Effect.ignoreLogged(mailbox.await)
                    : Effect.void,
                ),
                writerFiber.await,
                closeWritableAndPreserveError,
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

          // TODO: make final error exposed to the Sink user
          Sink.unwrap(
            Effect.gen(function* () {
              const closeErrorOption = yield* closeErrorOptionRef
              Sink.failCause
              return Sink.drain
            }),
          )

          // biome-ignore lint/suspicious/useIterableCallbackReturn: false positive
          return Sink.forEach((data: Uint8Array<ArrayBuffer>) =>
            Effect.flatMap(mailbox.offer(data), offeredSuccessfully =>
              offeredSuccessfully
                ? Effect.void
                : Effect.dieMessage(
                    'Cannot consume more elements. The Sink is finalized',
                  ),
            ),
          )
        }).pipe(
          Effect.withSpan('OpfsWritableHandleManager.acquireFileSink'),
          Sink.unwrapScoped,
        )

      return { acquireFileSink }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
