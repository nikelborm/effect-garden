import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import type { NonEmptyReadonlyArray } from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EString from 'effect/String'

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

  const executor = yield* CommandExecutor.CommandExecutor
  const process = yield* executor.start(
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
