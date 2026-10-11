#!/usr/bin/env bun
// if you have bun installed with mise, the above shebang might not always work

// I worked around it, by assigning the keyboard shortcut to a fixed path instead
// kitty --single-instance /home/nikel/.local/share/mise/installs/bun/latest/bin/bun /home/evadev/projects/effect-garden/one-offs/qcode/dist/minified/index.mjs

import * as BunChildProcessSpawner from '@effect/platform-bun/BunChildProcessSpawner'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunStdio from '@effect/platform-bun/BunStdio'
import * as BunTerminal from '@effect/platform-bun/BunTerminal'
import * as Context from 'effect/Context'
import * as CliArgument from 'effect/cli/Argument'
import * as CliCommand from 'effect/cli/Command'
import * as CliFlag from 'effect/cli/Flag'
import * as Deferred from 'effect/Deferred'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'

import { saveBinaryPathsCache } from './binary-cache.ts'
import { localMode, openers } from './local.ts'
import { runController } from './remote-controller.ts'
import { runProvider } from './remote-provider.ts'

// `Command.run` collapses every handler down to `Effect<void>`, discarding the
// numeric code each mode returns. We stash that code here so the teardown below
// can still read it out of the final `Exit` and pass it to `process.exit`.
// Action flags (`--help`, `--version`, ...) succeed without running any
// handler, leaving the Deferred empty — so the main effect polls it and falls
// back to 0 instead of awaiting it (await would hang forever on those paths).

class ExitCodeHandler extends Context.Service<ExitCodeHandler>()(
  'ExitCodeHandler',
  {
    make: Effect.gen(function* () {
      const def = yield* Deferred.make<ChildProcessSpawner.ExitCode>()

      return {
        codeFromEffect: <E, R>(
          self: Effect.Effect<ChildProcessSpawner.ExitCode, E, R>,
        ) =>
          self.pipe(
            Effect.flatMap(code => Deferred.into(Effect.succeed(code), def)),
            Effect.onInterrupt(() =>
              Deferred.succeed(def, ChildProcessSpawner.ExitCode(1)),
            ),
            Effect.asVoid,
          ),
        poll: Deferred.poll(def),
      }
    }),
  },
) {
  // Build the layer yourself from the make effect
  static readonly layer = Layer.effect(this, this.make)

  static readonly codeFromEffect = <E, R>(
    self: Effect.Effect<ChildProcessSpawner.ExitCode, E, R>,
  ) => this.use(s => s.codeFromEffect(self))
  static readonly poll = this.use(s => s.poll)
}

const remoteCommand = CliCommand.make(
  'remote',
  {
    host: CliArgument.String('host').pipe(
      CliArgument.withDescription(
        'SSH host (as in ~/.ssh/config, or user@hostname) to gather projects from',
      ),
    ),
  },
  ({ host }) => ExitCodeHandler.codeFromEffect(runController(host)),
).pipe(
  CliCommand.withDescription(
    'Controller side: run qcode on a remote host over a background multiplexed ssh connection',
  ),
)

const provideCommand = CliCommand.make('provide', {}, () =>
  ExitCodeHandler.codeFromEffect(runProvider),
).pipe(
  CliCommand.withDescription(
    'Provider side: executed on the remote host to serve project data (invoked automatically by the controller)',
  ),
)

const cacheBinaryPathsCommand = CliCommand.make('cache-binary-paths', {}, () =>
  ExitCodeHandler.codeFromEffect(
    Effect.as(saveBinaryPathsCache, ChildProcessSpawner.ExitCode(0)),
  ),
).pipe(
  CliCommand.withDescription(
    'Resolve every known binary via `which` and save the name-to-absolute-path map to ~/.cache/qcode/binary-paths.json, then exit. Run once from a terminal with full PATH so later kitty-shortcut launches with a partial PATH can still retry via the cache.',
  ),
)

const openerFlag = CliFlag.Literals('opener', openers).pipe(
  CliFlag.withDescription(
    'Where to open the selected project: in VS Code, in opencode, or in an interactive shell in the same terminal window',
  ),
  CliFlag.withDefault('vscode' as const),
)

export const cli = CliCommand.make(
  'qcode',
  { opener: openerFlag },
  ({ opener }) => ExitCodeHandler.codeFromEffect(localMode({ opener })),
).pipe(
  CliCommand.withDescription(
    'Fuzzy project opener for VS Code, opencode, or shell. With no subcommand, searches ~/projects on this machine.',
  ),
  CliCommand.withSubcommands([
    remoteCommand,
    provideCommand,
    cacheBinaryPathsCommand,
  ]),
)

const AppLayer = BunChildProcessSpawner.layer.pipe(
  Layer.provideMerge(BunPath.layer),
  Layer.provideMerge(BunTerminal.layer),
  Layer.provideMerge(BunStdio.layer),
  Layer.provideMerge(BunFileSystem.layer),
  Layer.provideMerge(ExitCodeHandler.layer),
)

if (import.meta.main)
  pipe(
    CliCommand.run(cli, { version: '4.0.0' }),
    // Empty poll means `Command.run` succeeded with no handler (`--help`,
    // `--version`, ...), which is a success — hence 0, not 1. Real failures
    // never reach here: they fail the effect and the teardown maps them to 1.
    Effect.andThen(ExitCodeHandler.poll),
    Effect.flatMap(Effect.transposeOption),
    Effect.map(Option.getOrElse(() => ChildProcessSpawner.ExitCode(0))),
    Effect.provide(AppLayer),
    BunRuntime.runMain({
      teardown: (exit, onExit) => {
        onExit(
          !Exit.isSuccess(exit) || typeof exit.value !== 'number'
            ? 1
            : exit.value,
        )
      },
    }),
  )
