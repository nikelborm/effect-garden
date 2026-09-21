import type { NonEmptyReadonlyArray } from 'effect/Array'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as EString from 'effect/String'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import { BadExitCodeError } from './BadExitCodeError.ts'

export const observableExec = Effect.fn('observableExec')(function* ({
  cmd,
  cwd,
  badExitCodeErrorMessage,
}: {
  cmd: NonEmptyReadonlyArray<string>
  cwd: string
  badExitCodeErrorMessage: string
}) {
  yield* Console.log(
    EString.stripMargin(`
        |$ cd ${cwd}
        |$ ${cmd.join(' ')}
        |
      `),
  )
  yield* Effect.annotateCurrentSpan({ cmd: cmd.join(' '), cwd })

  const executor = yield* ChildProcessSpawner.ChildProcessSpawner
  const [head, ...rest] = cmd
  const exitCode = yield* executor.exitCode(
    ChildProcess.make(head, rest, {
      cwd,
      stderr: 'inherit',
      stdout: 'inherit',
    }),
  )

  if (exitCode === 0) return yield* Effect.void

  const error = new BadExitCodeError({
    exitCode,
    message: badExitCodeErrorMessage,
    stderr: 'look in the console',
    stdout: 'look in the console',
  })

  return yield* error
})
