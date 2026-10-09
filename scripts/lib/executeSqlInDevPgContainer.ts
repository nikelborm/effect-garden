import { BadExitCodeError } from '@evadev/effect-helpers'

import type * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import * as Queue from 'effect/Queue'
import * as Stream from 'effect/Stream'

import { devComposeExec } from './composeCommands.ts'
import { ensurePgDevIsHealthy } from './ensurePgDevIsHealthy.ts'
import { getDevEnvFromFile } from './getDevEnvFromFile.ts'

export const executeSqlInDevPgContainer = Effect.fn(
  'executeSqlInDevPgContainer',
)(function* (getSql: (databaseName: string) => string) {
  const textEncoder = new TextEncoder()
  yield* ensurePgDevIsHealthy

  const env = yield* getDevEnvFromFile

  const databaseName = env.DATABASE_NAME

  const [head, ...rest] = [
    ...(yield* devComposeExec),
    '-T',
    'postgres-dev',
    'psql',
    '-U',
    env.DATABASE_USERNAME,
    databaseName,
  ]

  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const sqlQueue = yield* Queue.unbounded<string, Cause.Done>()

  const handle = yield* ChildProcess.make(head, rest, {
    stdin: Stream.fromQueue(sqlQueue).pipe(
      Stream.map(a => textEncoder.encode(a)),
    ),
    stdout: 'ignore',
    stderr: 'inherit',
  }).pipe(spawner.spawn)

  const sendSql = (getSql: (databaseName: string) => string) =>
    Queue.offer(sqlQueue, getSql(databaseName)).pipe(Effect.withSpan('sendSql'))

  yield* sendSql(getSql)

  const closePsql = Effect.gen(function* () {
    yield* Queue.end(sqlQueue)

    const exitCode = yield* handle.exitCode

    if (exitCode !== 0)
      return yield* new BadExitCodeError({
        exitCode,
        message: 'docker exec command exited with code: ' + exitCode,
        stdout: 'look in the console',
        stderr: 'look in the console',
      })
  }).pipe(Effect.withSpan('closePsql'))

  return { sendSql, closePsql }
})
