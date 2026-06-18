import * as Cause from 'effect/Cause'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Mailbox from 'effect/Mailbox'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Sink from 'effect/Sink'
import * as Stream from 'effect/Stream'
import * as Tracer from 'effect/Tracer'
import * as Tuple from 'effect/Tuple'

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

          const mailbox = yield* Mailbox.make<Uint8Array<ArrayBuffer>>()

          const closingDeferred =
            yield* Deferred.make<Exit.Exit<void, OPFSError>>()
          const writerDeferred =
            yield* Deferred.make<Exit.Exit<void, OPFSError>>()

          yield* Mailbox.toStream(mailbox).pipe(
            Stream.runForEach(data =>
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
            Effect.tapErrorCause(() => mailbox.shutdown), // forceful
            Effect.exit,
            Effect.intoDeferred(writerDeferred),
            Effect.uninterruptible,
            Effect.withSpan('OpfsFileSink.writerFiber.lifetime'),
            self =>
              Effect.flatMap(
                Effect.serviceOption(Tracer.ParentSpan),
                Option.match({
                  onNone: () => self,
                  onSome: span => Effect.withParentSpan(self, span),
                }),
              ),
            // I want to ensure that the data would be written, and the write
            // operation outlives the scope to ensure the data's written.
            // Effect.forkScoped might trigger the interruption of drain
            // operation when the stream that is drained into the current sink
            // finishes. And I want to avoid that.
            Effect.forkDaemon,
          )

          const closeWritableAndPreserveError = pipe(
            closeWritable(writablePointingAtTheEnd),
            Effect.exit,
            Effect.intoDeferred(closingDeferred),
            Effect.annotateSpans({ asset, fileName }),
          )

          yield* Effect.addFinalizer(_exit =>
            pipe(
              Effect.all([
                mailbox.end, // graceful
                Deferred.await(writerDeferred),
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

          const lockingAwaitOptionCause = Effect.zipWith(
            Deferred.await(writerDeferred),
            Deferred.await(closingDeferred),
            (...exits) => Tuple.map(exits, Exit.causeOption),
            { concurrent: true },
          ).pipe(
            Effect.map(([wroteCauseOption, closedCauseOption]) =>
              Option.zipWith(
                wroteCauseOption,
                closedCauseOption,
                (wrote, closed) => Cause.sequential(wrote, closed),
              ).pipe(
                Option.orElse(() => closedCauseOption),
                Option.orElse(() => wroteCauseOption),
              ),
            ),
          )

          const bothDeferredsCompleted = Effect.zipWith(
            Deferred.poll(writerDeferred),
            Deferred.poll(closingDeferred),
            (writerExitOption, closingExitOption) =>
              Option.isSome(Option.all([writerExitOption, closingExitOption])),
            { concurrent: true },
          )

          const errSink = Sink.dropUntilEffect(
            () => bothDeferredsCompleted,
          ).pipe(
            Sink.flatMap(e =>
              lockingAwaitOptionCause.pipe(
                Effect.map(
                  Option.match({
                    onNone: () => Sink.drain,
                    onSome: Sink.failCause,
                  }),
                ),
                Sink.unwrap,
              ),
            ),
          )

          return Sink.zipLeft(
            errSink,
            // biome-ignore lint/suspicious/useIterableCallbackReturn: false positive
            Sink.forEach((data: Uint8Array<ArrayBuffer>) =>
              Effect.asVoid(mailbox.offer(data)),
            ),
            { concurrent: true },
          )
        }).pipe(
          Effect.withSpan('OpfsWritableHandleManager.acquireFileSink'),
          Sink.unwrapScoped,
        )

      return { acquireFileSink }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
