import * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'

import { devComposePs } from './composeCommands.ts'

const PsCommandOutputSchema = Schema.compose(
  Schema.compose(Schema.Trim, Schema.split('\n')),
  Schema.parseJson(
    Schema.Struct({
      Service: Schema.NonEmptyString,
      State: Schema.Literal(
        'paused',
        'restarting',
        'removing',
        'running',
        'dead',
        'created',
        'exited',
      ),
    }),
  ).pipe(Schema.Array),
).pipe(Schema.asSchema)

const decodePsCommandOutput = Schema.decodeResult(PsCommandOutputSchema)

export async function getDevComposeContainers() {
  const cmd = devComposePs.concat('--format', 'json', '-a')

  const proc = Bun.spawn({ cmd, stdin: 'ignore' })

  const [exitCode, stdoutText] = await Promise.all([
    proc.exited,
    proc.stdout.text(),
  ])

  const processFinishedSuccessfully = exitCode === 0

  if (!processFinishedSuccessfully)
    throw new Error(`Failed to run \`${cmd}\` command`)

  const containersResult = decodePsCommandOutput(stdoutText)

  if (Result.isFailure(containersResult))
    throw new Error(`Failed to parse \`${cmd}\` command output`, {
      cause: containersResult.fail,
    })

  return containersResult.succeed
}
