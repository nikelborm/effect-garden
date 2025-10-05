import { devComposeExec } from './composeCommands.ts';
import { ensureDevComposeServiceIsRunning } from './ensureDevComposeServiceIsRunning.ts';
import { getDevEnvFromFile } from './getDevEnvFromFile.ts';

const pgService = 'postgres-dev';

const env = await getDevEnvFromFile();

export async function isPgDevHealthy() {
  const pgIsReadyProc = Bun.spawn(
    devComposeExec.concat(
      '-T',
      pgService,
      'pg_isready',
      '-t',
      '5',
      '-p',
      env['DATABASE_PORT'].toString(),
      '-U',
      env['DATABASE_USERNAME'],
      '-d',
      env['DATABASE_NAME'],
    ),
  );

  const exitCode = await pgIsReadyProc.exited;

  return exitCode === 0;
}

export async function ensurePgDevIsHealthy() {
  await ensureDevComposeServiceIsRunning(pgService);

  const timeoutMs = 15000;

  const signal = AbortSignal.timeout(timeoutMs);

  let isHealthy = await isPgDevHealthy();

  // @ts-ignore
  while (!signal.aborted && !isHealthy) {
    await Bun.sleep(200);
    isHealthy = await isPgDevHealthy();
  }

  if (!isHealthy)
    throw new Error(
      `Timed-out waiting for healthy state after ${timeoutMs / 1000} seconds`,
    );
}
