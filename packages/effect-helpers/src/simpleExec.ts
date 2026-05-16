import type * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import * as Effect from 'effect/Effect'

import { Uint8ArrayStreamToString } from './Uint8ArrayStreamToString.ts'

export const simpleExec = Effect.fn('simpleExec')(function* (
  command: Command.Command,
) {
  const executor = yield* CommandExecutor.CommandExecutor
  const process = yield* executor.start(command)

  return yield* Effect.all(
    {
      exitCode: process.exitCode,
      stdout: Uint8ArrayStreamToString(process.stdout),
      stderr: Uint8ArrayStreamToString(process.stderr),
    },
    { concurrency: 'unbounded' },
  )
})
