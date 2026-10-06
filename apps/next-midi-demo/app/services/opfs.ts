/// <reference lib="dom" />

/**
 * Origin Private File System (OPFS) utilities with Effect integration.
 * Provides type-safe access to the browser's private file system.
 */

import * as Effect from 'effect/Effect'
import * as EFunction from 'effect/Function'
import * as Schema from 'effect/Schema'

import { OPFSError } from './opfsErrors.ts'
import { RootDirectoryHandle } from './RootDirectoryHandle.ts'

/**
 * Simple utility to format bytes as human-readable strings.
 * Based on the common pretty-bytes pattern.
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const

/**
 * Formats a byte count as a human-readable string.
 *
 * @example
 * ```ts
 * prettyBytes(1024) // "1 KB"
 * prettyBytes(1234567) // "1.18 MB"
 * prettyBytes(0) // "0 B"
 * ```
 */
export const prettyBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes)) {
    throw new TypeError(
      `Expected a finite number, got ${typeof bytes}: ${bytes}`,
    )
  }

  const isNegative = bytes < 0
  const absoluteBytes = Math.abs(bytes)

  if (absoluteBytes === 0) {
    return '0 B'
  }

  const exponent = Math.min(
    Math.floor(Math.log10(absoluteBytes) / 3),
    UNITS.length - 1,
  )
  const value = absoluteBytes / 1000 ** exponent
  const unit = UNITS[exponent]
  if (!unit) throw new Error('absurd')

  const formatted = value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })

  return `${isNegative ? '-' : ''}${formatted} ${unit}`
}

export class OPFSFileNotFoundError extends Schema.TaggedError<OPFSFileNotFoundError>()(
  'OPFSFileNotFoundError',
  { cause: Schema.Unknown },
) {}

// Augment FileSystemDirectoryHandle with async iterator methods not yet in TS DOM lib
declare global {
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>
    keys(): AsyncIterableIterator<string>
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>
  }
}

/**
 * Error thrown when OPFS is not supported in the current environment.
 */
export class OPFSNotSupportedError extends Schema.TaggedError<OPFSNotSupportedError>()(
  'OPFSNotSupportedError',
  {
    message: Schema.String,
  },
) {
  static readonly notAvailable = new OPFSNotSupportedError({
    message:
      'OPFS is not available: navigator.storage.getDirectory is not supported',
  })
}

/**
 * Checks if OPFS is supported in the current environment.
 * Verifies both navigator.storage and the getDirectory method exist.
 * Note: Some browsers (Safari, Firefox) expose navigator.storage but not getDirectory.
 */
export const isOPFSSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  navigator.storage !== undefined &&
  typeof navigator.storage.getDirectory === 'function'

/**
 * Gets the OPFS root directory handle.
 * Fails with OPFSNotSupportedError if OPFS is not available.
 */
export const getRootHandle: Effect.Effect<
  FileSystemDirectoryHandle,
  OPFSNotSupportedError
> = Effect.suspend(() => {
  if (!isOPFSSupported()) {
    return Effect.fail(OPFSNotSupportedError.notAvailable)
  }
  return Effect.tryPromise({
    try: () => navigator.storage.getDirectory(),
    catch: () => OPFSNotSupportedError.notAvailable,
  })
})

/**
 * Gets a directory handle for the given absolute path.
 * Creates intermediate directories if they don't exist when `create` is true.
 */
export const getDirHandle = (opts?: {
  /** Absolute path to the directory (e.g., "/foo/bar/baz") */
  absDirPath?: string
  /** Whether to create intermediate directories if they don't exist */
  create?: boolean
}): Effect.Effect<
  FileSystemDirectoryHandle,
  OPFSNotSupportedError | OPFSError
> =>
  Effect.gen(function* () {
    const rootHandle = yield* getRootHandle
    const absDirPath = opts?.absDirPath

    if (absDirPath === undefined || absDirPath === '' || absDirPath === '/') {
      return rootHandle
    }

    const segments = absDirPath.split('/').filter(Boolean)
    let currentHandle = rootHandle

    for (const segment of segments) {
      currentHandle = yield* Effect.tryPromise({
        try: () =>
          currentHandle.getDirectoryHandle(segment, {
            create: opts?.create ?? false,
          }),
        catch: error =>
          OPFSError.make({
            operation: 'getDirectoryHandle',
            path: absDirPath,
            cause: error,
          }),
      })
    }

    return currentHandle
  })

export const getFile = (fileHandle: FileSystemFileHandle) =>
  Effect.tryPromise({
    try: () => fileHandle.getFile(),
    catch: cause =>
      OPFSError.make({
        operation: 'fileHandle.getFile',
        cause,
      }),
  }).pipe(Effect.withSpan('OPFS.fileHandle.getFile'))

export const createWritable = (fileHandle: FileSystemFileHandle) =>
  Effect.tryPromise({
    try: () => fileHandle.createWritable({ keepExistingData: true }),
    catch: cause =>
      OPFSError.make({
        operation: 'fileHandle.createWritable',
        cause,
      }),
  }).pipe(Effect.withSpan('OPFS.fileHandle.createWritable'))

export const seek = (writable: FileSystemWritableFileStream, point: number) =>
  Effect.tryPromise({
    try: () => writable.seek(point),
    catch: cause =>
      OPFSError.make({
        operation: 'writable.seek',
        cause,
      }),
  }).pipe(Effect.withSpan('OPFS.writable.seek'))

export const write = (
  writable: FileSystemWritableFileStream,
  data: Uint8Array<ArrayBuffer>,
) =>
  Effect.tryPromise({
    try: () => writable.write(data),
    catch: error =>
      OPFSError.make({
        operation: 'writable.write',
        cause: error,
      }),
  }).pipe(
    Effect.withSpan('OPFS.writable.write', {
      attributes: { sizeToAdd: data.byteLength },
    }),
  )

export const closeWritable = (writable: FileSystemWritableFileStream) =>
  Effect.tryPromise({
    try: () => writable.close(),
    catch: error =>
      OPFSError.make({
        operation: 'writable.close',
        cause: error,
      }),
  }).pipe(Effect.withSpan('OPFS.writable.close'))

/**
 * Gets a file handle for the given path within a directory.
 */
export const getFileHandle = (opts: {
  /** The directory handle to search in */
  dirHandle: FileSystemDirectoryHandle
  /** The name of the file */
  fileName: string
  /** Whether to create the file if it doesn't exist */
  create?: boolean
}): Effect.Effect<FileSystemFileHandle, OPFSError> =>
  Effect.tryPromise({
    try: () =>
      opts.dirHandle.getFileHandle(opts.fileName, {
        create: opts.create ?? false,
      }),
    catch: error =>
      OPFSError.make({
        operation: 'getFileHandle',
        path: opts.fileName,
        cause: error,
      }),
  }).pipe(
    Effect.withSpan('OPFS.getFileHandle', {
      attributes: { fileName: opts.fileName, create: opts.create ?? false },
    }),
  )

/**
 * Information about a file system entry.
 */
export type EntryInfo =
  | {
      readonly name: string
      readonly kind: 'file'
      readonly size: number
    }
  | {
      readonly name: string
      readonly kind: 'directory'
      readonly size?: never
    }

/**
 * Lists all entries in a directory.
 *
 * @param dirHandle - The directory handle to list
 */
export const listEntries = (
  dirHandle: FileSystemDirectoryHandle,
): Effect.Effect<readonly EntryInfo[], OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      const entries: EntryInfo[] = []

      const fileSizes = []
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle
          fileSizes.push(
            fileHandle.getFile().then(file => {
              entries.push({
                name: entry.name,
                kind: 'file',
                size: file.size,
              })
            }),
          )
        } else {
          entries.push({ name: entry.name, kind: 'directory' })
        }
      }

      await Promise.all(fileSizes)
      return entries
    },
    catch: error =>
      OPFSError.make({
        operation: 'listEntries',
        cause: error,
      }),
  }).pipe(Effect.withSpan('OPFS.listEntries'))

/**
 * Result of printing a directory tree.
 */
export type TreeLine = {
  readonly prefix: string
  readonly icon: '📁' | '📄'
  readonly name: string
  readonly size?: string
}


/**
 * Deletes all entries in a directory recursively.
 *
 * @param dirHandle - The directory handle to clear
 */
export const deleteAll = (
  dirHandle: FileSystemDirectoryHandle,
): Effect.Effect<void, OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      for await (const entryName of dirHandle.keys()) {
        await dirHandle.removeEntry(entryName, { recursive: true })
      }
    },
    catch: error =>
      OPFSError.make({
        operation: 'deleteAll',
        cause: error,
      }),
  })

export const getFileSize = (fileName: string) =>
  EFunction.pipe(
    RootDirectoryHandle,
    Effect.flatMap(root =>
      Effect.tryPromise({
        try: async () => {
          const handle = await root.getFileHandle(fileName)
          const file = await handle.getFile()
          return file.size
        },
        catch: cause => OPFSError.make({ operation: 'getFileSize', cause }),
      }),
    ),
  )

/**
 * Deletes a specific entry from a directory.
 */
export const deleteEntry = (opts: {
  /** The directory containing the entry */
  dirHandle: FileSystemDirectoryHandle
  /** The name of the entry to delete */
  name: string
  /** Whether to delete recursively (for directories with contents) */
  recursive?: boolean
}): Effect.Effect<void, OPFSError> =>
  Effect.tryPromise({
    try: () =>
      opts.dirHandle.removeEntry(opts.name, {
        recursive: opts.recursive ?? false,
      }),
    catch: error =>
      OPFSError.make({
        operation: 'deleteEntry',
        path: opts.name,
        cause: error,
      }),
  })

/**
 * Reads the contents of a file as text.
 *
 * @param fileHandle - The file handle to read
 */
export const readFileText = (
  fileHandle: FileSystemFileHandle,
): Effect.Effect<string, OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      const file = await fileHandle.getFile()

      return file.text()
    },
    catch: error =>
      OPFSError.make({
        operation: 'readFileText',
        cause: error,
      }),
  })

/**
 * Reads the contents of a file as an ArrayBuffer.
 *
 * @param fileHandle - The file handle to read
 */
export const readFileBuffer = (
  fileHandle: FileSystemFileHandle,
): Effect.Effect<ArrayBuffer, OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      const file = await fileHandle.getFile()
      return file.arrayBuffer()
    },
    catch: error =>
      OPFSError.make({
        operation: 'readFileBuffer',
        cause: error,
      }),
  })

/**
 * Writes text content to a file.
 */
export const writeFileText = (opts: {
  /** The file handle to write to */
  fileHandle: FileSystemFileHandle
  /** The text content to write */
  content: string
}): Effect.Effect<void, OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      const writable = await opts.fileHandle.createWritable()
      await writable.write(opts.content)
      await writable.close()
    },
    catch: error =>
      OPFSError.make({
        operation: 'writeFileText',
        cause: error,
      }),
  })

/**
 * Writes binary content to a file.
 */
export const writeFileBuffer = (opts: {
  /** The file handle to write to */
  fileHandle: FileSystemFileHandle
  /** The binary content to write */
  content: BufferSource
}): Effect.Effect<void, OPFSError> =>
  Effect.tryPromise({
    try: async () => {
      const writable = await opts.fileHandle.createWritable()
      await writable.write(opts.content)
      await writable.close()
    },
    catch: error =>
      OPFSError.make({
        operation: 'writeFileBuffer',
        cause: error,
      }),
  })
