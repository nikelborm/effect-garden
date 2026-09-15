import type { NonEmptyReadonlyArray } from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EString from 'effect/String'
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
  console.log(
    EString.stripMargin(`
        |$ cd ${cwd}
        |$ ${cmd.join(' ')}
        |
      `),
  )
  yield* Effect.annotateCurrentSpan({ cmd: cmd.join(' '), cwd })

  const executor = yield* ChildProcessSpawner.ChildProcessSpawner
  const process = yield* executor.spawn(
    Command.make(...cmd).pipe(
      Command.workingDirectory(cwd),
      Command.stderr('inherit'),
      Command.stdout('inherit'),
    ),
  )

  const exitCode = yield* process.exitCode

  if (exitCode === 0) return yield* Effect.void

  const error = new BadExitCodeError({
    exitCode,
    message: badExitCodeErrorMessage,
    stderr: 'look in the console',
    stdout: 'look in the console',
  })

  return yield* error
})
