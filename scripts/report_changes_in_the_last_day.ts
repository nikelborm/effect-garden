#!/usr/bin/env bun

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as Cause from 'effect/Cause'
import * as Effect from 'effect/Effect'

import { passthroughSpawn } from './lib/passthroughSpawn.ts'

const program = Effect.gen(function* () {
  const now = yield* Effect.sync(() => new Date())

  // const branch = 'claude-test'
  const branch = 'main'

  const dayInMinutes = 24 * 60
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  const _minutesSincePreviousMidnight = dayInMinutes + minutesSinceMidnight

  const url =
    'https://diffshub.com/nikelborm/effect-garden/compare/' +
    encodeURIComponent(`${branch}@{${minutesSinceMidnight}minutes}...${branch}`)

  yield* passthroughSpawn('xdg-open', url)
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
