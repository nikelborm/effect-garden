/** biome-ignore-all lint/style/useShorthandFunctionType: It's a nice way to
 * preserve JSDoc comments attached to the function signature */

import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { dual } from 'effect/Function'
import * as Layer from 'effect/Layer'
import type { PlatformError } from 'effect/PlatformError'
import * as Redacted from 'effect/Redacted'
import type * as Scope from 'effect/Scope'
import * as Stdio from 'effect/Stdio'
import * as Stream from 'effect/Stream'
import type * as Terminal from 'effect/Terminal'
import * as Prompt from 'effect/unstable/cli/Prompt'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

/**
 * Password for `sudo --stdin` calls.
 *
 * Provide it via `Layer.succeed(SudoPassword, Redacted.make('...'))` or via
 * {@link SudoPasswordPrompted}.
 */
export class SudoPassword extends Context.Service<
  SudoPassword,
  Redacted.Redacted<string>
>()('SudoPassword') {}

/**
 * Prompt the user for their sudo password on the terminal.
 *
 * Fails with {@link Terminal.QuitError} when the prompt is quit.
 */
export const SudoPasswordPrompted = Prompt.Password({
  message: 'Enter your password for sudo calls: ',
  validate: value =>
    value.length === 0
      ? Effect.fail('Password cannot be empty')
      : Effect.succeed(value),
}).pipe(Prompt.run) as Effect.Effect<
  Redacted.Redacted<string>,
  Terminal.QuitError,
  // The underlying Prompt.run also needs FileSystem.FileSystem | Path.Path,
  // but callers of this package are expected to already provide a terminal
  //-capable environment; keep the historical narrower requirement.
  Terminal.Terminal
>

const encodePassword = (password: Redacted.Redacted<string>): Uint8Array =>
  new TextEncoder().encode(Redacted.value(password))

const toCommandInput = (
  stdin: ChildProcess.CommandOptions['stdin'],
): ChildProcess.CommandInput | undefined => {
  if (stdin === undefined) return undefined
  if (typeof stdin === 'string') return stdin
  if (Stream.isStream(stdin)) return stdin
  return stdin.stream
}

const withStdinStream = (
  original: ChildProcess.CommandOptions['stdin'],
  stream: Stream.Stream<Uint8Array, PlatformError>,
): ChildProcess.CommandOptions['stdin'] => {
  if (
    original !== null &&
    typeof original === 'object' &&
    !Stream.isStream(original) &&
    'stream' in original
  ) {
    return { ...original, stream }
  }
  return stream
}

/**
 * Prepend `sudo --prompt= --stdin --reset-timestamp` to a command and feed the
 * password through its stdin.
 *
 * v3 -> v4 notes:
 * - v3 `Command.make('sudo', ...args)` became
 *   `ChildProcess.make('sudo', [...args], options)`; all process settings
 *   (cwd, env, shell, stdout, stderr, ...) moved from top-level readonly
 *   fields into a single `options: CommandOptions` object, so they are now
 *   preserved with `{ ...base.options, stdin }` instead of one
 *   `@ts-expect-error` assignment per field.
 * - v3 `uid` / `gid` no longer exist in v4 `CommandOptions` nor in the Node
 *   spawn options (`buildSpawnOptions` only forwards cwd/env/shell/detached/
 *   windowsHide), so they are intentionally dropped.
 * - v3 `Stream.fromChunk(chunk)` became `Stream.succeed(value)` (migration
 *   `Stream.fromChunk -> Stream.fromArray`; `Chunk.of` itself is unchanged).
 * - v3 `NodeStream.stdin` was removed; the parent stdin bytes now come from
 *   the portable `Stdio` service (`Stdio.Stdio.stdin`, provided on Node via
 *   `NodeStdio.layer`) and are passed in as `parentStdin`.
 * - `PipedCommand` was previously `throw new Error('unsupported')`; it is now
 *   supported by patching the left-most command and re-wiring the pipe, same
 *   as `ChildProcess.prefix` does.
 */
export const withSudo: {
  (
    password: Redacted.Redacted<string>,
    parentStdin?: Stream.Stream<Uint8Array, PlatformError> | undefined,
  ): (self: ChildProcess.Command) => ChildProcess.Command
  (
    self: ChildProcess.Command,
    password: Redacted.Redacted<string>,
    parentStdin?: Stream.Stream<Uint8Array, PlatformError> | undefined,
  ): ChildProcess.Command
} = dual(
  args => ChildProcess.isCommand(args[0]),
  (
    self: ChildProcess.Command,
    password: Redacted.Redacted<string>,
    parentStdin?: Stream.Stream<Uint8Array, PlatformError> | undefined,
  ): ChildProcess.Command => {
    const passwordStream = Stream.succeed(encodePassword(password))

    if (ChildProcess.isPipedCommand(self)) {
      return ChildProcess.pipeTo(
        withSudo(self.left, password, parentStdin),
        self.right,
        self.options,
      )
    }

    const baseOptions = self.options
    const input = toCommandInput(baseOptions.stdin)

    let stdin: ChildProcess.CommandOptions['stdin']
    if (input === undefined || input === 'pipe') {
      stdin = withStdinStream(baseOptions.stdin, passwordStream)
    } else if (input === 'inherit') {
      stdin = withStdinStream(
        baseOptions.stdin,
        parentStdin
          ? Stream.concat(passwordStream, parentStdin)
          : passwordStream,
      )
    } else if (typeof input === 'string') {
      // 'ignore' | 'overlapped': nothing meaningful to prepend after the
      // password, so the password alone becomes stdin.
      stdin = withStdinStream(baseOptions.stdin, passwordStream)
    } else {
      stdin = withStdinStream(
        baseOptions.stdin,
        Stream.concat(passwordStream, input),
      )
    }

    return ChildProcess.make(
      'sudo',
      ['--prompt=', '--stdin', '--reset-timestamp', self.command, ...self.args],
      { ...baseOptions, stdin },
    )
  },
)

/**
 * Decorating {@link ChildProcessSpawner.ChildProcessSpawner} layer that runs
 * every spawned command through {@link withSudo}.
 *
 * v3 -> v4 notes:
 * - v3 `CommandExecutor.makeExecutor(start)` became
 *   `ChildProcessSpawner.make(spawn)` (migration
 *   `CommandExecutor.makeExecutor -> ChildProcessSpawner.make`), and
 *   `baseExecutor.start(patched)` became `base.spawn(patched)` (migration
 *   `Command.start -> ChildProcessSpawner.spawn`).
 * - v3 `Layer.scoped(tag)` was merged into `Layer.effect(tag)` (migration
 *   `Layer.scoped -> Layer.effect`).
 *
 * Provide the base spawner (e.g. `NodeChildProcessSpawner.layer`), a
 * `SudoPassword`, and `Stdio` (e.g. `NodeStdio.layer`):
 *
 * ```ts
 * import { NodeChildProcessSpawner } from '@effect/platform-node'
 * import { NodeStdio } from '@effect/platform-node-shared'
 *
 * layer.pipe(Layer.provide(NodeChildProcessSpawner.layer), Layer.provide(NodeStdio.layer))
 * ```
 */
export const layer = Layer.effect(ChildProcessSpawner.ChildProcessSpawner)(
  Effect.gen(function* () {
    const base = yield* ChildProcessSpawner.ChildProcessSpawner
    const password = yield* SudoPassword
    const stdio = yield* Stdio.Stdio

    const spawn = (
      command: ChildProcess.Command,
    ): Effect.Effect<
      ChildProcessSpawner.ChildProcessHandle,
      PlatformError,
      Scope.Scope
    > => base.spawn(withSudo(command, password, stdio.stdin))

    return ChildProcessSpawner.make(spawn)
  }),
)
