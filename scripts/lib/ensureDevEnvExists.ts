import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'

import { devEnvFilePath, devEnvTemplateFilePath } from './paths.ts'

export const ensureDevEnvExists = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem

  const doesDevEnvFileExists = yield* fs.exists(devEnvFilePath)

  if (!doesDevEnvFileExists)
    yield* fs.copyFile(devEnvTemplateFilePath, devEnvFilePath)
}).pipe(Effect.withSpan('ensureDevEnvExists'))
