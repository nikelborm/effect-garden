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

const GPG_RECIPIENT = Config.nonEmptyString('GPG_RECIPIENT').pipe(
  Config.withDescription(
    `Change to the desired recipient email or key ID or override it during invocation`,
  ),
  Config.withDefault('kolya007.klass@gmail.com'),
)

const archiveCompressEncryptCommand = CliCommand.make(
  'do',
  {
    sourceDirPath: pipe(
      Args.directory({ name: 'source directory', exists: 'yes' }),
      Args.withDescription('The source directory to be archived'),
      Args.mapEffect(
        Effect.fn('Source dir arg remap')(function* (sourceDirPath) {
          yield* Effect.annotateCurrentSpan({ sourceDirPath })

          yield* Effect.flatMap(FileSystem.FileSystem, fs =>
            fs.access(sourceDirPath, { readable: true }),
          )

          return sourceDirPath
        }, Effect.orDie),
      ),
    ),
    destFilePath: Args.path({ name: 'destination file' }).pipe(
      Args.withDescription(
        'Destination of the new compressed encrypted archive file',
      ),
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
    ),
  },
  Effect.fn('archiveCompressEncrypt handler')(function* ({
    destFilePath,
    sourceDirPath,
  }) {
    yield* Effect.annotateCurrentSpan({ destFilePath, sourceDirPath })
    yield* Console.log({ destFilePath, sourceDirPath })
    const path = yield* Path.Path
    const fs = yield* FileSystem.FileSystem
    // yield* fs.makeDirectory(path.dirname(destFilePath), { recursive: true })
    // `zstd -` replaced by `--zstd` flag
    const aceDoCommand = PlatformCommand.pipeTo(
      PlatformCommand.make(
        'tar',
        '--create',
        '--zstd',
        '--file',
        '-', // will print to stdout
        '--directory',
        sourceDirPath,
        '.', // all files will not be put into nested directory inside archive
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
  }),
).pipe(
  CliCommand.withDescription(
    `Creates a tar archive, compress with zstd, and encrypt with gpg.
Script does not check if the destination file exists, so it is recommended
that you manually delete the old archive before creating a new one.
Script does not add any extensions, so it is recommended
that you manually add .tar.zst.gpg to the archive file.

Example:
Put all files and dirs which are inside ~/.local/share/TelegramDesktop directory
into encrypted compressed archive ~/tg.tar.zst.gpg:
./main.sh do_tar_zstd_gpg ~/.local/share/TelegramDesktop ~/tg.tar.zst.gpg`,
  ),
)

const decryptDecompressExtractCommand = CliCommand.make(
  'undo',
  {
    sourceFilePath: Args.file({ name: 'source file', exists: 'yes' }).pipe(
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
    ),
    destDirPath: Args.directory({ name: 'destination directory' }).pipe(
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
    ),
  },
  Effect.fn('decryptDecompressExtract handler')(function* ({
    destDirPath,
    sourceFilePath,
  }) {
    yield* Effect.annotateCurrentSpan({ destDirPath, sourceFilePath })
    yield* Console.log({ destDirPath, sourceFilePath })
    const fs = yield* FileSystem.FileSystem
    // yield* fs.makeDirectory(destDirPath, { recursive: true })
    // `zstd --decompress` replaced by `--zstd` flag
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
  ace do /path/to/source_dir /path/to/dest_file.tar.zst.gpg`),
})

const AppLayer = Layer.mergeAll(
  BunFileSystem.layer,
  BunPath.layer,
  BunTerminal.layer,
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
