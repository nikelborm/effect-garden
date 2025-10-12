import * as Args from '@effect/cli/Args'
import * as CliCommand from '@effect/cli/Command'
import * as HelpDoc from '@effect/cli/HelpDoc'
import * as Prompt from '@effect/cli/Prompt'
import * as ValidationError from '@effect/cli/ValidationError'
import * as PlatformCommand from '@effect/platform/Command'
import * as FileSystem from '@effect/platform/FileSystem'
import * as Path from '@effect/platform/Path'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import { GPG_RECIPIENT } from './gpgRecipientConfig.ts'
import { withResolvedToAbsolutePathArg } from './withResolvedToAbsolutePathArg.ts'

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

export const archiveCompressEncryptCommand = CliCommand.make(
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
