import { join, relative } from 'node:path'

export const scriptsPackageDirPath = join(import.meta.dirname, '..')
export const packagesDirPath = join(scriptsPackageDirPath, '..')
export const projectRootAbsolutePath = join(packagesDirPath, '..')

export const makeRelativeAgainstProjectRoot = (path: string) =>
  relative(projectRootAbsolutePath, path)

export const rootPackageJsonPath = join(projectRootAbsolutePath, 'package.json')

export const dockerizePath = (path: string) =>
  join('/app', makeRelativeAgainstProjectRoot(path))

export const drizzleKitDockerizedConfig = dockerizePath(
  join(scriptsPackageDirPath, 'drizzle.docker.config.ts'),
)

export const projectTurboDirPath = join(projectRootAbsolutePath, '.turbo')

export const projectTurboCacheDirPath = join(projectTurboDirPath, 'cache')

export const envDirAbsolutePath = join(projectRootAbsolutePath, 'env')

export const devEnvFilePath = join(envDirAbsolutePath, 'dev.env')

export const devEnvTemplateFilePath = join(
  envDirAbsolutePath,
  'dev.template.env',
)

export const prodEnvFilePath = join(envDirAbsolutePath, 'prod.env')

export const prodEnvTemplateFilePath = join(
  envDirAbsolutePath,
  'prod.template.env',
)

export const devComposeFilePath = join(
  projectRootAbsolutePath,
  'dev.compose.yaml',
)

export const prodComposeFilePath = join(projectRootAbsolutePath, 'compose.yaml')

export const databasePackageDirPath = join(packagesDirPath, 'database')

export const migrationsDirPath = join(databasePackageDirPath, 'migrations')

export const migrationsMetaDirPath = join(migrationsDirPath, 'meta')
