import { $, which } from 'bun'
import {
  devComposeFilePath,
  devEnvFilePath,
  drizzleKitDockerizedConfig,
  prodComposeFilePath,
  prodEnvFilePath,
} from './paths.ts'

const isBinaryFoundInSystem = (binaryName: string) => which(binaryName) !== null

const USER = import.meta.env['USER']

if (!USER) throw new Error('Somehow USER env var is not defined')

const groupsOfUser = (await $`id -nG ${USER}`.quiet()).text().trim().split(' ')

export const composeCMD: string[] = []

if (!groupsOfUser.includes('docker')) {
  if (groupsOfUser.includes('sudo')) composeCMD.push('sudo')
  else
    throw new Error(
      "I have no idea how am I supposed to run docker command if I'm neither in docker group nor in sudo group",
    )
}

const isComposeAvailableAsSubcommandOfDocker =
  (await $`docker compose`.nothrow().quiet()).exitCode === 0

if (isComposeAvailableAsSubcommandOfDocker) composeCMD.push('docker', 'compose')
else if (isBinaryFoundInSystem('docker-compose'))
  composeCMD.push('docker-compose')
else if (isBinaryFoundInSystem('compose')) composeCMD.push('compose')
else throw new Error('Docker compose not found')

export const devCompose = composeCMD.concat(
  '-f',
  devComposeFilePath,
  '--env-file',
  devEnvFilePath,
)

export const devComposeStart = devCompose.concat('start')

export const devComposeUp = devCompose.concat('up')

export const devComposeDown = devCompose.concat('down')

export const devComposePs = devCompose.concat('ps')

export const devComposeExec = devCompose.concat('exec')

export const devComposeExecInScriptContainer = devComposeExec.concat(
  'ts-dev-script-runner',
)

export const execDockerizedBunCommand = devComposeExecInScriptContainer.concat(
  'bun',
  '--bun',
)

export const devComposeExecAsRootInScriptContainer = devComposeExec.concat(
  '-u',
  'root',
  'ts-dev-script-runner',
)

export const execDrizzleKitInDevScriptContainer =
  execDockerizedBunCommand.concat('drizzle-kit')

export const drizzleKitMigrateDev = execDrizzleKitInDevScriptContainer.concat(
  'migrate',
  '--config',
  drizzleKitDockerizedConfig,
)

export const drizzleKitGenerateMigrationDev =
  execDrizzleKitInDevScriptContainer.concat(
    'generate',
    '--config',
    drizzleKitDockerizedConfig,
  )

export const devComposeUpDetached = devComposeUp.concat('-d')

export const prodCompose = composeCMD.concat(
  '-f',
  prodComposeFilePath,
  '--env-file',
  prodEnvFilePath,
)
