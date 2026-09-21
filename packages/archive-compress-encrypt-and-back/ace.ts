#!/usr/bin/env bun

import * as BunChildProcessSpawner from '@effect/platform-bun/BunChildProcessSpawner'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunStdio from '@effect/platform-bun/BunStdio'
import * as BunTerminal from '@effect/platform-bun/BunTerminal'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Command from 'effect/unstable/cli/Command'

import pkg from './package.json' with { type: 'json' }
import { archiveCompressEncryptCommand } from './src/archiveCompressEncryptCommand.ts'
import { decryptDecompressExtractCommand } from './src/decryptDecompressExtractCommand.ts'

// TODO: make sure nounder/fs can properly simulate file permissions
// TODO: test with nounder/fs

// TODO: make arrows left and right trigger going into, and going out of the
// shell in wizard mode

// TODO: Also make it possible in wizard to enter path interactively in wizard mode,
// like in case I want to create a new file/folder, and not select existing one

// TODO: Fix bug in effect-cli that when I press enter at prompt
// The selected directory contains files. Would you like to traverse the selected directory? › (Y/n),
// it just jumps 2 lines above, instead of either confirming or staying

// TODO: fix padding on the left for multiline strings as descriptions

const appCommand = Command.withSubcommands(Command.make('ace'), [
  archiveCompressEncryptCommand,
  decryptDecompressExtractCommand,
]).pipe(
  Command.withDescription(`
    The GPG recipient email or key ID can be set using the GPG_RECIPIENT
    environment variable. For example:
    export GPG_RECIPIENT="recipient_email@example.com"
    ace do /path/to/source_dir /path/to/dest_file.tar.zst.gpg
  `),
  // TODO: add also Command.withShortDescription
)

const cli = Command.run(appCommand, { version: pkg.version })

export const AppLayer = BunChildProcessSpawner.layer.pipe(
  Layer.provideMerge(BunFileSystem.layer),
  Layer.provideMerge(BunPath.layer),
  Layer.merge(BunTerminal.layer),
  Layer.merge(BunStdio.layer),
)

// TODO: validate if errors are printed nicely
if (import.meta.main)
  pipe(
    cli,
    Effect.withSpan('cli', {
      attributes: {
        name: 'ace',
        version: pkg.version,
      },
    }),
    Effect.provide(AppLayer),
    BunRuntime.runMain(),
  )
