const warningAboutGID = `
GID env var is not set. It's probably because you don't use \`mise\` or
improperly configured it. Mise should have run \`source
packages/scripts/setup_sh_vars.sh\` automatically and since it did't happen,
you'll have to either fix mise, or run the command yourself. Failure to set
GID env var may lead to problems with files that were created and written by
docker environment into mounted host fs. These files may have improper group
id set.
`

export function ensureGroupIdEnvVariableAvailable() {
  if (!('GID' in import.meta.env)) console.warn(warningAboutGID)
}
