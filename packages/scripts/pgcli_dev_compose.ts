#!/usr/bin/env bun

import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts';
import { clearScreen } from './lib/clearScreen.ts';
import { ensurePgDevIsHealthy } from './lib/ensurePgDevIsHealthy.ts';

await clearScreen();

await ensurePgDevIsHealthy();

await runDevComposeCommandThatInheritsArgs(
  '--profile',
  'use_pgcli',
  'run',
  '--remove-orphans',
  'pgcli-dev',
);
