#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'

import { execDrizzleKitInDevScriptContainer } from './lib/composeCommands.ts'
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts'
import { ensurePgDevIsHealthy } from './lib/ensurePgDevIsHealthy.ts'
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts'

const program = Effect.gen(function* () {
  yield* Effect.all([ensureDevScriptRunnerIsReady, ensurePgDevIsHealthy], {
    concurrency: 'unbounded',
  })

  yield* Console.log('Script runner and db are ready')

  yield* runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
    ...(yield* execDrizzleKitInDevScriptContainer),
  )
}).pipe(
  Effect.scoped,
  Effect.provide(BunServices.layer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catch(e => {
    console.error(Cause.pretty(e))

    return Effect.fail(e)
  }),
)

if (import.meta.main) BunRuntime.runMain(program)
