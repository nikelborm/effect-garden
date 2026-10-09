import { BadExitCodeError } from '@evadev/effect-helpers'

import * as Effect from 'effect/Effect'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import * as Stdio from 'effect/Stdio'

export const passthroughSpawnIgnoreError = Effect.fn(
  'passthroughSpawnIgnoreError',
)(function* (...cmd: string[]) {
  const [head, ...rest] = cmd

  if (!head)
    return yield* Effect.die(
      new Error('passthroughSpawnIgnoreError called with no command'),
    )

  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

  return yield* ChildProcess.make(head, rest, {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    detached: false,
  }).pipe(spawner.exitCode)
})

export const passthroughSpawn = Effect.fn('passthroughSpawn')(function* (
  ...cmd: string[]
) {
  const exitCode = yield* passthroughSpawnIgnoreError(...cmd)

  if (exitCode !== 0)
    return yield* new BadExitCodeError({
      exitCode,
      message: 'process exited with code: ' + exitCode,
      stdout: 'look in the console',
      stderr: 'look in the console',
    })
})

export const passthroughSpawnInheritArgs = Effect.fn(
  'passthroughSpawnInheritArgs',
)(function* (...cmd: string[]) {
  const stdio = yield* Stdio.Stdio
  const extraArgs = yield* stdio.args

  yield* passthroughSpawn(...cmd, ...extraArgs)
})
