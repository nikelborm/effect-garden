#!/usr/bin/env bun

import { drizzleKitMigrateDev } from './lib/composeCommands.ts';
import { ensureDevScriptRunnerIsReady } from './lib/ensureDevScriptRunnerIsReady.ts';
import { ensurePgDevIsHealthy } from './lib/ensurePgDevIsHealthy.ts';
import { runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId } from './lib/runDevComposeCommandInheritArgs.ts';

await Promise.all([ensureDevScriptRunnerIsReady(), ensurePgDevIsHealthy()]);

console.log('Script runner is ready');

await runCmdThatInheritsArgsAndExpectsDevEnvAndGroupId(...drizzleKitMigrateDev);

console.log();
