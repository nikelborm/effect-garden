import * as Effect from 'effect/Effect'
import type * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'

import { Uint8ArrayStreamToString } from './Uint8ArrayStreamToString.ts'

export const simpleExec = Effect.fn('simpleExec')(function* (
  command: ChildProcess.Command,
) {
  const executor = yield* ChildProcessSpawner.ChildProcessSpawner
  const process = yield* executor.spawn(command)

  return yield* Effect.all(
    {
      exitCode: process.exitCode,
      stdout: Uint8ArrayStreamToString(process.stdout),
      stderr: Uint8ArrayStreamToString(process.stderr),
    },
    { concurrency: 'unbounded' },
  )
})
