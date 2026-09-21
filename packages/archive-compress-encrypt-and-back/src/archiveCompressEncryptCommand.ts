import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as Path from 'effect/Path'
import * as Argument from 'effect/unstable/cli/Argument'
import * as CliError from 'effect/unstable/cli/CliError'
import * as Command from 'effect/unstable/cli/Command'
import * as Prompt from 'effect/unstable/cli/Prompt'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import { GPG_RECIPIENT } from './gpgRecipientConfig.ts'
import { withResolvedToAbsolutePathArg } from './withResolvedToAbsolutePathArg.ts'

const sourceDirPathArg = pipe(
  Argument.Directory('source directory', { mustExist: true }),
  withResolvedToAbsolutePathArg,
  Argument.withDescription('The source directory to be archived'),
  Argument.mapEffect(
    Effect.fn('Source dir arg remap')(function* (sourceDirPath) {
      yield* Effect.annotateCurrentSpan({ sourceDirPath })

      yield* FileSystem.FileSystem.use(fs =>
        fs.access(sourceDirPath, { readable: true }),
      )

      return sourceDirPath
    }, Effect.orDie),
  ),
)

const destFilePathArg = Argument.Path('destination file').pipe(
  withResolvedToAbsolutePathArg,
  Argument.withDescription(
    'Destination of the new compressed encrypted archive file',
  ),
  Argument.mapEffect(
    Effect.fn('Destination file arg remap')(function* (destFilePath) {
      yield* Effect.annotateCurrentSpan({ destFilePath })

      const fs = yield* FileSystem.FileSystem

      const exists = yield* fs.exists(destFilePath)
      if (!exists) return destFilePath

      const overwrite = yield* Prompt.Confirm({
        message: 'Destination path exists. Do you want to overwrite it?',
        initial: true,
      })

      if (!overwrite) {
        const message = `Path '${destFilePath}' should not exist`
        return yield* Effect.fail(
          new CliError.UserError({
            cause: new Error(message),
            userMessage: message,
          }),
        )
      }

      yield* fs.remove(destFilePath, { recursive: true })

      return destFilePath
    }, Effect.orDie),
  ),
)

export const archiveCompressEncryptCommand = Command.make(
  'do',
  { sourceDirPath: sourceDirPathArg, destFilePath: destFilePathArg },
  Effect.fn('archiveCompressEncrypt handler')(function* ({
    destFilePath,
    sourceDirPath,
  }) {
    yield* Effect.annotateCurrentSpan({ destFilePath, sourceDirPath })

    const path = yield* Path.Path
    const fs = yield* FileSystem.FileSystem
    yield* fs.makeDirectory(path.dirname(destFilePath), { recursive: true })

    // NOTE: `zstd -` replaced by tar's `--zstd` flag
    const aceDoCommand = ChildProcess.pipeTo(
      // - will print to stdout
      // '.' means all children of source directory will be put directly into
      // the root of the archive, instead of into a nested directory
      ChildProcess.make`tar --create --zstd --file - --directory ${sourceDirPath} .`,
      // - will make it read from stdin
      ChildProcess.make`gpg --encrypt --recipient ${yield* GPG_RECIPIENT} --output ${destFilePath} -`,
    )

    const exitCode = yield* ChildProcessSpawner.ChildProcessSpawner.use(
      spawner => spawner.exitCode(aceDoCommand),
    )

    if (exitCode !== 0) return yield* Effect.die(new Error('failed to ace'))
  }),
).pipe(
  Command.withDescription(
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
