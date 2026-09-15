import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'

import { OPFSError } from './opfs.ts'

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
      catch: cause => new OPFSError({ operation: 'getRoot', cause }),
    }).pipe(
      Effect.withSpan('RootDirectoryHandle.init'),
      Effect.orDie,
      Effect.tapDefect(defectCause =>
        Effect.logError('Defect while getting root OPFS handle', defectCause),
      ),
    ),
  },
) {}
