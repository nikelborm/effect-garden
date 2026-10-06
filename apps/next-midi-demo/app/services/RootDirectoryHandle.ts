import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { OPFSError } from './opfsErrors.ts'

export class RootDirectoryHandle extends Context.Service<RootDirectoryHandle>()(
  'next-midi-demo/RootDirectoryHandle',
  {
    make: Effect.tryPromise({
      try: async () => {
        console.time('RootDirectoryHandle')
        const res = await navigator.storage.getDirectory()
        console.timeEnd('RootDirectoryHandle')
        return res
      },
      catch: cause => OPFSError.make({ operation: 'getRoot', cause }),
    }).pipe(
      Effect.withSpan('RootDirectoryHandle.init'),
      Effect.orDie,
      Effect.tapDefect(defectCause =>
        Effect.logError('Defect while getting root OPFS handle', defectCause),
      ),
    ),
  },
) {}

export const RootDirectoryHandleLayer = Layer.effect(
  RootDirectoryHandle,
  RootDirectoryHandle.make,
)
