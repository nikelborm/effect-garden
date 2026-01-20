import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as FiberMap from 'effect/FiberMap'
import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as KeyedPool from 'effect/KeyedPool'
import * as Option from 'effect/Option'
import * as RcMap from 'effect/RcMap'
import * as Record from 'effect/Record'
import * as Ref from 'effect/Ref'
import * as Schema from 'effect/Schema'
import * as Sink from 'effect/Sink'
import * as SortedMap from 'effect/SortedMap'
import * as Stream from 'effect/Stream'
import type * as Types from 'effect/Types'

import {
  type AssetPointer,
  getAssetFromLocalFileName,
  getLocalAssetFileName,
  getRemoteAssetPath,
  type PatternPointer,
  TaggedPatternPointer,
} from './audioAssetHelpers.ts'
import { getFileHandle, listEntries } from './opfs.ts'

// TODO: ensure only 1 writer to the file.

const ASSET_SIZE_BYTES = 2117490

const asd = getRemoteAssetPath({
  _tag: 'pattern',
  accordIndex: 5,
  patternIndex: 3,
  strength: 's',
})

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
  }).pipe(Stream.unwrap)

// Effect.provide(FetchHttpClient.layer),

class LoadedAssetSizeEstimationMap extends Effect.Service<LoadedAssetSizeEstimationMap>()(
  'next-midi-demo/AudioAssetManager/LoadedAssetSizeEstimationMap',
  {
    dependencies: [RootDirectoryHandle.Default],
    effect: Effect.gen(function* () {
      const rootDirectoryHandle = yield* RootDirectoryHandle
      const mapRef = yield* Effect.flatMap(
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
          Ref.make,
        ),
      ).pipe(Effect.orDie)

      const increaseAssetSize = (
        asset: AssetPointer,
        bytesDownloaded: number,
      ) =>
        Ref.update(mapRef, map =>
          HashMap.modifyAt(
            map,
            asset,
            Option.match({
              onNone: () => Option.some(bytesDownloaded),
              onSome: previousBytes =>
                Option.some(previousBytes + bytesDownloaded),
            }),
          ),
        )

      const getCompletionProgressFrom0To1 = (asset: AssetPointer) =>
        Effect.map(Ref.get(mapRef), map =>
          Option.match(HashMap.get(map, asset), {
            onSome: size => size / ASSET_SIZE_BYTES,
            onNone: () => 0,
          }),
        )

      const isFinished = (asset: AssetPointer) =>
        Effect.map(
          getCompletionProgressFrom0To1(asset),
          progress => progress === 1,
        )

      return {
        increaseAssetSize,
        getCompletionProgressFrom0To1,
        isFinished,
      }
    }),
  },
) {}

class FileAlreadyLoadedError extends Schema.TaggedError<FileAlreadyLoadedError>()(
  'FileAlreadyLoadedError',
  {},
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
            })

            const file = yield* Effect.promise(() => fileHandle.getFile())

            if (file.size === ASSET_SIZE_BYTES)
              return yield* new FileAlreadyLoadedError()

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
      const asd = pool.get(
        TaggedPatternPointer.make({
          accordIndex: 0,
          patternIndex: 0,
          strength: 's',
        }),
      )

      return {
        getWriter: (selector: AssetPointer) => pool.get(selector),
      }
    }),
  },
) {}

export class DownloadManager extends Effect.Service<DownloadManager>()(
  'next-midi-demo/AudioAssetManager/DownloadManager',
  {
    scoped: Effect.gen(function* () {
      // const currentlyLoadingFibers = yield* Ref.make({})
      // const root = yield* RootDirectoryHandle
      const fiberMap = yield* FiberMap.make<string, void, never>()

      // const
      // const assetRefMap
      yield* Effect.void

      return {
        startOrContinueOrIgnoreCompletedCached: Effect.fn(
          'DownloadManager.startOrContinueOrIgnoreCached',
        )(function* (assets: AssetPointer[]) {
          for (const asset of assets) {
          }
          yield* FiberMap.run(fiberMap, 'fiber a', Effect.never)

          yield* Effect.void
        }),
        interruptOrIgnoreNotStarted: Effect.fn(
          'DownloadManager.interruptOrIgnoreNotStarted',
        )(function* (assets: AssetPointer[]) {
          yield* Effect.void
        }),
      }
    }),
  },
) {}

// const

export class AudioAssetSelectionService extends Effect.Service<AudioAssetSelectionService>()(
  'AudioAssetSelectionService',
  {
    effect: Effect.gen(function* () {
      const currentAssetRef = yield* Ref.make<PatternPointer>({
        accordIndex: 0,
        patternIndex: 0,
        strength: 'm',
      })
      const currentlyActiveFibers = []
      return {
        scheduleLoadingExtremelyHighPriorityAsset: (
          asset: AssetPointer[],
        ): Effect.Effect<void> => {
          return Effect.void
        },
        scheduleLoadingAsset: () => {},
        isAssetReady: (asset: AssetPointer) => {},
        getAssetDownloadStatusFrom0To1: (asset: AssetPointer) => {},
      }
    }),
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
