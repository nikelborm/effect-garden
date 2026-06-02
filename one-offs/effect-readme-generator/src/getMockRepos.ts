import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { type IRepo, RepoZodSchema } from './repo.interface.ts'

export async function getMockRepos(owner: string) {
  const previouslySavedFilePath = path.join(
    process.cwd(),
    './reposCreatedAndStarredByMe.json',
  )

  try {
    const fileContents = await readFile(previouslySavedFilePath, 'utf-8')

    return RepoZodSchema.array().parse(JSON.parse(fileContents))
  } catch (error) {
    console.error(
      `Error while loading ${previouslySavedFilePath}. Falling back to primitive mock.\n`,
      error,
    )
    return ['apache-superset-quick-init', 'download-github-folder'].map(
      name =>
        ({
          name,
          isItArchived: false,
          isTemplate: false,
          starCount: 1,
          forkCount: 0,
          lastTimeBeenPushedInto: new Date(),
          owner,
        }) satisfies IRepo,
    )
  }
}
