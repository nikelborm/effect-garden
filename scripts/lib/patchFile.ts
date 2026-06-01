import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'

export interface Fixer {
  isFine: (obj: unknown) => boolean
  getFixed: (obj: unknown) => unknown
}

export const patchFile = Effect.fn('patchFile')(function* (options: {
  filePath: string
  decode: (s: string) => unknown
  encode: (obj: unknown) => string
  fixers: ReadonlyArray<Fixer>
  defaultValue: unknown
}) {
  const fs = yield* FileSystem.FileSystem
  const pathSvc = yield* Path.Path

  const fileExists = yield* fs.exists(options.filePath)
  yield* Effect.annotateCurrentSpan({ filePath: options.filePath, fileExists })

  let current: unknown

  if (fileExists) {
    const content = yield* fs.readFileString(options.filePath)
    current = options.decode(content)
  } else {
    yield* fs.makeDirectory(pathSvc.dirname(options.filePath), {
      recursive: true,
    })
    current = options.defaultValue
  }

  let changed = !fileExists
  let result = current

  for (const { isFine, getFixed } of options.fixers) {
    if (isFine(result)) continue

    result = getFixed(result)
    changed = true
  }

  if (changed)
    yield* fs.writeFileString(options.filePath, options.encode(result))
})
