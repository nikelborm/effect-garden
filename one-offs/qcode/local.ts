/** biome-ignore-all lint/correctness/useHookAtTopLevel: because it's not React.js */

// Local mode — the default: scan ~/projects, pick with fzf, open in VS Code,
// with `--opener shell` drop into an interactive shell rooted at the project
// directory in the same terminal window, or with `--opener opencode` launch
// opencode rooted at the project directory in the same terminal window.

import {
  dedupStreamWithExternalSet,
  dedupStreamWithSet,
} from '@evadev/effect-helpers/dedupStream.ts'

import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as Fiber from 'effect/Fiber'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as Iterable from 'effect/Iterable'
import * as Path from 'effect/Path'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import type { ReadonlyRecord } from 'effect/Record'
import * as Stream from 'effect/Stream'
import { ReducerConcat } from 'effect/String'
import * as Terminal from 'effect/Terminal'

import {
  SHELL,
  streamLinesWithCachedPATHResolver,
  which,
  withCachedPATHResolver,
} from './binary-cache.ts'
import { CACHE_DIR, isNotFoundError, PROJECTS_DIR } from './common.ts'
import { resumeParkedTui } from './suspend-guard.ts'

// TODO: add lock on the cache file

export const DIR_ICON = process.env['QCODE_DIR_ICON'] ?? '\ue5ff' // 
export const WORKSPACE_ICON = process.env['QCODE_WORKSPACE_ICON'] ?? '\ue8da' // 
export const LOCAL_FIND_CACHE_FILE = `${CACHE_DIR}/local-find-cache.txt`

export const PRUNE_DIRS = [
  ['node_modules', '__fixtures__', '__mocks__', '__pycache__', '__snapshots__'],
  ['__test__', '__tests__', '.cache', '.cargo', '.claude', 'temporary', 'gen'],
  ['.expo', '.gradle', '.husky', '.idea', '.netlify', '.next', '.nx', '.specs'],
  ['.nyc_output', '.parcel-cache', 'fixtures', '.serverless', '.venv', 'out'],
  ['integration-tests', '.swc', '.turbo', '.vercel', '.yarn', 'build', 'built'],
  ['specs', 'target', 'temp', 'test', 'dist-types', 'tests', 'vendor', 'venv'],
  ['temp_full_cache', '.docusaurus', 'coverage', 'generated', 'release', 'tmp'],
  ['cache', 'classes', 'third_party', 'testing', 'storybook-static', 'dist'],
  ['.pnpm-store', '.stryker-tmp', 'logs', 'output', 'zig-pkg', '.zig-cache'],
  ['zig-out'],
  // TODO: potentially add garbage '.agents', '.better-agents', '.context' etc
].flat()

export const README_FILES = ['README', 'Readme', 'readme']
  .flatMap(r =>
    ['', 'ru', 'RU', 'en', 'EN'].map(ext => (ext ? r + '.' + ext : r)),
  )
  .flatMap(r => ['', 'md', 'txt'].map(ext => (ext ? r + '.' + ext : r)))

const dirMarkers = ['.git', '.vscode']
const fileMarkers = [
  'package.json',
  'mise.toml',
  'tsconfig.json',
  'Cargo.toml',
  'pyproject.toml',
  'setup.py',
]

const joinNames = (names: string[]) => names.map(e => `-name ${e}`).join(' -o ')

export const PRUNE_ARGS = joinNames(PRUNE_DIRS)

const resolvePreviewDependenciesToBinaryPaths = Effect.gen(function* () {
  const map = {
    eza: 'modern ls replacement — https://github.com/eza-community/eza',
    bat: 'syntax-highlighting cat — https://github.com/sharkdp/bat',
  }

  const depResults = yield* Effect.forEach(
    Object.keys(map) as ('eza' | 'bat')[],
    name => Effect.map(which(name), path => ({ name, path })),
    { concurrency: 'unbounded' },
  )

  const missingDeps = depResults.filter(r => !r.path)

  if (missingDeps.length > 0) {
    for (const { name } of missingDeps)
      yield* Effect.logError(`Missing required tool '${name}': ${map[name]}`)
    return null
  }

  return Object.fromEntries(
    // biome-ignore lint/style/noNonNullAssertion: verified by missingDeps.length === 0
    depResults.map(e => [e.name, e.path!]),
  ) as ReadonlyRecord<'eza' | 'bat', string>
})

export const find = (args: string) => {
  const stream = (main: string, message: string) =>
    streamLinesWithCachedPATHResolver(
      // -H to follow if the "projects" is a symlink somewhere
      ChildProcess.make(main, ['-H', PROJECTS_DIR, ...args.split(' ')]),
      message,
    )

  return Stream.catchIf(
    stream(
      'bfs',
      'Breadth-first finder (`bfs` binary) is not found. Read more here: https://github.com/tavianator/bfs, https://terminaltrove.com/bfs/. The script will attempt to fallback to find',
    ),
    isNotFoundError,
    () =>
      stream(
        'find',
        '`find` binary is not found. Read more here: https://www.man7.org/linux/man-pages/man1/find.1.html',
      ),
  )
}

const dirMarkerArgs = joinNames(dirMarkers)
const fileMarkerArgs = joinNames(fileMarkers)

// SPACES around parentheses are important!!
export const gitAndVsCodeDirPaths = find(
  `-type d ( ${PRUNE_ARGS} ) -prune -o -type d ( ${dirMarkerArgs} ) -prune -print`,
)

export const packageJsonAndMiseTomlAndCodeWorkspacePaths = find(
  `-type d ( ${PRUNE_ARGS} -o ${dirMarkerArgs} ) -prune -o -type f ( ${fileMarkerArgs} -o -name *.code-workspace ) -print`,
)

export const dirAndCodeWorkspacePathsInProjectsRoot = find(
  `-maxdepth 1 -mindepth 1 ( -type d -o -name *.code-workspace )`,
)

const endsWithMarkerRegExp = new RegExp(
  '/(' +
    [...dirMarkers, ...fileMarkers].map(RegExp.escape).join('|') +
    ')(/?)$',
)
const anythingThatEndsWithSymbolsOtherThanSlashRegExp = /[^/]+$/

export const toVscodeArgCandidate = (currentLine: string) =>
  currentLine.endsWith('.code-workspace')
    ? currentLine
    : currentLine
        // removes the special dir/file that's been found inside, leaving only
        // the part of the parent dir's path and preserves trailing slash if
        // the original had one
        .replace(endsWithMarkerRegExp, '$2')
        // adds slash at the end, but only to those without it. Important
        // thing is that lines don't always contain markers.
        // When listing direct children of ./projects, it gives just folder
        // names, which is the reason why these 2 regexps can't be combined
        .replace(anythingThatEndsWithSymbolsOtherThanSlashRegExp, '$&/')

export const hyperlink = (uri: string, text: string) =>
  `\x1b]8;;${uri}\x1b\\${text}\x1b]8;;\x1b\\`

const ansiBlue = (s: string) => `\x1b[34m${s}\x1b[0m`
const ansiGreen = (s: string) => `\x1b[32m${s}\x1b[0m`

// the tab delimiter is to support directories with space in their name
const icon_path_delimiter = '\t'

export const toPrettyFzfRenderedLine =
  (pathService: Path.Path) => (vscodeArgCandidate: string) => {
    const relativePath = pathService.relative(PROJECTS_DIR, vscodeArgCandidate)
    const isDir = vscodeArgCandidate.endsWith('/')
    const color = isDir ? ansiBlue : ansiGreen
    const icon = isDir ? DIR_ICON : WORKSPACE_ICON
    return hyperlink(
      `file://${relativePath}`,
      color([icon, icon_path_delimiter, relativePath, `\n`].join('')),
    )
  }

export const openers = ['vscode', 'shell', 'opencode'] as const
export type Opener = (typeof openers)[number]

const runLauncher = Effect.fn('qcode.runLauncher')(
  function* (
    binary: string,
    args: ReadonlyArray<string>,
    cwd: string,
    notFoundMessage: string,
    // Ctrl+Z in a window that has no shell can never suspend anything (the
    // kernel drops stop signals for the orphaned process group kitty gave
    // qcode), which leaves apps that suspend themselves — opencode does —
    // parked on a blank screen instead of resumed. Enable this only for
    // openers that leave no shell behind; a shell has real job control, where
    // Ctrl+Z must stay a real suspend. See suspend-guard.ts.
    { resumeParkedApp = false } = {},
  ) {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

    const code = yield* withCachedPATHResolver(
      ChildProcess.make(binary, args, {
        cwd,
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit',
        detached: false,
      }),
      notFoundMessage,
    )(spawner.spawn).pipe(
      Effect.flatMap(child =>
        resumeParkedApp
          ? Effect.race(child.exitCode, resumeParkedTui(child.pid))
          : child.exitCode,
      ),
    )

    if (code !== 0)
      yield* Effect.logError(`${binary} exited with non-zero exit code: `, code)

    return ChildProcessSpawner.ExitCode(code === 0 ? 0 : 1)
  },
  Effect.orElseSucceed(() => ChildProcessSpawner.ExitCode(1)),
)

// The launcher runs from a `kitty --single-instance` shortcut, so the window
// closes the moment qcode exits — hiding the error. Hold it open on any error
// until Enter is pressed.
const waitForEnterToClose = Effect.gen(function* () {
  if (!process.stdin.isTTY) return
  yield* Console.log('\nPress Enter to close...')
  yield* Effect.ignore(Terminal.Terminal.use(t => t.readLine))
})

export const localMode = Effect.fn('qcode.local')(
  function* (options: { readonly opener: Opener }) {
    const previewBinaryPaths = yield* resolvePreviewDependenciesToBinaryPaths
    if (!previewBinaryPaths) return ChildProcessSpawner.ExitCode(1)
    const { bat, eza } = previewBinaryPaths

    // fzf replaces {2} with the raw relative path (second space-delimited field),
    // while the first icon is discarded.
    const PREVIEW_CMD = `\
      path=${PROJECTS_DIR}/{2}
      if [ -d "$path" ]; then
        cd "$path"
        for file in ${README_FILES.join(' ')}; do
          if [ -f "$file" ]; then
            PAGER="" ${bat} --style=plain --color=always "$file"
            echo
            break
          fi
        done
        echo
        ${eza} --long --all --binary --group --mounts --group-directories-first \\
          --no-time --octal-permissions --classify=always --icons=always \\
          --color-scale=size --color-scale-mode=gradient --color=always --hyperlink \\
          --smart-group --no-quotes --header ./
      else
        ${bat} --style=plain --language=json --color=always "$path"
      fi
    `

    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

    const fzfProcess = yield* withCachedPATHResolver(
      ChildProcess.make(
        'fzf',
        [
          '--ansi',
          // so that tab is rendered as one space
          '--tabstop=1',
          // delimiter between icon and path
          `--delimiter=${icon_path_delimiter}`,
          // fzf prints to stdout only path, when selected
          '--accept-nth=2..',
          // searches only path, ignores icon
          '--nth=2..',
          '--preview-window=50%',
          `--preview=${PREVIEW_CMD}`,
        ],
        // Keep fzf in our foreground process group so the terminal delivers
        // SIGWINCH (resize) and job-control signals straight to it — exactly as
        // when run directly from the shell. Effect defaults to `detached: true`
        // (new session), which would isolate fzf from those signals.
        { stderr: 'inherit', detached: false },
      ),
      'Fuzzy finder (`fzf` binary) is not found. Read more here: https://github.com/junegunn/fzf.',
    )(spawner.spawn)

    const fs = yield* FileSystem.FileSystem
    const collectedFreshVscodeArgCandidatesFromCurrentRun = new Set<string>()

    const cachedVscodeArgCandidatesFromPreviousRun = pipe(
      fs.stream(LOCAL_FIND_CACHE_FILE),
      Stream.decodeText,
      Stream.splitLines,
      Stream.filter(line => line.length > 0),
      Stream.catchCause(() => Stream.empty),
    )

    const persistProjectsCache = Effect.flatMap(
      fs.makeDirectory(CACHE_DIR, { recursive: true }),
      // flatMap instead of andThen to make sure .size is captured at the end
      () =>
        fs.writeFileString(
          LOCAL_FIND_CACHE_FILE,
          collectedFreshVscodeArgCandidatesFromCurrentRun.size > 0
            ? pipe(
                collectedFreshVscodeArgCandidatesFromCurrentRun,
                Iterable.intersperse('\n'),
                ReducerConcat.combineAll,
              ) + '\n'
            : '',
        ),
    )

    const path = yield* Path.Path

    const fzfInput = Stream.mergeAll(
      [
        gitAndVsCodeDirPaths,
        packageJsonAndMiseTomlAndCodeWorkspacePaths,
        dirAndCodeWorkspacePathsInProjectsRoot,
      ],
      { concurrency: 'unbounded' },
    ).pipe(
      Stream.map(toVscodeArgCandidate),
      dedupStreamWithExternalSet(
        collectedFreshVscodeArgCandidatesFromCurrentRun,
      ),
      Stream.merge(cachedVscodeArgCandidatesFromPreviousRun),
      dedupStreamWithSet,
      Stream.map(toPrettyFzfRenderedLine(path)),
      Stream.encodeText,
    )

    const [fzfExitCode, selectedLine, cacheUpdateFiber] = yield* Effect.all(
      [
        fzfProcess.exitCode,
        fzfProcess.stdout.pipe(Stream.decodeText, Stream.mkString),
        fzfInput.pipe(
          Stream.run(fzfProcess.stdin),
          // forkDetach so that program early exit won't interrupt the cache update
          // previous contents of the file are done streaming by now
          Effect.andThen(Effect.forkDetach(persistProjectsCache)),
        ),
      ],
      { concurrency: 'unbounded' },
    )

    yield* Effect.addFinalizer(() => Fiber.await(cacheUpdateFiber))

    if (fzfExitCode === 130) {
      yield* Effect.log('fzf canceled by user')
      return ChildProcessSpawner.ExitCode(0)
    } else if (fzfExitCode !== 0) {
      yield* Effect.logError('fzf exited with non-zero code: ', fzfExitCode)
      return ChildProcessSpawner.ExitCode(1)
    }

    const relativePath = selectedLine.trim()

    if (!relativePath) {
      yield* Effect.logError('failed to parse relative path returned by fzf')
      return ChildProcessSpawner.ExitCode(1)
    }

    const potentiallySymlinkedPath = path.join(PROJECTS_DIR, relativePath)
    const projectPathOrWorkspaceFile = yield* Effect.orElseSucceed(
      fs.realPath(potentiallySymlinkedPath),
      () => potentiallySymlinkedPath,
    )

    const launcherCwd = projectPathOrWorkspaceFile.endsWith('.code-workspace')
      ? path.dirname(projectPathOrWorkspaceFile)
      : projectPathOrWorkspaceFile

    switch (options.opener) {
      case 'shell': {
        const shell = yield* SHELL

        return yield* runLauncher(
          shell,
          [],
          launcherCwd,
          `Shell (\`${shell}\` binary) is not found. Check your $SHELL.`,
        )
      }
      case 'opencode':
        return yield* runLauncher(
          'opencode',
          [launcherCwd],
          launcherCwd,
          'OpenCode (`opencode` binary) is not found. See https://opencode.ai.',
          { resumeParkedApp: true },
        )
      case 'vscode':
        return yield* runLauncher(
          'code',
          [projectPathOrWorkspaceFile],
          launcherCwd,
          'VS Code (`code` binary) is not found. Are you using VS Code Insiders?',
        )
      default:
        options.opener satisfies never
        return ChildProcessSpawner.ExitCode(1)
    }
  },
  Effect.scoped,
  Effect.flatMap(code =>
    code === 0 ? Effect.succeed(code) : Effect.as(waitForEnterToClose, code),
  ),
  Effect.catchCause(cause =>
    Effect.andThen(waitForEnterToClose, Effect.failCause(cause)),
  ),
)
