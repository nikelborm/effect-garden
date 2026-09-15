import type * as Command from '@effect/platform/Command'
import * as Effect from 'effect/Effect'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import { Uint8ArrayStreamToString } from './Uint8ArrayStreamToString.ts'

export const simpleExec = Effect.fn('simpleExec')(function* (
  command: Command.Command,
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
