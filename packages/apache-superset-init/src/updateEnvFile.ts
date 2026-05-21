import { allFast } from '@evadev/effect-helpers'

import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'

import { generateRandomPassword } from './generateRandomPassword.ts'

export const updateEnvFile = Effect.fn('updateEnvFile')(function* (
  basePath: string,
) {
  const [fs, path] = yield* Effect.all([FileSystem.FileSystem, Path.Path])

  const envFilePath = path.join(basePath, 'docker', '.env')

  const { dbPass, envFile, examplesPass, supersetSecretKey } = yield* allFast({
    envFile: fs.readFileString(envFilePath, 'utf8'),
    dbPass: generateRandomPassword,
    examplesPass: generateRandomPassword,
    supersetSecretKey: generateRandomPassword,
  })

  // TODO: Make sure the replacements actually happen and console.warn if not

  const newEnvFile = envFile
    .replaceAll(
      /^(DEV_MODE|FLASK_DEBUG|PUPPETEER_SKIP_CHROMIUM_DOWNLOAD)=.*/gm,
      `$1=false`,
    )
    .replaceAll(/^(SUPERSET_ENV)=.*/gm, `$1=production`)
    .replaceAll(/^(SUPERSET_LOAD_EXAMPLES)=.*/gm, `$1=no`)
    .replaceAll(/^(ENABLE_PLAYWRIGHT)=.*/gm, `$1=true`)
    .replaceAll(/^(DATABASE_PASSWORD|POSTGRES_PASSWORD)=.*/gm, `$1="${dbPass}"`)
    .replaceAll(/^(EXAMPLES_PASSWORD)=.*/gm, `$1="${examplesPass}"`)
    .replaceAll(/^(SUPERSET_SECRET_KEY)=.*/gm, `$1="${supersetSecretKey}"`)
    .replaceAll(
      /# Make sure you set this to a unique secure random value on production\n/g,
      '',
    )

  yield* fs.writeFileString(envFilePath, newEnvFile, { mode: 0o600 })
})
