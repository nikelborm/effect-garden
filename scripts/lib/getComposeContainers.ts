import * as Result from 'effect/Result'
import * as Schema from 'effect/Schema'
import * as SchemaGetter from 'effect/SchemaGetter'

import { devComposePs } from './composeCommands.ts'

const ContainerSchema = Schema.Struct({
  Service: Schema.NonEmptyString,
  State: Schema.Literals([
    'paused',
    'restarting',
    'removing',
    'running',
    'dead',
    'created',
    'exited',
  ]),
})

// TODO: refactor to SchemaGetter.split?
const LinesSchema = Schema.Trim.pipe(
  Schema.decodeTo(Schema.Array(Schema.String), {
    decode: SchemaGetter.transform((s: string) =>
      s === '' ? [] : s.split('\n'),
    ),
    encode: SchemaGetter.transform((lines: ReadonlyArray<string>) =>
      lines.join('\n'),
    ),
  }),
)

const PsCommandOutputSchema = LinesSchema.pipe(
  Schema.decodeTo(Schema.Array(Schema.fromJsonString(ContainerSchema))),
  Schema.revealCodec,
)

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
      cause: containersResult.failure,
    })

  return containersResult.success
}
