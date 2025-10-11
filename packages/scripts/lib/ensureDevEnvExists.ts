import { copyFile, exists } from 'fs/promises'
import { devEnvFilePath, devEnvTemplateFilePath } from './paths.ts'

export async function ensureDevEnvExists() {
  const doesDevEnvFileExists = await exists(devEnvFilePath)

  if (!doesDevEnvFileExists)
    await copyFile(devEnvTemplateFilePath, devEnvFilePath)
}
