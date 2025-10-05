#!/usr/bin/env bun

import { mkdir } from 'fs/promises';
import { runDevComposeCommandThatInheritsArgs } from './lib/runDevComposeCommandInheritArgs.ts';
import { projectTurboCacheDirPath } from './lib/paths.ts';

await mkdir(projectTurboCacheDirPath, { recursive: true });

await runDevComposeCommandThatInheritsArgs('start');
