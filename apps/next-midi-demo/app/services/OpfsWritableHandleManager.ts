import * as Cause from 'effect/Cause'
import * as Context from 'effect/Context'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { pipe } from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Queue from 'effect/Queue'
import * as Ref from 'effect/Ref'
import * as Semaphore from 'effect/Semaphore'
import * as Sink from 'effect/Sink'
import * as Stream from 'effect/Stream'
import * as Tracer from 'effect/Tracer'

import type { AssetPointer } from '../domain/AssetPointer.ts'
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

export class OpfsWritableHandleManager extends Context.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/OpfsWritableHandleManager',
  {
    make: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const assetToSemaphoreMapRef = yield* Ref.make(
        HashMap.empty<AssetPointer, Semaphore.Semaphore>(),
      )

      const acquireScopedWritePermit = (asset: AssetPointer) =>
        assetToSemaphoreMapRef.pipe(
          Ref.modify(map => {
            const existingSemaphoreOption = HashMap.get(map, asset)
            const semaphore = Option.getOrElse(existingSemaphoreOption, () =>
              Semaphore.makeUnsafe(1),
            )
            return [
              // effect's success
              semaphore,
              // new ref value
              Option.match(existingSemaphoreOption, {
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

          const queue = yield* Queue.make<Uint8Array<ArrayBuffer>, Cause.Done>()

          const writerDeferred =
            yield* Deferred.make<Exit.Exit<void, OPFSError>>()

          yield* Stream.fromQueue(queue).pipe(
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
            Effect.tapCause(() => Queue.shutdown(queue)), // forceful
            Effect.exit,
            Deferred.into(writerDeferred),
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
            Effect.forkDetach,
          )

          // Memoized via Effect.cached so it can be driven from BOTH the sink's
          // normal completion path AND the scope finalizer (interruption
          // safety-net) while its side effects run exactly once.
          const finalize = yield* Effect.cached(
            Effect.gen(function* () {
              yield* Queue.end(queue) // graceful: writer drains the rest, then exits
              const writerExit = yield* Deferred.await(writerDeferred)
              const closeExit = yield* Effect.exit(
                closeWritable(writablePointingAtTheEnd),
              )

              const causeOption = Option.zipWith(
                Exit.causeOption(writerExit),
                Exit.causeOption(closeExit),
                Cause.sequential,
              ).pipe(
                Option.orElse(() => Exit.causeOption(closeExit)),
                Option.orElse(() => Exit.causeOption(writerExit)),
              )

              // Only trust the on-disk file when nothing failed. After a write
              // error the file may be torn, so it must not be marked verified.
              if (Option.isNone(causeOption)) yield* estimationMap.verify(asset)

              return causeOption
            }).pipe(
              // Uninterruptible so that, once started, it always closes the
              // writable and writes a real result into the cached Deferred. An
              // interrupt mid-run would otherwise poison the memo, and the
              // safety-net finalizer would await a close that never happened.
              Effect.uninterruptible,
              Effect.withSpan('OpfsWritableHandle.close', {
                attributes: { fileName, asset },
              }),
            ),
          )

          const finalizeAndSurface = Effect.flatMap(
            finalize,
            Option.match({
              onNone: () => Effect.void,
              onSome: Effect.failCause,
            }),
          )

          yield* Effect.addFinalizer(() =>
            finalize.pipe(
              Effect.flatMap(
                Option.match({
                  onNone: () => Effect.void,
                  onSome: cause =>
                    Effect.logError(
                      'OPFS writer finalizer (interruption safety-net) observed a write/close error',
                      cause,
                    ),
                }),
              ),
              Effect.withSpan('OpfsWritableHandle.finalizer', {
                attributes: { fileName, asset },
              }),
            ),
          )

          return Sink.flatMap(
            Sink.forEach((data: Uint8Array<ArrayBuffer>) =>
              Effect.flatMap(Queue.offer(queue, data), accepted =>
                accepted ? Effect.void : finalizeAndSurface,
              ),
            ),
            () => Sink.fromEffect(finalizeAndSurface),
          )
        }).pipe(
          Effect.withSpan('OpfsWritableHandleManager.acquireFileSink'),
          Sink.unwrapScoped,
        )

      return { acquireFileSink }
    }).pipe(Effect.withSpan('OpfsWritableHandleManager.init')),
  },
) {}
