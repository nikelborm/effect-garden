#!/usr/bin/env bun

import { existsSync } from 'fs';
import { readdir, rm, stat } from 'fs/promises';
import { basename, join } from 'path';
import { passthroughSpawn } from './lib/passthroughSpawn.ts';

// TODO: add options to enable/disable node_modules, .lock and turbo stuff
// dynamically, and don't forget about changing --frozen-lockfile below
const deleteSet = new Set<string>([
  'node_modules',
  // '.turbo',
  '.next',
  'build',
  // 'bun.lock',
  // 'bun.lockb',
  '__pycache__',
  // because we don't use yarn, npm, or pnpm
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
  'dist-types',
  'dist',
]);

const cleanTree = async (dirPath: string): Promise<void> => {
  if (deleteSet.has(basename(dirPath))) {
    console.log(`Deleting: ${dirPath}`);
    await rm(dirPath, { recursive: true, force: true });
    return;
  }

  const stats = await stat(dirPath);
  if (!stats.isDirectory()) return;

  const entries = await readdir(dirPath);

  await Promise.allSettled(
    entries.map(entry => cleanTree(join(dirPath, entry))),
  );
};

const rootDir = join(import.meta.dir, '..', '..');

console.log('Project root dir: ', rootDir);

if (rootDir === '/')
  throw new Error(
    "WTF??? The script assumes it's deleting files from a project root folder, but somehow we reached FS root.",
  );

if (!existsSync(join(rootDir, '.git')))
  throw new Error(
    "WTF??? The script assumes it's deleting files from a project root folder, but there's no .git folder in it.",
  );

try {
  await import(join(import.meta.dir, './stop_dev_compose.ts'));
} catch (error) {}

await cleanTree(rootDir);

await passthroughSpawn(
  'bun',
  'install',
  '--prefer-offline',
  '--frozen-lockfile',
);

await passthroughSpawn('bun', 'turbo', 'boundaries');

await passthroughSpawn('bun', 'run', 'build');
