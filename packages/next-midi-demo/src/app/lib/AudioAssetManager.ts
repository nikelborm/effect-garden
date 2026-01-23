import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as EArray from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as FiberMap from 'effect/FiberMap'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as KeyedPool from 'effect/KeyedPool'
import * as Option from 'effect/Option'
import * as Ref from 'effect/Ref'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import type * as Types from 'effect/Types'

import {
  type AssetPointer,
  getAssetFromLocalFileName,
  getLocalAssetFileName,
  getRemoteAssetPath,
  type PatternPointer,
  type RecordedAccordIndexes,
  type RecordedPatternIndexes,
  type Strength,
} from './audioAssetHelpers.ts'
import { getFileHandle, listEntries } from './opfs.ts'

const ASSET_SIZE_BYTES = 2117490

export class OPFSError extends Schema.TaggedError<OPFSError>()('OPFSError', {
  cause: Schema.Unknown,
}) {}

export class RootDirectoryHandle extends Effect.Service<RootDirectoryHandle>()(
  'next-midi-demo/AudioAssetManager/RootDirectoryHandle',
  {
    scoped: Effect.tryPromise({
      try: () => navigator.storage.getDirectory(),
      catch: cause => new OPFSError({ cause }),
    }).pipe(Effect.orDie),
  },
) {}

const getStreamOfRemoteAsset = (asset: AssetPointer, resumeFromByte?: number) =>
  Effect.gen(function* () {
    const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)
    const response = yield* client.get(
      getRemoteAssetPath(asset),
      resumeFromByte ? { headers: { Range: `bytes=${resumeFromByte}-` } } : {},
    )
    return response.stream as Stream.Stream<
      Uint8Array<ArrayBuffer>,
      HttpClientError.ResponseError,
      never
    >
  }).pipe(Effect.withSpan('getStreamOfRemoteAsset'), Stream.unwrap)

export class OPFSFileNotFoundError extends Schema.TaggedError<OPFSFileNotFoundError>()(
  'OPFSFileNotFoundError',
  { cause: Schema.Unknown },
) {}

// TODO: proper error handling for example when TypeError or ReferenceError on UnsupportedError (navigator.storage.getDirectory)

type FileStats =
  | {
      readonly exists: true
      readonly size: number
    }
  | {
      readonly exists: false
    }

export const checkOPFSFileExists = (fileName: string) =>
  EFunction.pipe(
    RootDirectoryHandle,
    Effect.flatMap(root =>
      Effect.tryPromise({
        try: async (): Promise<FileStats> => {
          const handle = await root.getFileHandle(fileName, { create: false })

          const file = await handle.getFile()
          return { exists: true, size: file.size }
        },
        catch: cause =>
          cause instanceof DOMException && cause.name === 'NotFoundError'
            ? new OPFSFileNotFoundError({ cause })
            : new OPFSError({ cause }),
      }),
    ),
    Effect.catchTag('OPFSFileNotFoundError', () =>
      Effect.succeed<FileStats>({ exists: false }),
    ),
  )

const getFileSize = (fileName: string) =>
  EFunction.pipe(
    RootDirectoryHandle,
    Effect.flatMap(root =>
      Effect.tryPromise({
        try: async () => {
          const handle = await root.getFileHandle(fileName)
          const file = await handle.getFile()
          return file.size
        },
        catch: cause => new OPFSError({ cause }),
      }),
    ),
  )

// Effect.provide(FetchHttpClient.layer),

class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/AudioAssetManager/LoadedAssetSizeEstimationMap',
  {
    dependencies: [RootDirectoryHandle.Default],
    effect: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const getAssetSizesWrittenToDisk = Effect.map(
        listEntries(rootDirectoryHandle),
        EFunction.flow(
          EArray.filter(e => e.kind === 'file'),
          EArray.filterMap(fileEntry =>
            Option.map(
              getAssetFromLocalFileName(fileEntry.name),
              asset => [asset, fileEntry.size] satisfies Types.TupleOf<2, any>,
            ),
          ),
          HashMap.fromIterable,
        ),
      ).pipe(Effect.orDie)

      const assetToSizeHashMapRef = yield* Effect.flatMap(
        getAssetSizesWrittenToDisk,
        Ref.make,
      )

      const getCurrentDownloadedBytes = (asset: AssetPointer) =>
        Effect.map(
          Ref.get(assetToSizeHashMapRef),
          EFunction.flow(
            HashMap.get(asset),
            Option.getOrElse(() => 0),
          ),
        )

      const increaseAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        Effect.flatMap(getCurrentDownloadedBytes(asset), previousBytes =>
          Ref.update(
            assetToSizeHashMapRef,
            HashMap.set(asset, previousBytes + bytesDownloaded),
          ),
        )

      const getCompletionProgressFrom0To1 = EFunction.flow(
        getCurrentDownloadedBytes,
        Effect.map(currentBytes => currentBytes / ASSET_SIZE_BYTES),
      )

      const getCompletionStatus = (asset: AssetPointer) =>
        Effect.flatMap(
          getCurrentDownloadedBytes(asset),
          Effect.fn(function* (currentBytes) {
            if (currentBytes !== ASSET_SIZE_BYTES)
              return 'not finished' as const
            const size = yield* getFileSize(getLocalAssetFileName(asset))
            if (size !== ASSET_SIZE_BYTES) return 'fetched, but not written'
            return 'finished'
          }),
        )

      return {
        increaseAssetSize,
        getCurrentDownloadedBytes,
        getCompletionProgressFrom0To1,
        getCompletionStatus,
      }
    }),
  },
) {}

class OpfsWritableHandleManager extends Effect.Service<OpfsWritableHandleManager>()(
  'next-midi-demo/AudioAssetManager/OpfsWritableHandleManager',
  {
    dependencies: [
      RootDirectoryHandle.Default,
      LoadedAssetSizeEstimationMap.Default,
    ],
    scoped: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const estimationMap = yield* LoadedAssetSizeEstimationMap
      const pool = yield* KeyedPool.make({
        acquire: Effect.fn(
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
          Effect.acquireRelease(writable => writable.close),
          Effect.map(e => e.appendDataToTheEndOfFile),
        ),
        size: 1,
      })

      return {
        getWriter: (selector: AssetPointer) => pool.get(selector),
      }
    }),
  },
) {}

const downloadAsset = Effect.fn('downloadAsset')(function* (
  asset: AssetPointer,
) {
  const opfs = yield* OpfsWritableHandleManager
  const remoteAssetURL = new URL(
    getRemoteAssetPath(asset),
    globalThis?.document?.location.origin,
  ).toString()

  const writeToOPFS = yield* opfs
    .getWriter(asset)
    .pipe(
      Effect.catchTag('OPFSError', err =>
        Effect.dieMessage(
          'cannot download because of underlying opfs err: ' +
            err.message +
            err?.cause?.message,
        ),
      ),
    )

  yield* Effect.log(`Starting download from: ${remoteAssetURL} `)

  const estimationMap = yield* LoadedAssetSizeEstimationMap

  yield* Stream.runForEach(
    getStreamOfRemoteAsset(
      asset,
      yield* estimationMap.getCurrentDownloadedBytes(asset),
    ),
    byteArray => writeToOPFS(byteArray.buffer),
  ).pipe(Effect.orDie)
})

const MAX_PARALLEL_ASSET_DOWNLOADS = 5

export class DownloadManager extends Effect.Service<DownloadManager>()(
  'next-midi-demo/AudioAssetManager/DownloadManager',
  {
    scoped: Effect.map(
      Effect.all({
        fiberMap: FiberMap.make<AssetPointer, void, never>(),
        estimationMap: LoadedAssetSizeEstimationMap,
      }),
      ({ fiberMap, estimationMap }) => {
        const isFiberMapFull = Effect.map(
          FiberMap.size(fiberMap),
          size => size === MAX_PARALLEL_ASSET_DOWNLOADS,
        )

        const isCurrentlyDownloading = (asset: AssetPointer) =>
          FiberMap.has(fiberMap, asset)

        const waitUntilCompletelyFree = FiberMap.awaitEmpty(fiberMap).pipe(
          Effect.withSpan('DownloadManager.waitUntilCompletelyFree'),
        )

        const startOrContinueOrIgnoreCompletedCached = Effect.fn(
          'DownloadManager.startOrContinueOrIgnoreCached',
        )(function* (asset: AssetPointer) {
          const isInProgress = yield* isCurrentlyDownloading(asset)

          if (isInProgress)
            return {
              _tag: 'AssetIsInProgress' as const,
              message: `Asset download is in progress`,
            }

          const areAllBytesFetched = yield* estimationMap.isFinished(asset)

          if (areAllBytesFetched)
            return {
              _tag: 'AssetAlreadyDownloaded' as const,
              message: `All bytes to fetch the asset have been received, although might not have been written`,
            }

          if (yield* isFiberMapFull)
            return {
              _tag: 'DownloadManagerAtMaximumCapacity' as const,
              message: `It's reasonable to start download, but the limit of parallel downloads is reached`,
            }

          const fiber = yield* downloadAsset(asset).pipe(
            FiberMap.run(fiberMap, asset, { onlyIfMissing: true }),
          )

          return {
            _tag: 'StartedDownloadingAsset' as const,
            message: `Asset downloading started`,
            awaitCompletion: fiber.await,
          }
        })

        const interruptOrIgnoreNotStarted = Effect.fn(
          'DownloadManager.interruptOrIgnoreNotStarted',
        )((asset: AssetPointer) => FiberMap.remove(fiberMap, asset))

        return {
          isFiberMapFull,
          isCurrentlyDownloading,
          waitUntilCompletelyFree,
          startOrContinueOrIgnoreCompletedCached,
          interruptOrIgnoreNotStarted,
        }
      },
    ),
  },
) {}

export class CurrentlySelectedAsset extends Effect.Service<CurrentlySelectedAsset>()(
  'next-midi-demo/AudioAssetManager/CurrentlySelectedAsset',
  {
    effect: Effect.map(
      Ref.make<PatternPointer>({
        accordIndex: 0,
        patternIndex: 0,
        strength: 'm',
      }),
      currentAssetRef => ({
        get: () => Ref.get(currentAssetRef),
        setPattern: (patternIndex: RecordedPatternIndexes) =>
          Ref.update(currentAssetRef, prev =>
            prev.patternIndex === patternIndex
              ? prev
              : { ...prev, patternIndex },
          ),
        setAccord: (accordIndex: RecordedAccordIndexes) =>
          Ref.update(currentAssetRef, prev =>
            prev.accordIndex === accordIndex ? prev : { ...prev, accordIndex },
          ),
        setStrength: (strength: Strength) =>
          Ref.update(currentAssetRef, prev =>
            prev.strength === strength ? prev : { ...prev, strength },
          ),
      }),
    ),
  },
) {}

// export class AudioAssetManager extends Effect.Service<AudioAssetManager>()(
//   'AudioAssetManager',
//   {
//     effect: Effect.gen(function* () {
//       const stateRef = Ref.make({})
//       const currentlyActiveFibers = []
//       return {
//         scheduleLoadingExtremelyHighPriorityAsset: (
//           asset: AssetPointer[],
//         ): Effect.Effect<void> => {
//           return Effect.void
//         },
//         scheduleLoadingAsset: () => {},
//         isAssetReady: (asset: AssetPointer) => {},
//         getAssetDownloadStatusFrom0To1: (asset: AssetPointer) => {},
//       }
//     }),
//   },
// ) {}
