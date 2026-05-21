import { devCompose } from './composeCommands.ts'
import { ensureDevEnvExists } from './ensureDevEnvExists.ts'
import { ensureGroupIdEnvVariableAvailable } from './ensureGroupIdEnvVariableAvailable.ts'
import { passthroughSpawnInheritArgs } from './passthroughSpawn.ts'

export async function runDevComposeCommandThatInheritsArgs(
  ...devComposeCmdSuffix: string[]
) {
  await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
    ...devCompose,
    ...devComposeCmdSuffix,
  )
}

export async function runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(
  ...cmd: string[]
) {
  await ensureDevEnvExists()

  ensureGroupIdEnvVariableAvailable()

  await passthroughSpawnInheritArgs(...cmd)
}
