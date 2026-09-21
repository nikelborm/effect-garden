import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as Argument from 'effect/unstable/cli/Argument'
import * as CliError from 'effect/unstable/cli/CliError'
import * as Command from 'effect/unstable/cli/Command'
import * as Prompt from 'effect/unstable/cli/Prompt'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import { withResolvedToAbsolutePathArg } from './withResolvedToAbsolutePathArg.ts'

// TODO: add brands reflecting these are files/directories, they exist/dont,
// they are readable etc

const sourceFilePathArg = pipe(
  Argument.File('source file', { mustExist: true }),
  withResolvedToAbsolutePathArg,
  Argument.withDescription(
    'The source compressed encrypted archive file to unpack',
  ),
  Argument.mapEffect(
    Effect.fn('Source file arg remap')(function* (sourceFilePath) {
      yield* Effect.annotateCurrentSpan({ sourceFilePath })

      yield* FileSystem.FileSystem.use(fs =>
        fs.access(sourceFilePath, { readable: true }),
      )

      return sourceFilePath
    }, Effect.orDie),
  ),
)

const destDirPathArg = Argument.Directory('destination directory').pipe(
  withResolvedToAbsolutePathArg,
  Argument.withDescription(
    'The destination directory that will contain extracted files',
  ),
  Argument.mapEffect(
    Effect.fn('Destination directory arg remap')(function* (destDirPath) {
      yield* Effect.annotateCurrentSpan({ destDirPath })

      const fs = yield* FileSystem.FileSystem

      const exists = yield* fs.exists(destDirPath)
      if (!exists) return destDirPath

      const overwrite = yield* Prompt.Confirm({
        message: 'Destination path exists. Do you want to overwrite it?',
        initial: true,
      })

      // TODO: smarter mechanism to proceed if the dir is empty
      // TODO: smarter mechanism to merge new files with existing files

      if (!overwrite) {
        const message = `Path '${destDirPath}' should not exist`
        return yield* Effect.fail(
          new CliError.UserError({
            cause: new Error(message),
            userMessage: message,
          }),
        )
      }

      yield* fs.remove(destDirPath, { recursive: true })

      return destDirPath
    }, Effect.orDie),
  ),
)

export const decryptDecompressExtractCommand = Command.make(
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
    const aceUndoCommand = ChildProcess.pipeTo(
      ChildProcess.make`gpg --decrypt --output - ${sourceFilePath}`,
      ChildProcess.make`tar --zstd --extract --file - --directory ${destDirPath}`,
    )

    const exitCode = yield* ChildProcessSpawner.ChildProcessSpawner.use(
      spawner => spawner.exitCode(aceUndoCommand),
    )

    if (exitCode !== 0)
      return yield* Effect.die(new Error('failed to undo ace'))
  }),
).pipe(
  Command.withDescription(
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
