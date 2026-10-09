import * as Effect from 'effect/Effect'

import { devCompose } from './composeCommands.ts'
import { ensureDevEnvExists } from './ensureDevEnvExists.ts'
import { ensureGroupIdEnvVariableAvailable } from './ensureGroupIdEnvVariableAvailable.ts'
import { passthroughSpawnInheritArgs } from './passthroughSpawn.ts'

export const runDevComposeCommandThatInheritsArgs = Effect.fn(
  'runDevComposeCommandThatInheritsArgs',
)(function* (...devComposeCmdSuffix: string[]) {
  yield* runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
    ...(yield* devCompose),
    ...devComposeCmdSuffix,
  )
})

export const runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId = Effect.fn(
  'runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId',
)(function* (...cmd: string[]) {
  yield* ensureDevEnvExists

  yield* ensureGroupIdEnvVariableAvailable

  yield* passthroughSpawnInheritArgs(...cmd)
})
