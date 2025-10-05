export async function passthroughSpawnIgnoreError(...cmd: string[]) {
  const proc = Bun.spawn({
    cmd,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });

  return await proc.exited;
}

export async function passthroughSpawn(...cmd: string[]) {
  const exitCode = await passthroughSpawnIgnoreError(...cmd);

  if (exitCode !== 0) throw new Error('process exited with code: ' + exitCode);
}

export async function passthroughSpawnInheritArgs(...cmd: string[]) {
  return await passthroughSpawn(...cmd, ...Bun.argv.slice(2));
}
