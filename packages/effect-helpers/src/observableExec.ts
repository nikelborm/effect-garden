import * as Command from '@effect/platform/Command'
import type { NonEmptyReadonlyArray } from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as EString from 'effect/String'

import { BadExitCodeError } from './BadExitCodeError.ts'
import { simpleExec } from './simpleExec.ts'

export const observableExec = Effect.fn('observableSpawn')(function* ({
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

  const { exitCode, stderr, stdout } = yield* simpleExec(
    Command.make(...cmd).pipe(
      Command.workingDirectory(cwd),
      Command.stderr('inherit'),
      Command.stdout('inherit'),
    ),
  )

  if (exitCode !== 0) {
    const error = new BadExitCodeError({
      exitCode,
      stderr,
      stdout,
    })
    error.message = badExitCodeErrorMessage
    return yield* error
  }
  return yield* Effect.void
})
