import { simpleExec } from '@evadev/effect-helpers'

import * as Effect from 'effect/Effect'
import * as ChildProcess from 'effect/process/ChildProcess'

import { devComposeExec } from './composeCommands.ts'
import { ensureDevComposeServiceIsRunning } from './ensureDevComposeServiceIsRunning.ts'
import { getDevEnvFromFile } from './getDevEnvFromFile.ts'

const pgService = 'postgres-dev'

export const isPgDevHealthy = Effect.gen(function* () {
  const env = yield* getDevEnvFromFile
  const execCmd = yield* devComposeExec
  const [head, ...rest] = [
    ...execCmd,
    '-T',
    pgService,
    'pg_isready',
    '-t',
    '5',
    '-p',
    env.DATABASE_PORT.toString(),
    '-U',
    env.DATABASE_USERNAME,
    '-d',
    env.DATABASE_NAME,
  ]

  const result = yield* simpleExec(ChildProcess.make(head, rest))

  return result.exitCode === 0
}).pipe(Effect.withSpan('isPgDevHealthy'))

export const ensurePgDevIsHealthy = Effect.gen(function* () {
  yield* ensureDevComposeServiceIsRunning(pgService)

  const timeoutMs = 15000

  let isHealthy = yield* isPgDevHealthy

  yield* Effect.gen(function* () {
    while (!isHealthy) {
      yield* Effect.sleep('200 millis')
      isHealthy = yield* isPgDevHealthy
    }
  }).pipe(Effect.timeout(timeoutMs))
}).pipe(Effect.withSpan('ensurePgDevIsHealthy'))
