/** biome-ignore-all lint/correctness/useHookAtTopLevel: because it's not React.js */

// Local mode — the default: scan ~/projects, pick with fzf, open in VS Code.

import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { pipe } from 'effect/Function'
import * as HashSet from 'effect/HashSet'
import * as Path from 'effect/Path'
import * as ChildProcess from 'effect/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/process/ChildProcessSpawner'
import * as Stream from 'effect/Stream'

import { isNotFound, logErrorOnNotFound, PROJECTS_DIR } from './common.ts'

export const DIR_ICON = '\ue5ff' // 
export const WORKSPACE_ICON = '\ue8da' // 

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
  // the last 3 here because they're too heavy. They will still be listed anyway
  // because they're in root directory, we just wont search for subdirectories
  ['firefox', 'mdn-content', 'base-ui'],
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

// TODO: add error message queue, so that it doesn't mess with fzf's on screen output

const areSomeDependenciesMissing = Effect.gen(function* () {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const depResults = yield* Effect.forEach(
    Object.entries({
      eza: 'modern ls replacement — https://github.com/eza-community/eza',
      bat: 'syntax-highlighting cat — https://github.com/sharkdp/bat',
    }),
    ([name, hint]) =>
      pipe(
        ChildProcess.make('which', [name]),
        spawner.exitCode,
        Effect.map(code => ({ name, hint, isPresent: (code as number) === 0 })),
      ),
    { concurrency: 'unbounded' },
  )

  const missingDeps = depResults.filter(r => !r.isPresent)

  if (missingDeps.length > 0) {
    for (const { name, hint } of missingDeps)
      yield* Effect.logError(`Missing required tool '${name}': ${hint}`)

    return true
  }

  return false
})

export const find = (args: string) => {
  const stream = (main: string, message: string) =>
    ChildProcessSpawner.ChildProcessSpawner.useSync(spawner =>
      spawner.streamLines(
        // -H to follow if the "projects" is a symlink somewhere
        ChildProcess.make(main, ['-H', PROJECTS_DIR, ...args.split(' ')]),
      ),
    ).pipe(Stream.unwrap, Stream.tapError(logErrorOnNotFound(message)))

  return stream(
    'bfs',
    'Breadth-first finder (`bfs` binary) is not found. Read more here: https://github.com/tavianator/bfs, https://terminaltrove.com/bfs/. The script will attempt to fallback to find',
  ).pipe(
    Stream.catchIf(isNotFound, () =>
      stream(
        'find',
        '`find` binary is not found. Read more here: https://www.man7.org/linux/man-pages/man1/find.1.html',
      ),
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

const dedupStreamHashedSimple = <A, E, R>(
  self: Stream.Stream<A, E, R>,
): Stream.Stream<A, E, R> =>
  Stream.mapAccum(
    self,
    () => HashSet.empty<A>(),
    (alreadyEmitted, value) =>
      HashSet.has(alreadyEmitted, value)
        ? [alreadyEmitted, [] as A[]]
        : [HashSet.add(alreadyEmitted, value), [value]],
  )

const endsWithMarkerRegExp = new RegExp(
  '/(' +
    [...dirMarkers, ...fileMarkers].map(RegExp.escape).join('|') +
    ')(/?)$',
)
const anythingThatEndsWithSymbolsOtherThanSlashRegExp = /[^/]+$/

export const vscodeArgCandidates = pipe(
  [
    gitAndVsCodeDirPaths,
    packageJsonAndMiseTomlAndCodeWorkspacePaths,
    dirAndCodeWorkspacePathsInProjectsRoot,
  ],
  Stream.mergeAll({ concurrency: 'unbounded' }),
  Stream.map(currentLine =>
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
          .replace(anythingThatEndsWithSymbolsOtherThanSlashRegExp, '$&/'),
  ),
  dedupStreamHashedSimple,
)

export const hyperlink = (uri: string, text: string) =>
  `\x1b]8;;${uri}\x1b\\${text}\x1b]8;;\x1b\\`

const ansiBlue = (s: string) => `\x1b[34m${s}\x1b[0m`
const ansiGreen = (s: string) => `\x1b[32m${s}\x1b[0m`

// the tab delimiter is to support directories with space in their name
const icon_path_delimiter = '\t'

export const fzfPrettyCandidates = Path.Path.useSync(pathService =>
  Stream.map(vscodeArgCandidates, vscodeArgCandidate => {
    const path = pathService.relative(PROJECTS_DIR, vscodeArgCandidate)
    const isDir = vscodeArgCandidate.endsWith('/')
    const color = isDir ? ansiBlue : ansiGreen
    const icon = isDir ? DIR_ICON : WORKSPACE_ICON
    return hyperlink(
      `file://${path}`,
      color([icon, icon_path_delimiter, path, `\n`].join('')),
    )
  }),
).pipe(Stream.unwrap)

// fzf replaces {2} with the raw relative path (second space-delimited field),
// while the first icon is discarded.
export const PREVIEW_CMD = `\
path=${PROJECTS_DIR}/{2}
if [ -d "$path" ]; then
  cd "$path"
  for file in ${README_FILES.join(' ')}; do
    if [ -f "$file" ]; then
      PAGER="" bat --style=plain --color=always "$file"
      echo
      break
    fi
  done
  echo
  eza --long --all --binary --group --mounts --group-directories-first \\
    --no-time --octal-permissions --classify=always --icons=always \\
    --color-scale=size --color-scale-mode=gradient --color=always --hyperlink \\
    --smart-group --no-quotes --header ./
else
  bat --style=plain --language=json --color=always "$path"
fi`

export const localMode = Effect.gen(function* () {
  if (yield* areSomeDependenciesMissing) return ChildProcessSpawner.ExitCode(1)

  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

  // Keep fzf in our foreground process group so the terminal delivers
  // SIGWINCH (resize) and job-control signals straight to it — exactly as
  // when run directly from the shell. Effect defaults to `detached: true`
  // (new session), which would isolate fzf from those signals.
  const fzfProcess = yield* ChildProcess.make(
    'fzf',
    [
      '--ansi',
      // so that tab is rendered as one space
      '--tabstop=1',
      // delimiter between icon and path
      `--delimiter=${icon_path_delimiter}`,
      // fzf prints to stdout only path
      '--accept-nth=2..',
      // searches only path, ignores icon
      '--nth=2..',
      '--preview-window=50%',
      `--preview=${PREVIEW_CMD}`,
    ],
    { stderr: 'inherit', detached: false },
  ).pipe(
    spawner.spawn,
    Effect.tapError(
      logErrorOnNotFound(
        'Fuzzy finder (`fzf` binary) is not found. Read more here: https://github.com/junegunn/fzf.',
      ),
    ),
  )

  const [fzfExitCode, selectedLine] = yield* Effect.all(
    [
      fzfProcess.exitCode,
      fzfProcess.stdout.pipe(Stream.decodeText, Stream.mkString),
      Stream.run(Stream.encodeText(fzfPrettyCandidates), fzfProcess.stdin),
    ],
    { concurrency: 'unbounded' },
  )

  if ((fzfExitCode as number) === 130) {
    yield* Effect.log('fzf canceled by user')
    return ChildProcessSpawner.ExitCode(0)
  } else if ((fzfExitCode as number) !== 0) {
    yield* Effect.logError('fzf exited with non-zero code: ', fzfExitCode)
    return ChildProcessSpawner.ExitCode(1)
  }

  const relativePath = selectedLine.trim()

  if (!relativePath) {
    yield* Effect.logError('failed to parse relative path returned by fzf')
    return ChildProcessSpawner.ExitCode(1)
  }

  const path = yield* Path.Path
  const fs = yield* FileSystem.FileSystem

  const linkedPath = path.join(PROJECTS_DIR, relativePath)
  const vscodePath = yield* fs
    .realPath(linkedPath)
    .pipe(Effect.orElseSucceed(() => linkedPath))

  const vscodeLauncherExitCode = yield* pipe(
    ChildProcess.make('code', [vscodePath], {
      stdout: 'inherit',
      stderr: 'inherit',
    }),
    spawner.exitCode,
    Effect.tapError(
      logErrorOnNotFound(
        'VS Code (`code` binary) is not found. Are you using VS Code Insiders?',
      ),
    ),
  )

  if ((vscodeLauncherExitCode as number) !== 0) {
    yield* Effect.logError(
      'vs code launcher exited with non-zero code: ',
      vscodeLauncherExitCode,
    )

    return ChildProcessSpawner.ExitCode(1)
  }

  return ChildProcessSpawner.ExitCode(0)
}).pipe(Effect.scoped, Effect.withSpan('qcode.local'))
