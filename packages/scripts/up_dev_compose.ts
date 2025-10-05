#!/usr/bin/env bun

import { mkdir } from 'fs/promises';
import { devComposeUpDetached } from './lib/composeCommands.ts';
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts';
import { projectTurboCacheDirPath } from './lib/paths.ts';

await mkdir(projectTurboCacheDirPath, { recursive: true });

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(...devComposeUpDetached);
