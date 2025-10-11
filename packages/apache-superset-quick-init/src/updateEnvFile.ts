import { FileSystem } from '@effect/platform/FileSystem'
import { Path } from '@effect/platform/Path'
import { all, fn } from 'effect/Effect'
import { allWithInheritedConcurrencyByDefault } from './allWithInheritedConcurrency.ts'
import { generateRandomPassword } from './generateRandomPassword.ts'

export const updateEnvFile = fn('updateEnvFile')(function* (basePath: string) {
  const [fs, path] = yield* all([FileSystem, Path])

  const envFilePath = path.join(basePath, 'docker', '.env')

  const { dbPass, envFile, examplesPass, supersetSecretKey } =
    yield* allWithInheritedConcurrencyByDefault({
      envFile: fs.readFileString(envFilePath, 'utf8'),
      dbPass: generateRandomPassword,
      examplesPass: generateRandomPassword,
      supersetSecretKey: generateRandomPassword,
    })

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
