export function getEnvVarOrFail(name: string) {
  const envVar = process.env[name]

  if (!envVar) throw new Error(`env var ${name} is not defined`)

  return envVar
}
