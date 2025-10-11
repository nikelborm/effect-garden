import { devComposeExec } from './composeCommands.ts'
import { ensurePgDevIsHealthy } from './ensurePgDevIsHealthy.ts'
import { getDevEnvFromFile } from './getDevEnvFromFile.ts'

export async function executeSqlInDevPgContainer(
  getSql: (databaseName: string) => string,
) {
  await ensurePgDevIsHealthy()

  const env = await getDevEnvFromFile()

  const databaseName = env['DATABASE_NAME']

  const psqlProc = Bun.spawn(
    devComposeExec.concat(
      '-T',
      'postgres-dev',
      'psql',
      '-U',
      env['DATABASE_USERNAME'],
      databaseName,
    ),
    { stdin: 'pipe', stdout: 'ignore', stderr: 'inherit' },
  )

  psqlProc.stdin.write(getSql(databaseName))

  return {
    sendSql: (getSql: (databaseName: string) => string) => {
      psqlProc.stdin.write(getSql(databaseName))
    },
    closePsql: async () => {
      await psqlProc.stdin.end()

      const exitCode = await psqlProc.exited

      if (exitCode !== 0)
        throw new Error('docker exec command exited with code: ' + exitCode)
    },
  }
}
