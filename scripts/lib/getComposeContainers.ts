import { simpleExec } from '@evadev/effect-helpers'

import * as Effect from 'effect/Effect'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as Schema from 'effect/Schema'
import * as SchemaGetter from 'effect/SchemaGetter'

import { concat, devComposePs } from './composeCommands.ts'

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

const decodePsCommandOutput = Schema.decodeEffect(PsCommandOutputSchema)

export const getDevComposeContainers = Effect.gen(function* () {
  const cmd = yield* concat(devComposePs, '--format', 'json', '-a')
  const [head, ...rest] = cmd

  const result = yield* simpleExec(ChildProcess.make(head, rest))

  if (result.exitCode !== 0)
    return yield* Effect.fail(
      new Error(`Failed to run \`${cmd.join(' ')}\` command`),
    )

  return yield* decodePsCommandOutput(result.stdout)
}).pipe(Effect.withSpan('getDevComposeContainers'))
