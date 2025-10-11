#!/usr/bin/env bun

import type { Stats } from 'fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'fs/promises'
import { dirname, join } from 'path'

const SRC_DIR = 'packages_dirty'
const DEST_DIR = 'packages'

const getObjectSortedByKeys = (obj: Exclude<object, null>) =>
  Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0])),
  )

async function writeOnlyRelevantDepsFieldsToNewFile(
  fromFilePath: string,
  toFilePath: string,
) {
  const content = await readFile(fromFilePath, 'utf8')
  const pkg = JSON.parse(content)

  const filtered: Record<string, any> = {}

  for (const key of [
    'name',
    'type',
    'workspaces',
    'patchedDependencies',
    'catalog',
  ])
    if (key in pkg)
      filtered[key] =
        typeof pkg[key] === 'object' &&
        pkg[key] !== null &&
        !Array.isArray(pkg[key])
          ? getObjectSortedByKeys(pkg[key])
          : pkg[key]

  if ('dependencies' in pkg || 'devDependencies' in pkg) {
    const commonDependencyNames = new Set(
      Object.keys(pkg['dependencies'] || {}),
    ).intersection(new Set(Object.keys(pkg['devDependencies'] || {})))

    if (commonDependencyNames.size)
      throw new Error(
        `Found dependencies specified in both devDependencies and dependencies: ${[
          ...commonDependencyNames.keys(),
        ]}}`,
      )

    // for (const key of ['dependencies', 'devDependencies']) {
    //   if (!(key in pkg)) continue;

    //   filtered[key] = Object.fromEntries(
    //     Object.entries(pkg[key]).sort((a, b) => a[0].localeCompare(b[0])),
    //   );
    // }

    // The piece of code below, which I (@nikelborm) wrote, I believe will
    // generate more hash-stable package.json files. But if it will trigger
    // --frozen-lockfile of bun, I'm open to change it back to commented piece
    // above. Before changing it back, don't forget to just try `bun install` in
    // repo root. If it won't fix the problem during container builds, swap
    // commented parts in this script
    filtered['dependencies'] = getObjectSortedByKeys({
      ...(pkg['dependencies'] || {}),
      ...(pkg['devDependencies'] || {}),
    })
  }

  await writeFile(toFilePath, JSON.stringify(filtered, null, 2) + '\n', 'utf8')
}

const sourceDirEntries = await readdir(SRC_DIR, { withFileTypes: true })

const potentialFullPackageJsonPaths = sourceDirEntries.map(entry =>
  join(SRC_DIR, entry.name, 'package.json'),
)

const statsAboutPackageJsons = await Promise.allSettled(
  potentialFullPackageJsonPaths.map(async path => ({
    path,
    stats: await stat(path),
  })),
)

const existingPackageJsonPaths = statsAboutPackageJsons
  .filter(
    (
      e,
    ): e is PromiseFulfilledResult<{
      path: string
      stats: Stats
    }> => e.status === 'fulfilled' && e.value.stats.isFile(),
  )
  .map(e => e.value.path)

await Promise.all(
  existingPackageJsonPaths.map(async dirtyPackageJsonFilePath => {
    const cleanPackageJsonFilePath = dirtyPackageJsonFilePath.replace(
      SRC_DIR,
      DEST_DIR,
    )
    const destDir = dirname(cleanPackageJsonFilePath)

    await mkdir(destDir, { recursive: true })
    await writeOnlyRelevantDepsFieldsToNewFile(
      dirtyPackageJsonFilePath,
      cleanPackageJsonFilePath,
    )
  }),
)

await writeOnlyRelevantDepsFieldsToNewFile('./package.json', './package.json')
