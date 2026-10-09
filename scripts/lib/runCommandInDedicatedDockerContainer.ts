// TODO
// import { devComposeExecInScriptContainer } from './composeCommands.ts'
// import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './runDevComposeCommandInheritArgs.ts'
import * as Effect from 'effect/Effect'

export const runCommandInDedicatedDockerContainer = Effect.fn(
  'runCommandInDedicatedDockerContainer',
)(function* (..._cmd: string[]) {})
