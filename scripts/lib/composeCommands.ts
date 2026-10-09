import { simpleExec } from '@evadev/effect-helpers'

import type { NonEmptyArray } from 'effect/Array'
import * as Effect from 'effect/Effect'
import * as ChildProcess from 'effect/process/ChildProcess'

import {
  devComposeFilePath,
  devEnvFilePath,
  drizzleKitDockerizedConfig,
  prodComposeFilePath,
  prodEnvFilePath,
} from './paths.ts'

export const composeCMD = Effect.gen(function* () {
  // biome-ignore lint/complexity/useLiteralKeys: biome dum
  const USER = yield* Effect.sync(() => import.meta.env['USER'])

  if (!USER)
    return yield* Effect.die(new Error('Somehow USER env var is not defined'))

  const idResult = yield* simpleExec(ChildProcess.make('id', ['-nG', USER]))

  if (idResult.exitCode !== 0)
    return yield* Effect.fail(
      new Error(`Failed to get groups of user ${USER}: ${idResult.stderr}`),
    )

  const groupsOfUser = idResult.stdout.trim().split(' ').filter(Boolean)

  const base: string[] = []

  if (!groupsOfUser.includes('docker'))
    if (groupsOfUser.includes('sudo')) base.push('sudo')
    else
      return yield* Effect.fail(
        new Error(
          "I have no idea how am I supposed to run docker command if I'm neither in docker group nor in sudo group",
        ),
      )

  const isComposeAvailableAsSubcommandOfDocker =
    (yield* simpleExec(ChildProcess.make('docker', ['compose']))).exitCode === 0

  if (isComposeAvailableAsSubcommandOfDocker)
    return [...base, 'docker', 'compose'] as unknown as NonEmptyArray<string>

  const hasDockerCompose =
    (yield* simpleExec(ChildProcess.make('which', ['docker-compose'])))
      .exitCode === 0

  if (hasDockerCompose)
    return [...base, 'docker-compose'] as unknown as NonEmptyArray<string>

  const hasCompose =
    (yield* simpleExec(ChildProcess.make('which', ['compose']))).exitCode === 0

  if (hasCompose)
    return [...base, 'compose'] as unknown as NonEmptyArray<string>

  return yield* Effect.fail(new Error('Docker compose not found'))
}).pipe(Effect.withSpan('composeCMD'))

export const concat = <E, R>(
  base: Effect.Effect<NonEmptyArray<string>, E, R>,
  ...suffix: NonEmptyArray<string>
): Effect.Effect<NonEmptyArray<string>, E, R> =>
  Effect.map(base, cmd => cmd.concat(...suffix) as NonEmptyArray<string>)

export const devCompose = concat(
  composeCMD,
  '-f',
  devComposeFilePath,
  '--env-file',
  devEnvFilePath,
)

export const devComposeStart = concat(devCompose, 'start')

export const devComposeUp = concat(devCompose, 'up')

export const devComposeDown = concat(devCompose, 'down')

export const devComposePs = concat(devCompose, 'ps')

export const devComposeExec = concat(devCompose, 'exec')

export const devComposeExecInScriptContainer = concat(
  devComposeExec,
  'ts-dev-script-runner',
)

export const execDockerizedBunCommand = concat(
  devComposeExecInScriptContainer,
  'bun',
  '--bun',
)

export const devComposeExecAsRootInScriptContainer = concat(
  devComposeExec,
  '-u',
  'root',
  'ts-dev-script-runner',
)

export const execDrizzleKitInDevScriptContainer = concat(
  execDockerizedBunCommand,
  'drizzle-kit',
)

export const drizzleKitMigrateDev = concat(
  execDrizzleKitInDevScriptContainer,
  'migrate',
  '--config',
  drizzleKitDockerizedConfig,
)

export const drizzleKitGenerateMigrationDev = concat(
  execDrizzleKitInDevScriptContainer,
  'generate',
  '--config',
  drizzleKitDockerizedConfig,
)

export const devComposeUpDetached = concat(devComposeUp, '-d')

export const prodCompose = concat(
  composeCMD,
  '-f',
  prodComposeFilePath,
  '--env-file',
  prodEnvFilePath,
)
