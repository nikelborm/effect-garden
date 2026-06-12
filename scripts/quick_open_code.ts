#!/usr/bin/env bun

import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import * as Path from '@effect/platform/Path'
import * as BunContext from '@effect/platform-bun/BunContext'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Ansi from '@effect/printer-ansi/Ansi'
import * as Doc from '@effect/printer-ansi/AnsiDoc'
import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as HashSet from 'effect/HashSet'
import * as Stream from 'effect/Stream'

const HOME = process.env['HOME'] ?? '/root'
const PROJECTS_DIR = `${HOME}/projects`
const DIR_ICON = ''
const WORKSPACE_ICON = ''

const PRUNE_DIRS = [
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

const README_FILES = ['README', 'Readme', 'readme']
  .flatMap(r =>
    ['', 'ru', 'RU', 'en', 'EN'].map(ext => (ext ? r + '.' + ext : r)),
  )
  .flatMap(r => ['', 'md', 'txt'].map(ext => (ext ? r + '.' + ext : r)))

const PRUNE_ARGS = PRUNE_DIRS.map(e => `-name ${e}`).join(' -o ')

const find = (args: string) =>
  // breadth first variant of find command
  // https://terminaltrove.com/bfs/
  // https://github.com/tavianator/bfs
  Command.streamLines(Command.make('bfs', PROJECTS_DIR, ...args.split(' ')))

const gitAndVsCodeDirPaths = find(
  `-type d (${PRUNE_ARGS}) -prune -o -type d (-name .git -o -name .vscode) -prune -print`,
)

const packageJsonAndMiseTomlAndCodeWorkspacePaths = find(
  `-type d (${PRUNE_ARGS} -o -name .git) -prune -o -type f (-name package.json -o -name mise.toml -o -name *.code-workspace)`,
)

const dirAndCodeWorkspacePathsInProjectsRoot = find(
  '-maxdepth 1 -mindepth 1 (-type d -o -name *.code-workspace)',
)

const vscodeArgCandidates = Stream.mergeAll(
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
  Stream.mapAccum(HashSet.empty<string>(), (alreadyEmitted, transformed) =>
    HashSet.has(alreadyEmitted, transformed)
      ? [alreadyEmitted, Chunk.empty<string>()]
      : [HashSet.add(alreadyEmitted, transformed), Chunk.make(transformed)],
  ),
  Stream.flattenChunks,
)

const fzfPrettyCandidates = Effect.map(Path.Path, path =>
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
const PREVIEW_CMD = `\
path=${PROJECTS_DIR}/{2}
if [ -d "$path" ]; then
  cd "$path"
  "$HOME/.local/bin/print_first_existing_file" ${README_FILES.join(' ')} && echo
  echo
  eza -labgM --group-directories-first --no-time --octal-permissions \\
      --classify=always --icons=always --color-scale=size \\
      --color-scale-mode=gradient --color=always --hyperlink \\
      --smart-group --no-quotes -h ./
else
  bat --style=plain --language=json --color=always "$path"
fi`

const hyperlink = (uri: string, text: string) =>
  `\x1b]8;;${uri}\x1b\\${text}\x1b]8;;\x1b\\`

Effect.gen(function* () {
  const executor = yield* CommandExecutor.CommandExecutor
  const path = yield* Path.Path

  const fzfProcess = yield* Command.make(
    'fzf',
    '--ansi',
    '--delimiter= ',
    '--preview-window=50%',
    `--preview=${PREVIEW_CMD}`,
  ).pipe(Command.stdout('pipe'), Command.stderr('inherit'), executor.start)

  const [fzfExitCode, selectedLine] = yield* Effect.all(
    [
      fzfProcess.exitCode,
      fzfProcess.stdout.pipe(Stream.decodeText(), Stream.mkString),
      Stream.run(Stream.encodeText(fzfPrettyCandidates), fzfProcess.stdin),
    ],
    { concurrency: 'unbounded' },
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

  const vscodeLauncherExitCode = yield* Command.make(
    'code',
    path.join(PROJECTS_DIR, relativePath),
  ).pipe(Command.stdout('inherit'), Command.stderr('inherit'), Command.exitCode)

  if (vscodeLauncherExitCode !== 0) {
    yield* Effect.logError(
      'vs code launcher exited with non-zero code: ',
      vscodeLauncherExitCode,
    )
    return 1
  }

  return 0
}).pipe(
  Effect.provide(BunContext.layer),
  Effect.scoped,
  BunRuntime.runMain({
    teardown: (exit, onExit: (code: number) => void) => {
      onExit(
        !Exit.isSuccess(exit) || typeof exit.value !== 'number'
          ? 1
          : exit.value,
      )
    },
  }),
)
