/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Prompt from '@effect/cli/Prompt'
import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import { type PlatformError, SystemError } from '@effect/platform/Error'
import type * as Terminal from '@effect/platform/Terminal'
import * as NodeSink from '@effect/platform-node-shared/NodeSink'
import * as NodeStream from '@effect/platform-node-shared/NodeStream'
import * as Chunk from 'effect/Chunk'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'
import * as Redacted from 'effect/Redacted'
import type * as Scope from 'effect/Scope'
import type * as Sink from 'effect/Sink'
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

          if (!HashMap.size(base.env))
            patched = Command.env(
              patched,
              Object.fromEntries(HashMap.entries(base.env)),
            )

          if (Option.isSome(base.cwd))
            patched = Command.workingDirectory(patched, base.cwd.value)

          if (base.shell) patched = Command.runInShell(patched, base.shell)

          // TODO: report issue with gid and uid are not used in command and always empty.
          if (Option.isSome(base.gid))
            // @ts-expect-error because there's no helper method to set the property
            patched.gid = base.gid

          if (Option.isSome(base.uid))
            // @ts-expect-error because there's no helper method to set the property
            patched.uid = base.uid

          const passwordStream = Stream.fromChunk(passwordChunk)

          patched = Command.stdin(
            patched,
            base.stdin === 'pipe'
              ? passwordStream
              : Stream.concat(
                  passwordStream,
                  base.stdin === 'inherit' ? NodeStream.stdin : base.stdin,
                ),
          )

          if (base.stderr !== 'pipe')
            patched = Command.stderr(patched, base.stderr)

          if (base.stdout !== 'pipe')
            patched = Command.stdout(patched, base.stdout)
        }

        return yield* baseExecutor.start(patched)
      }),
  )
})

const patchCommand = (
  base: Command.Command,
  passwordChunk: Chunk.NonEmptyChunk<Uint8Array<ArrayBuffer>>,
) => {
  if (base._tag === 'StandardCommand') {
    let patched = Command.make(
      'sudo',
      '--prompt=',
      '--stdin',
      '--reset-timestamp',
      base.command,
      ...base.args,
    )
    patched = Command.make(
      'sudo',
      '--prompt=',
      '--stdin',
      '--reset-timestamp',
      base.command,
      ...base.args,
    )

    if (!HashMap.size(base.env))
      patched = Command.env(
        patched,
        Object.fromEntries(HashMap.entries(base.env)),
      )

    if (Option.isSome(base.cwd))
      patched = Command.workingDirectory(patched, base.cwd.value)

    if (base.shell) patched = Command.runInShell(patched, base.shell)

    // TODO: report issue with gid and uid are not used in command and always empty.
    if (Option.isSome(base.gid))
      // @ts-expect-error because there's no helper method to set the property
      patched.gid = base.gid

    if (Option.isSome(base.uid))
      // @ts-expect-error because there's no helper method to set the property
      patched.uid = base.uid

    const passwordStream = Stream.fromChunk(passwordChunk)

    patched = Command.stdin(
      patched,
      base.stdin === 'pipe'
        ? passwordStream
        : Stream.concat(
            passwordStream,
            base.stdin === 'inherit' ? NodeStream.stdin : base.stdin,
          ),
    )

    if (base.stderr !== 'pipe') patched = Command.stderr(patched, base.stderr)

    if (base.stdout !== 'pipe') patched = Command.stdout(patched, base.stdout)

    return patched
  }
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

class PrivelegedCommandExecutor2 extends Effect.Service<PrivelegedCommandExecutor>()(
  'PrivelegedCommandExecutor',
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const executor = yield* CommandExecutor.CommandExecutor

      const password = yield* ;

      const run = Effect.fn('PrivelegedCommandExecutor.run')(function* (
        ...args: string[]
      ) {
        const process = yield* pipe(
          Command.make(
            'sudo',
            '--prompt=',
            '--stdin',
            '--reset-timestamp',
            ...args,
          ),
          Command.feed(Redacted.value(password)),
          executor.start,
          Effect.scoped,
        )

        const [exitCode, accumulatedStdout, accumulatedStderr] =
          yield* Effect.all(
            [
              process.exitCode,
              process.stdout.pipe(
                stream => Stream.tapSink(stream, BunSink.stdout),
                Uint8ArrayStreamToString,
              ),
              process.stderr.pipe(
                //   stream => Stream.tapSink(stream, BunSink.stderr),
                Uint8ArrayStreamToString,
              ),
            ],
            { concurrency: 'unbounded' },
          )

        return { accumulatedStdout, accumulatedStderr }
      })

      return { run }
    }),
  },
) {
  static LiveBackedByFsCache = pipe(
    Effect.all({
      fs: FileSystem.FileSystem,
      cacheFileWriteSemaphore: Effect.makeSemaphore(1),
      defaultPrivelegedExecutor: this,
      scope: Effect.scope,
      cache: FileSystem.FileSystem.pipe(
        Effect.flatMap(fs => fs.readFileString(cacheFilePath)),
        Effect.map(str => Bun.JSONL.parse(str)),
        Effect.flatMap(decodeCacheEntries),
        Effect.map(entries => new Map(entries)),
        Effect.orElseSucceed(() => new Map<string, CacheValue>()),
      ),
    }),
    Effect.map(req => {
      const run = Effect.fn('PrivelegedCommandExecutorBackedByCache.run')(
        function* (...args: string[]) {
          const key = args.join()
          let value = req.cache.get(key)
          if (!value) {
            value = yield* req.defaultPrivelegedExecutor.run(...args)
            req.cache.set(key, value)
            const addition = JSON.stringify([key, value]) + '\n'
            yield* pipe(
              req.fs.writeFileString(cacheFilePath, addition, { flag: 'a' }),
              req.cacheFileWriteSemaphore.withPermits(1),
              Effect.forkIn(req.scope),
            )
          }
          // value is extracted, so that we can add common post-extraction logic here later
          return value
        },
      )
      return this.make({ run })
    }),
    Layer.scoped(this),
    Layer.provide(this.Default),
  )
}
