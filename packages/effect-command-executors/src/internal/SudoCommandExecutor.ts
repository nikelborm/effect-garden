/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Prompt from '@effect/cli/Prompt'
import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import type { PlatformError } from '@effect/platform/Error'
import type * as Terminal from '@effect/platform/Terminal'
import * as NodeStream from '@effect/platform-node-shared/NodeStream'
import * as Chunk from 'effect/Chunk'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Redacted from 'effect/Redacted'
import type * as Scope from 'effect/Scope'
import * as Stream from 'effect/Stream'

const PrivelegedCommandExecutor = Effect.gen(function* () {
  const baseExecutor = yield* CommandExecutor.CommandExecutor

  const passwordChunk = Chunk.of(
    new TextEncoder().encode(Redacted.value(yield* SudoPassword)),
  )

  return CommandExecutor.makeExecutor(
    (
      base: Command.Command,
    ): Effect.Effect<CommandExecutor.Process, PlatformError, Scope.Scope> =>
      Effect.gen(function* () {
        const patched = patchCommand(base, passwordChunk)

        return yield* baseExecutor.start(patched)
      }),
  )
})

const patchCommand = (
  base: Command.Command,
  passwordChunk: Chunk.NonEmptyChunk<Uint8Array<ArrayBuffer>>,
): Command.Command => {
  let patched = base

  if (base._tag === 'StandardCommand') {
    patched = Command.make(
      'sudo',
      '--prompt=',
      '--stdin',
      '--reset-timestamp',
      base.command,
      ...base.args,
    )

    // TODO: report issue with gid and uid. They are not used in command and always empty.
    // @ts-expect-error fuck readonly and PipedCommand
    patched.gid = base.gid
    // @ts-expect-error fuck readonly and PipedCommand
    patched.uid = base.uid
    // @ts-expect-error fuck readonly and PipedCommand
    patched.env = base.env
    // @ts-expect-error fuck readonly and PipedCommand
    patched.cwd = base.cwd
    // @ts-expect-error fuck readonly and PipedCommand
    patched.shell = base.shell
    // @ts-expect-error fuck readonly and PipedCommand
    patched.stderr = base.stderr
    // @ts-expect-error fuck readonly and PipedCommand
    patched.stdout = base.stdout

    const passwordStream = Stream.fromChunk(passwordChunk)

    // @ts-expect-error fuck readonly and PipedCommand
    patched.stdin =
      // TODO: research if it would conflict with process.stdin sink
      base.stdin === 'pipe'
        ? passwordStream
        : Stream.concat(
            passwordStream,
            base.stdin === 'inherit' ? NodeStream.stdin : base.stdin,
          )
  } else throw new Error('unsupported')

  return patched
}

// export const stdin: {
//   (stdin: Command.Command.Input): (self: Command.Command) => Command.Command
//   (self: Command.Command, stdin: Command.Command.Input): Command.Command
// } = dual<
//   (stdin: Command.Command.Input) => (self: Command.Command) => Command.Command,
//   (self: Command.Command, stdin: Command.Command.Input) => Command.Command
// >(2, (self, input) => {
//   switch (self._tag) {
//     case "StandardCommand": {
//       return makeStandard({ ...self, stdin: input })
//     }
//     // For piped commands it only makes sense to provide `stdin` for the
//     // left-most command as the rest will be piped in.
//     case "PipedCommand": {
//       return makePiped({ ...self, left: stdin(self.left, input) })
//     }
//   }
// })

// /** @internal */
// export const stdout: {
//   (stdout: Command.Command.Output): (self: Command.Command) => Command.Command
//   (self: Command.Command, stdout: Command.Command.Output): Command.Command
// } = dual<
//   (stdout: Command.Command.Output) => (self: Command.Command) => Command.Command,
//   (self: Command.Command, stdout: Command.Command.Output) => Command.Command
// >(2, (self, output) => {
//   switch (self._tag) {
//     case "StandardCommand": {
//       return makeStandard({ ...self, stdout: output })
//     }
//     // For piped commands it only makes sense to provide `stderr` for the
//     // right-most command as the rest will be piped in.
//     case "PipedCommand": {
//       return makePiped({ ...self, right: stdout(self.right, output) })
//     }
//   }
// })

class SudoPassword extends Context.Tag('SudoPassword')<
  SudoPassword,
  Redacted.Redacted<string>
>() {}

const SudoPasswordPrompted = Prompt.password({
  message: 'Enter your password for sudo calls: ',
  validate: value =>
    value.length === 0
      ? Effect.fail('Password cannot be empty')
      : Effect.succeed(value),
}).pipe(Prompt.run) as Effect.Effect<
  Redacted.Redacted<string>,
  Terminal.QuitException,
  // I overrode the need for FileSystem.FileSystem | Path.Path here
  Terminal.Terminal
>
