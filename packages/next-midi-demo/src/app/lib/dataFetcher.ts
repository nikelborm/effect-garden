import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Schema from 'effect/Schema'
import * as Sink from 'effect/Sink'
import * as Stream from 'effect/Stream'

import type { AudioAssetSelector } from './AudioAssetManager.ts'

export class OPFSFileNotFoundError extends Schema.TaggedError<OPFSFileNotFoundError>()(
  'OPFSFileNotFoundError',
  { cause: Schema.Unknown },
) {}

// TODO: proper error handling for example when TypeError or ReferenceError on UnsupportedError (navigator.storage.getDirectory)

const makeOPFSSink = (fileName: string) => {
  const acquireWritable = Effect.acquireRelease(
    Effect.tryPromise({
      try: async () => {
        const root = await navigator.storage.getDirectory()
        const fileHandle = await root.getFileHandle(fileName, { create: true })
        return await fileHandle.createWritable()
      },
      catch: cause => new OPFSError({ cause }),
    }),
    writable =>
      Effect.tapErrorCause(
        Effect.promise(() => writable.close()),
        e => Console.error('Failed to close OPFS file', e),
      ),
  )

  return Effect.map(acquireWritable, writable =>
    // biome-ignore lint/suspicious/useIterableCallbackReturn: Fine in effect
    Sink.forEach((chunk: Uint8Array<ArrayBuffer>) =>
      Effect.tryPromise({
        try: () => writable.write(chunk),
        catch: cause => new OPFSError({ cause }),
      }),
    ),
  ).pipe(Sink.unwrapScoped)
}

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
    rootDirectoryEffect,
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

export const readOPFSFile = (fileName: string) =>
  Effect.gen(function* () {
    const root = yield* rootDirectoryEffect

    return yield* Effect.tryPromise({
      try: async () => {
        const handle = await root.getFileHandle(fileName, { create: false })
        const file = await handle.getFile()

        const buffer = await file.arrayBuffer()
        return new Uint8Array<ArrayBuffer>(buffer)
      },
      catch: cause => new OPFSError({ cause }),
    })
  })

export const fetchAudioAsset = Effect.fn('fetchAudioAsset')(
  function* (target: AudioAssetSelector) {
    const remoteAssetFileName = `midi_note_${target.noteIndex.toString().padStart(3, '0')}_strength_${target.strength}.wav`
    const remoteAssetFolderName =
      target._tag === 'pattern'
        ? `pattern_${target.patternIndex}`
        : 'slow_strum'

    const remoteAssetURL = new URL(
      `/samples/${remoteAssetFolderName}/${remoteAssetFileName}`,
      globalThis?.document?.location.origin,
    ).toString()

    const opfsAssetFilename = `sample_${remoteAssetFolderName}_${remoteAssetFileName}`

    yield* Console.log(`Starting download from: ${remoteAssetURL}`)

    const shouldLoadLocal = Effect.map(
      checkOPFSFileExists(opfsAssetFilename),
      asset => asset.exists && asset.size === 2117490,
    )

    yield* Console.log('shouldLoadLocal: ', yield* shouldLoadLocal)

    if (yield* shouldLoadLocal) return yield* readOPFSFile(opfsAssetFilename)

    const source = fetchStream(remoteAssetURL)

    yield* Console.log('Broadcasting to OPFS and Byte Counter...')

    const result = yield* source.pipe(
      Stream.tapSink(makeOPFSSink(opfsAssetFilename)),
      Stream.runFold(
        [] as Uint8Array[],
        (acc, chunk: Uint8Array) => (acc.push(chunk), acc),
      ),
      Effect.map(chunks => {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const finalArray = new Uint8Array(totalLength)

        let offset = 0
        for (const chunk of chunks) {
          finalArray.set(chunk, offset)
          offset += chunk.length
        }
        return finalArray
      }),
    )

    yield* Console.log(`Download complete!`)
    yield* Console.log(`Saved to OPFS: /${opfsAssetFilename}`)
    yield* Console.log(`Total bytes processed: ${result.byteLength}`)

    yield* Console.log('shouldLoadLocal: ', yield* shouldLoadLocal)

    return result
  },
  Effect.scoped,
  Effect.tapErrorCause(Console.log),
  Effect.orDie,
)

export const runnable = fetchAudioAsset({
  _tag: 'pattern',
  patternIndex: 1,
  noteIndex: 26,
  strength: 'm',
})
