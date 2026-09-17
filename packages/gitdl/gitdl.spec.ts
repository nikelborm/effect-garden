import { allFast } from '@evadev/effect-helpers'

import * as NodeServices from '@effect/platform-node/NodeServices'
import { it } from '@effect/vitest'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Path from 'effect/Path'
import * as Stdio from 'effect/Stdio'
import * as Stream from 'effect/Stream'
import * as Command from 'effect/unstable/cli/Command'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import pkg from './package.json' with { type: 'json' }
import {
  destinationPathCLIOptionBackedByEnv,
  gitRefCLIOptionBackedByEnv,
  pathToEntityInRepoCLIOptionBackedByEnv,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
} from './src/commandLineParams.ts'
import { downloadEntityFromRepo } from './src/downloadEntityFromRepo.ts'
import { OctokitLayer } from './src/octokit.ts'
import { buildTaggedErrorClassVerifyingCause } from './src/TaggedErrorVerifyingCause.ts'

const appCommand = Command.make(
  pkg.name,
  {
    repo: {
      owner: repoOwnerCLIOptionBackedByEnv,
      name: repoNameCLIOptionBackedByEnv,
    },
    pathToEntityInRepo: pathToEntityInRepoCLIOptionBackedByEnv,
    localPathAtWhichEntityFromRepoWillBeAvailable:
      destinationPathCLIOptionBackedByEnv,
    gitRef: gitRefCLIOptionBackedByEnv,
  },
  downloadEntityFromRepo,
)

const cliEffect = Command.run(appCommand, {
  version: pkg.version,
})

const MainLive = Layer.merge(NodeServices.layer, OctokitLayer())

type Params = {
  gitRepoName: string
  gitRepoOwner: string
  gitRef: string
  tempDirPath: string
}

class CommandFinishedWithNonZeroCode extends buildTaggedErrorClassVerifyingCause<{
  exitCode: number
  stdout: string
  stderr: string
}>()(
  'CommandFinishedWithNonZeroCode',
  'Error: Command finished with non zero code',
) {}

const Uint8ArrayStreamToString = <E, R>(
  stream: Stream.Stream<Uint8Array<ArrayBufferLike>, E, R>,
) => stream.pipe(Stream.decodeText(), Stream.mkString)

const runCommandAndGetCommandOutputAndFailIfNonZeroCode = Effect.fnUntraced(
  function* (command: ChildProcess.Command) {
    const executor = yield* ChildProcessSpawner.ChildProcessSpawner

    const process = yield* executor.spawn(command)

    const [exitCode, stdout, stderr] = yield* allFast([
      process.exitCode,
      Uint8ArrayStreamToString(process.stdout),
      Uint8ArrayStreamToString(process.stderr),
    ])

    if (exitCode !== 0)
      return yield* new CommandFinishedWithNonZeroCode({
        exitCode,
        stdout,
        stderr,
      })

    return { stdout, stderr }
  },
)

const getPurelyContentDependentHashOfDirectory = (directoryPath: string) =>
  runCommandAndGetCommandOutputAndFailIfNonZeroCode(
    pipe(
      ChildProcess.make('tar', [
        '--sort=name',
        '--mtime="@0"',
        '--owner=0',
        '--group=0',
        '--numeric-owner',
        '--pax-option=exthdr.name=%d/PaxHeaders/%f,delete=atime,delete=ctime,delete=mtime',
        '-cf',
        '-',
        '-C',
        directoryPath,
        '.',
      ]),
      ChildProcess.pipeTo(ChildProcess.make('sha256sum')),
      ChildProcess.pipeTo(ChildProcess.make('head', ['-c', '64'])),
    ),
  ).pipe(Effect.map(v => v.stdout))

const bareCloneAndHashRepoContents = Effect.fn('bareCloneAndHashRepoContents')(
  function* ({ gitRepoName, gitRepoOwner, tempDirPath, gitRef }: Params) {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const entireGitRepoDestinationPath = path.join(
      tempDirPath,
      'originalGitRepo/',
    )

    yield* runCommandAndGetCommandOutputAndFailIfNonZeroCode(
      ChildProcess.make('git', [
        'clone',
        '--depth=1',
        `https://github.com/${gitRepoOwner}/${gitRepoName}.git`,
        entireGitRepoDestinationPath,
      ]),
    )

    yield* runCommandAndGetCommandOutputAndFailIfNonZeroCode(
      ChildProcess.make('git', ['checkout', gitRef]).pipe(
        ChildProcess.setCwd(entireGitRepoDestinationPath),
      ),
    )

    yield* fs.remove(path.join(entireGitRepoDestinationPath, '.git'), {
      recursive: true,
    })

    return yield* getPurelyContentDependentHashOfDirectory(
      entireGitRepoDestinationPath,
    )
  },
)

const cliFetchAndHashRepoContents = Effect.fn('cliFetchAndHashRepoContents')(
  function* ({ gitRepoName, gitRepoOwner, tempDirPath, gitRef }: Params) {
    const path = yield* Path.Path
    const dirPathOfGitRepoFetchedWithOurCli = path.join(
      tempDirPath,
      'gitRepoFetchedWithOurCli/',
    )

    yield* Effect.provide(
      cliEffect,
      Stdio.layerTest({
        args: Effect.succeed([
          `--repoOwner=${gitRepoOwner}`,
          `--repoName=${gitRepoName}`,
          `--destinationPath=${dirPathOfGitRepoFetchedWithOurCli}`,
          `--gitRef=${gitRef}`,
        ]),
      }),
    )

    return yield* getPurelyContentDependentHashOfDirectory(
      dirPathOfGitRepoFetchedWithOurCli,
    )
  },
)

const fetchAndHashBothDirs = Effect.fn('fetchAndHashBothDirs')(function* (
  repo: Omit<Params, 'tempDirPath'>,
) {
  const fs = yield* FileSystem.FileSystem
  const tempDirPath = yield* fs.makeTempDirectoryScoped()
  const params = {
    ...repo,
    tempDirPath,
  }

  return yield* allFast({
    hashOfOriginalGitRepo: bareCloneAndHashRepoContents(params),
    hashOfGitRepoFetchedUsingOurCLI: cliFetchAndHashRepoContents(params),
  })
})

// Commented because since the repo has big git lfs file, I quickly hit bandwidth limits

// it.layer(MainLive, { timeout: { seconds: 0 } })(
//   `Git Repo ${defaultRepo.owner}/${defaultRepo.name} (has git LFS objects in it) fetched by our cli, should be the same as repo cloned by git itself`,
//     gen(function* () {
//       const { hashOfOriginalGitRepo, hashOfGitRepoFetchedUsingOurCLI } =
//         yield* fetchAndHashBothDirs({
//           gitRepoOwner: defaultRepo.owner,
//           gitRepoName: defaultRepo.name,
//           gitRef: 'main',
//         });

//       ctx
//         .expect(
//           hashOfGitRepoFetchedUsingOurCLI,
//           `Hash of directory fetched by our CLI ("${hashOfGitRepoFetchedUsingOurCLI}") isn't equal to hash of directory cloned with native Git ("${hashOfOriginalGitRepo}"). Does your git client has git LFS activated?`,
//         )
//         .toBe(hashOfOriginalGitRepo);
//     }).pipe(provide(MainLive)),
//   { timeout: 0 /* long because of 100mb git LFS file  */ },
// );

it.layer(MainLive, { timeout: { seconds: 30 } })('CLI', it => {
  it.effect(
    'Git Repo nikelborm/nikelborm fetched by our cli, should be the same as repo cloned by git itself',
    Effect.fnUntraced(function* (ctx) {
      const { hashOfOriginalGitRepo, hashOfGitRepoFetchedUsingOurCLI } =
        yield* fetchAndHashBothDirs({
          gitRepoOwner: 'nikelborm',
          gitRepoName: 'nikelborm',
          gitRef: 'main',
        })

      ctx
        .expect(
          hashOfGitRepoFetchedUsingOurCLI,
          `Hash of directory fetched by our CLI ("${hashOfGitRepoFetchedUsingOurCLI}") isn't equal to hash of directory cloned with native Git ("${hashOfOriginalGitRepo}"). Does your git client has git LFS activated?`,
        )
        .toBe(hashOfOriginalGitRepo)
    }),
  )
})
