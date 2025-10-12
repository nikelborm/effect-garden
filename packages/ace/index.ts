#!/usr/bin/env bun

import * as Args from '@effect/cli/Args'
import * as CliConfig from '@effect/cli/CliConfig'
import * as CliCommand from '@effect/cli/Command'
import * as HelpDocSpan from '@effect/cli/HelpDoc/Span'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunTerminal from '@effect/platform-bun/BunTerminal'
import * as PlatformCommand from '@effect/platform/Command'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import { prettyPrint } from 'effect-errors'
import * as Config from 'effect/Config'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import pkg from './package.json' with { type: 'json' }
import * as HelpDoc from '@effect/cli/HelpDoc'
import * as Prompt from '@effect/cli/Prompt'
import * as ValidationError from '@effect/cli/ValidationError'
import * as BunCommandExecutor from '@effect/platform-bun/BunCommandExecutor'

const GPG_RECIPIENT = Config.nonEmptyString('GPG_RECIPIENT').pipe(
  Config.withDescription(
    `Change to the desired recipient email or key ID or override it during invocation`,
  ),
  Config.withDefault('kolya007.klass@gmail.com'),
)

// TODO: make sure nounder/fs can properly simulate file permissions
// TODO: test with nounder/fs

const withResolvedToAbsolutePathArg = (self: Args.Args<string>) =>
  Args.mapEffect(self, relativePath =>
    Effect.map(Path.Path, path => path.resolve(relativePath)),
  )

const sourceDirPathArg = pipe(
  Args.directory({ name: 'source directory', exists: 'yes' }),
  Args.withDescription('The source directory to be archived'),
  withResolvedToAbsolutePathArg,
  Args.mapEffect(
    Effect.fn('Source dir arg remap')(function* (sourceDirPath) {
      yield* Effect.annotateCurrentSpan({ sourceDirPath })

      yield* Effect.flatMap(FileSystem.FileSystem, fs =>
        fs.access(sourceDirPath, { readable: true }),
      )

      return sourceDirPath
    }, Effect.orDie),
  ),
)

const destFilePathArg = Args.path({ name: 'destination file' }).pipe(
  Args.withDescription(
    'Destination of the new compressed encrypted archive file',
  ),
  withResolvedToAbsolutePathArg,
  Args.mapEffect(
    Effect.fn('Destination file arg remap')(function* (destFilePath) {
      yield* Effect.annotateCurrentSpan({ destFilePath })

      const fs = yield* FileSystem.FileSystem

      const exists = yield* fs.exists(destFilePath)
      if (!exists) return destFilePath

      const overwrite = yield* Prompt.confirm({
        message: 'Destination path exists. Do you want to overwrite it?',
        initial: true,
      })

      if (!overwrite)
        return yield* Effect.fail(
          ValidationError.invalidArgument(
            HelpDoc.p(`Path '${destFilePath}' should not exist`),
          ),
        )

      yield* fs.remove(destFilePath, { recursive: true })

      return destFilePath
    }, Effect.orDie),
  ),
)

const archiveCompressEncryptCommand = CliCommand.make(
  'do',
  { sourceDirPath: sourceDirPathArg, destFilePath: destFilePathArg },
  Effect.fn('archiveCompressEncrypt handler')(function* ({
    destFilePath,
    sourceDirPath,
  }) {
    yield* Effect.annotateCurrentSpan({ destFilePath, sourceDirPath })
    yield* Console.log({ destFilePath, sourceDirPath })

    const path = yield* Path.Path
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory(path.dirname(destFilePath), { recursive: true })

    // NOTE: `zstd -` replaced by tar's `--zstd` flag
    const aceDoCommand = PlatformCommand.pipeTo(
      PlatformCommand.make(
        'tar',
        '--create',
        '--zstd',
        '--file',
        '-', // will print to stdout
        '--directory',
        sourceDirPath,
        // '.' means all children of source directory will be put directly into
        // the root of the archive, instead of into a nested directory
        '.',
      ),
      PlatformCommand.make(
        'gpg',
        '--encrypt',
        '--recipient',
        yield* GPG_RECIPIENT,
        '--output',
        destFilePath,
        '-', // read from stdin
      ),
    )

    const exitCode = yield* PlatformCommand.exitCode(aceDoCommand)

    if (exitCode !== 0) return yield* Effect.dieMessage('failed to ace')
  }),
).pipe(
  CliCommand.withDescription(
    `
      Creates a tar archive, compress with zstd, and encrypt with gpg.
      Script does not check if the destination file exists, so it is recommended
      that you manually delete the old archive before creating a new one.
      Script does not add any extensions, so it is recommended
      that you manually add .tar.zst.gpg to the archive file.

      Example:
      Put all files and dirs which are inside ~/.local/share/TelegramDesktop directory
      into encrypted compressed archive ~/tg.tar.zst.gpg:
      ace do ~/.local/share/TelegramDesktop ~/tg.tar.zst.gpg
    `,
  ),
)

const sourceFilePathArg = pipe(
  Args.file({ name: 'source file', exists: 'yes' }),
  withResolvedToAbsolutePathArg,
  Args.withDescription(
    'The source compressed encrypted archive file to unpack',
  ),
  Args.mapEffect(
    Effect.fn('Source file arg remap')(function* (sourceFilePath) {
      yield* Effect.annotateCurrentSpan({ sourceFilePath })

      yield* Effect.flatMap(FileSystem.FileSystem, fs =>
        fs.access(sourceFilePath, { readable: true }),
      )

      return sourceFilePath
    }, Effect.orDie),
  ),
)

const destDirPathArg = Args.directory({ name: 'destination directory' }).pipe(
  withResolvedToAbsolutePathArg,
  Args.withDescription(
    'The destination directory that will contain extracted files',
  ),
  Args.mapEffect(
    Effect.fn('Destination directory arg remap')(function* (destDirPath) {
      yield* Effect.annotateCurrentSpan({ destDirPath })

      const fs = yield* FileSystem.FileSystem

      const exists = yield* fs.exists(destDirPath)
      if (!exists) return destDirPath

      const overwrite = yield* Prompt.confirm({
        message: 'Destination path exists. Do you want to overwrite it?',
        initial: true,
      })

      // TODO: smarter mechanism to proceed if the dir is empty
      // TODO: smarter mechanism to merge new files with existing files

      if (!overwrite)
        return yield* Effect.fail(
          ValidationError.invalidArgument(
            HelpDoc.p(`Path '${destDirPath}' should not exist`),
          ),
        )

      yield* fs.remove(destDirPath, { recursive: true })

      return destDirPath
    }, Effect.orDie),
  ),
)

const decryptDecompressExtractCommand = CliCommand.make(
  'undo',
  { sourceFilePath: sourceFilePathArg, destDirPath: destDirPathArg },
  Effect.fn('decryptDecompressExtract handler')(function* ({
    destDirPath,
    sourceFilePath,
  }) {
    yield* Effect.annotateCurrentSpan({ destDirPath, sourceFilePath })
    yield* Console.log({ destDirPath, sourceFilePath })

    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory(destDirPath, { recursive: true })

    // NOTE: `zstd --decompress` replaced by tar's `--zstd` flag
    const aceUndoCommand = PlatformCommand.pipeTo(
      PlatformCommand.make(
        'gpg',
        '--decrypt',
        '--recipient',
        yield* GPG_RECIPIENT,
        '--output',
        '-',
        sourceFilePath,
      ),
      PlatformCommand.make(
        'tar',
        '--zstd',
        '--extract',
        '--file',
        '-',
        '--directory',
        destDirPath,
      ),
    )

    const exitCode = yield* PlatformCommand.exitCode(aceUndoCommand)

    if (exitCode !== 0) return yield* Effect.dieMessage('failed to undo ace')
  }),
).pipe(
  CliCommand.withDescription(
    `
      Decrypt, decompress, and extract files from an encrypted compressed archive.
      Script does not handle conflicts when extracting files, so it is recommended
      that you manually delete the content of destination directory before extracting.

      Example:
      Put all files and dirs which are inside encrypted compressed archive
      ~/tg.tar.zst.gpg into directory ~/.local/share/TelegramDesktop:
      rm -rf ~/.local/share/TelegramDesktop;
      ace undo ~/tg.tar.zst.gpg ~/.local/share/TelegramDesktop
    `,
  ),
)

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

const AppLayer = Layer.mergeAll(
  BunPath.layer,
  BunTerminal.layer,
  Layer.provideMerge(BunCommandExecutor.layer, BunFileSystem.layer),
  CliConfig.layer({ showTypes: false }),
)

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
