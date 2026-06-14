#!/usr/bin/env bun
// if you have bun installed with mise, the above shebang might not always work

// I worked around it, by assigning the keyboard shortcut to a fixed path instead
// kitty --single-instance /home/nikel/.local/share/mise/installs/bun/latest/bin/bun /home/nikel/projects/effect-garden/scripts/quick_open_code.ts

// all of the dependencies are available on npm
import { dedupStreamHashedSimple } from '@evadev/effect-helpers'
import { prettyPrint } from 'effect-errors'

import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import type { PlatformError } from '@effect/platform/Error'
import * as Path from '@effect/platform/Path'
import * as BunCommandExecutor from '@effect/platform-bun/BunCommandExecutor'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Ansi from '@effect/printer-ansi/Ansi'
import * as Doc from '@effect/printer-ansi/AnsiDoc'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Layer from 'effect/Layer'
import * as Stream from 'effect/Stream'

export const HOME = process.env['HOME'] ?? '/root'
export const PROJECTS_DIR = `${HOME}/projects`
export const DIR_ICON = ''
export const WORKSPACE_ICON = ''

const matchNotFound = <R, L>(error: PlatformError, onNotFound: R, other: L) =>
  error._tag === 'SystemError' && error.reason === 'NotFound'
    ? onNotFound
    : other

const logErrorMessageOnNotFoundError =
  (message: string) =>
  <A extends PlatformError>(error: A) =>
    matchNotFound(error, Effect.logError(message), Effect.void)

export const PRUNE_DIRS = [
  ['node_modules', '__fixtures__', '__mocks__', '__pycache__', '__snapshots__'],
  ['__test__', '__tests__', '.cache', '.cargo', '.claude', 'temporary', 'gen'],
  ['.expo', '.gradle', '.husky', '.idea', '.netlify', '.next', '.nx', '.specs'],
  ['.nyc_output', '.parcel-cache', 'fixtures', '.serverless', '.venv', 'out'],
  ['integration-tests', '.swc', '.turbo', '.vercel', '.yarn', 'build', 'built'],
  ['specs', 'target', 'temp', 'test', 'dist-types', 'tests', 'vendor', 'venv'],
  ['temp_full_cache', '.docusaurus', 'coverage', 'generated', 'release', 'tmp'],
  ['cache', 'classes', 'third_party', 'testing', 'storybook-static', 'dist'],
  ['.pnpm-store', '.stryker-tmp', 'logs', 'output'],
  // the last 3 here because they're too heavy. They will still be listed anyway
  // because they're in root directory, we just wont search for subdirectories
  ['firefox', 'mdn-content', 'base-ui'],
].flat()

export const README_FILES = ['README', 'Readme', 'readme']
  .flatMap(r =>
    ['', 'ru', 'RU', 'en', 'EN'].map(ext => (ext ? r + '.' + ext : r)),
  )
  .flatMap(r => ['', 'md', 'txt'].map(ext => (ext ? r + '.' + ext : r)))

export const PRUNE_ARGS = PRUNE_DIRS.map(e => `-name ${e}`).join(' -o ')

// TODO: add error message queue, so that it doesn't mess with fzf's on screen output

const areSomeDependenciesMissing = Effect.gen(function* () {
  const depResults = yield* Effect.forEach(
    Object.entries({
      eza: 'modern ls replacement — https://github.com/eza-community/eza',
      bat: 'syntax-highlighting cat — https://github.com/sharkdp/bat',
    }),
    ([name, hint]) =>
      Command.make('which', name).pipe(
        Command.exitCode,
        Effect.map(code => ({ name, hint, isPresent: code === 0 })),
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
    Command.make(main, PROJECTS_DIR, ...args.split(' ')).pipe(
      Command.streamLines,
      Stream.tapError(logErrorMessageOnNotFoundError(message)),
    )

  return stream(
    'bfs',
    'Breadth-first finder (`bfs` binary) is not found. Read more here: https://github.com/tavianator/bfs, https://terminaltrove.com/bfs/. The script will attempt to fallback to find',
  ).pipe(
    Stream.catchAll(error =>
      matchNotFound(
        error,
        stream(
          'find',
          '`find` binary is not found. Read more here: https://www.man7.org/linux/man-pages/man1/find.1.html',
        ),
        Stream.fail(error),
      ),
    ),
  )
}

// SPACES around parentheses are important!!
export const gitAndVsCodeDirPaths = find(
  `-type d ( ${PRUNE_ARGS} ) -prune -o -type d ( -name .git -o -name .vscode ) -prune -print`,
)

export const packageJsonAndMiseTomlAndCodeWorkspacePaths = find(
  `-type d ( ${PRUNE_ARGS} -o -name .git ) -prune -o -type f ( -name package.json -o -name mise.toml -o -name *.code-workspace ) -print`,
)

export const dirAndCodeWorkspacePathsInProjectsRoot = find(
  '-maxdepth 1 -mindepth 1 ( -type d -o -name *.code-workspace )',
)

export const vscodeArgCandidates = Stream.mergeAll(
  [
    gitAndVsCodeDirPaths,
    packageJsonAndMiseTomlAndCodeWorkspacePaths,
    dirAndCodeWorkspacePathsInProjectsRoot,
  ],
  { concurrency: 'unbounded' },
).pipe(
  Stream.map(currentLine =>
    currentLine.endsWith('.code-workspace')
      ? currentLine
      : currentLine
          .replace('package.json', '')
          .replace('mise.toml', '')
          .replace('.git', '')
          .replace('.vscode', '')
          // adds slash at the end
          .replace(/[^/]+$/, '$&/'),
  ),
  dedupStreamHashedSimple,
)

export const hyperlink = (uri: string, text: string) =>
  `\x1b]8;;${uri}\x1b\\${text}\x1b]8;;\x1b\\`

export const fzfPrettyCandidates = Effect.map(Path.Path, path =>
  Stream.map(vscodeArgCandidates, entry =>
    Doc.hcat([
      Doc.text(entry.endsWith('/') ? DIR_ICON : WORKSPACE_ICON),
      Doc.space,
      Doc.text(path.relative(PROJECTS_DIR, entry)),
      Doc.line,
    ]).pipe(
      Doc.annotate(entry.endsWith('/') ? Ansi.blue : Ansi.green),
      Doc.render({ style: 'pretty' }),
      rendered => hyperlink(`file://${entry}`, rendered),
    ),
  ),
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
  eza -labgM --group-directories-first --no-time --octal-permissions \\
      --classify=always --icons=always --color-scale=size \\
      --color-scale-mode=gradient --color=always --hyperlink \\
      --smart-group --no-quotes -h ./
else
  bat --style=plain --language=json --color=always "$path"
fi`

const AppLayer = Layer.merge(
  BunCommandExecutor.layer.pipe(Layer.provide(BunFileSystem.layer)),
  BunPath.layer,
)

export const program = Effect.gen(function* () {
  if (yield* areSomeDependenciesMissing) return 1

  const executor = yield* CommandExecutor.CommandExecutor

  const [fzfExitCode, selectedLine] = yield* Command.make(
    'fzf',
    '--ansi',
    '--delimiter= ',
    '--preview-window=50%',
    `--preview=${PREVIEW_CMD}`,
  ).pipe(
    Command.stderr('inherit'),
    executor.start,
    Effect.tapError(
      logErrorMessageOnNotFoundError(
        'Fuzzy finder (`fzf` binary) is not found. Read more here: https://github.com/junegunn/fzf.',
      ),
    ),
    Effect.flatMap(process =>
      Effect.all(
        [
          process.exitCode,
          process.stdout.pipe(Stream.decodeText(), Stream.mkString),
          Stream.run(Stream.encodeText(fzfPrettyCandidates), process.stdin),
        ],
        { concurrency: 'unbounded' },
      ),
    ),
  )

  if (fzfExitCode === 130) {
    yield* Effect.log('fzf canceled by user')
    return 0
  } else if (fzfExitCode !== 0) {
    yield* Effect.logError('fzf exited with non-zero code: ', fzfExitCode)
    return 1
  }

  const relativePath = selectedLine.split(' ')[1]?.trim()

  if (!relativePath) {
    yield* Effect.logError('failed to parse relative path returned by fzf')
    return 1
  }

  const path = yield* Path.Path

  const vscodeLauncherExitCode = yield* Command.make(
    'code',
    path.join(PROJECTS_DIR, relativePath),
  ).pipe(
    Command.stdout('inherit'),
    Command.stderr('inherit'),
    Command.exitCode,
    Effect.tapError(
      logErrorMessageOnNotFoundError(
        'VS Code (`code` binary) is not found. Are you using VS Code Insiders?',
      ),
    ),
  )

  if (vscodeLauncherExitCode !== 0) {
    yield* Effect.logError(
      'vs code launcher exited with non-zero code: ',
      vscodeLauncherExitCode,
    )
    return 1
  }

  return 0
}).pipe(
  Effect.scoped,
  Effect.provide(AppLayer),
  Effect.withSpan(import.meta.file),
  Effect.sandbox,
  Effect.catchAll(e => {
    console.error(prettyPrint(e))
    return Effect.fail(e)
  }),
)

if (import.meta.main)
  BunRuntime.runMain(program, {
    teardown: (exit, onExit: (code: number) => void) => {
      onExit(
        !Exit.isSuccess(exit) || typeof exit.value !== 'number'
          ? 1
          : exit.value,
      )
    },
  })
