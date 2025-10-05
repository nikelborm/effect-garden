import { devComposeExecInScriptContainer } from './composeCommands.ts';
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './runDevComposeCommandInheritArgs.ts';

export async function runCommandInDedicatedDockerContainer(...cmd: string[]) {}
