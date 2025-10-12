#!/usr/bin/env bun

import * as CliConfig from '@effect/cli/CliConfig'
import * as CliCommand from '@effect/cli/Command'
import * as HelpDocSpan from '@effect/cli/HelpDoc/Span'
import * as BunCommandExecutor from '@effect/platform-bun/BunCommandExecutor'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunTerminal from '@effect/platform-bun/BunTerminal'
import { prettyPrint } from 'effect-errors'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import pkg from './package.json' with { type: 'json' }
import { archiveCompressEncryptCommand } from './src/archiveCompressEncryptCommand.ts'
import { decryptDecompressExtractCommand } from './src/decryptDecompressExtractCommand.ts'

// TODO: make sure nounder/fs can properly simulate file permissions
// TODO: test with nounder/fs

// TODO: make arrows left and right trigger going into, and going out of the
// shell in wizard mode

// Also make it possible in wizard to enter path interactively in wizard mode,
// like in case I want to create a new file/folder, and not select existing one

// Fix bug in effect-cli that when I press enter at prompt
// The selected directory contains files. Would you like to traverse the selected directory? › (Y/n),
// it just jumps 2 lines above, instead of either confirming or staying

const appCommand = CliCommand.withSubcommands(CliCommand.make('ace'), [
  archiveCompressEncryptCommand,
  decryptDecompressExtractCommand,
])

const cli = CliCommand.run(appCommand, {
  name: 'ace',
  version: pkg.version,
  summary: HelpDocSpan.text(`
    The GPG recipient email or key ID can be set using the GPG_RECIPIENT
    environment variable. For example:
    export GPG_RECIPIENT="recipient_email@example.com"
    ace do /path/to/source_dir /path/to/dest_file.tar.zst.gpg
  `),
})

export const AppLayer = Layer.mergeAll(
  BunPath.layer,
  BunTerminal.layer,
  Layer.provideMerge(BunCommandExecutor.layer, BunFileSystem.layer),
  CliConfig.layer({ showTypes: false }),
)

if (import.meta.main)
  pipe(
    process.argv,
    cli,
    Effect.withSpan('cli', {
      attributes: {
        name: 'ace',
        version: pkg.version,
      },
    }),
    Effect.sandbox,
    Effect.catchAll(e => {
      console.error(prettyPrint(e))

      return Effect.fail(e)
    }),
    Effect.provide(AppLayer),
    BunRuntime.runMain({
      disableErrorReporting: true,
    }),
  )
