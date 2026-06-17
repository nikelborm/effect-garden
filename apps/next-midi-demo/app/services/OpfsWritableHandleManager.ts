import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Mailbox from 'effect/Mailbox'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Sink from 'effect/Sink'
import * as Stream from 'effect/Stream'

import type { AssetPointer } from '../brandsAndDatas/AssetPointer.ts'
import { getLocalAssetFileName } from '../helpers/audioAssetFileNameAndPath.ts'
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
      const assetToSemaphoreMapRef = yield* Ref.make(
        HashMap.empty<AssetPointer, Effect.Semaphore>(),
      )

      const acquireScopedWritePermit = (asset: AssetPointer) =>
        assetToSemaphoreMapRef.pipe(
          Ref.modify(map => {
            const attempt = HashMap.get(map, asset)
            const semaphore = Option.getOrElse(attempt, () =>
              Effect.unsafeMakeSemaphore(1),
            )
            return [
              // effect's success
              semaphore,
              // new ref value
              Option.match(attempt, {
                onSome: () => map,
                onNone: () => HashMap.set(map, asset, semaphore),
              }),
            ]
          }),
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
          yield* Effect.annotateCurrentSpan({ fileName })

          const fileHandle = yield* getFileHandle({
            dirHandle: rootDirectoryHandle,
            fileName,
            create: true,
          })

          const file = yield* getFile(fileHandle).pipe(
            Effect.annotateSpans({ asset, fileName }),
          )

          yield* estimationMap.setVerified(asset, file.size)

          const writablePointingAtTheEnd = yield* pipe(
            createWritable(fileHandle),
            Effect.tap(writable => seek(writable, file.size)),
            Effect.withSpan('makeWritablePointingAtTheEnd', {
              attributes: { asset, fileName },
            }),
          )

          const mailbox = yield* Mailbox.make<
            Uint8Array<ArrayBuffer>,
            OPFSError
          >()
          const span = yield* Effect.currentParentSpan

          const writerFiber = yield* Mailbox.toStream(mailbox).pipe(
            Stream.mapEffect(data =>
              write(writablePointingAtTheEnd, data).pipe(
                Effect.zip(
                  estimationMap.increaseAndUnverifyAssetSize(
                    asset,
                    data.byteLength,
                  ),
                ),
                Effect.withSpan('appendData', {
                  attributes: { asset, fileName },
                }),
              ),
            ),
            Stream.runDrain,
            Effect.tapErrorCause(cause => mailbox.failCause(cause)),
            Effect.uninterruptible,
            Effect.withSpan('OpfsFileSink.writerFiber.lifetime'),
            Effect.withParentSpan(span),
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
            Effect.annotateSpans({ asset, fileName }),
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
