import * as Args from '@effect/cli/Args'
import * as CliCommand from '@effect/cli/Command'
import * as HelpDoc from '@effect/cli/HelpDoc'
import * as Prompt from '@effect/cli/Prompt'
import * as ValidationError from '@effect/cli/ValidationError'
import * as PlatformCommand from '@effect/platform/Command'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import { GPG_RECIPIENT } from './gpgRecipientConfig.ts'
import { withResolvedToAbsolutePathArg } from './withResolvedToAbsolutePathArg.ts'

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

export const decryptDecompressExtractCommand = CliCommand.make(
  'undo',
  { sourceFilePath: sourceFilePathArg, destDirPath: destDirPathArg },
  Effect.fn('decryptDecompressExtract handler')(function* ({
    destDirPath,
    sourceFilePath,
  }) {
    yield* Effect.annotateCurrentSpan({ destDirPath, sourceFilePath })

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
