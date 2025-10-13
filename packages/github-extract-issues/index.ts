import { FileSystem, Path } from '@effect/platform'
import * as Command from '@effect/platform/Command'
import * as CommandExecutor from '@effect/platform/CommandExecutor'
import { BunContext } from '@effect/platform-bun'
import '@total-typescript/ts-reset'
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Option from 'effect/Option'
import * as EffectString from 'effect/String'
import * as Struct from 'effect/Struct'
import {
  OctokitLayer,
  OctokitLayerLive,
  type RepoArgs,
} from 'effect-octokit-layer'
import * as PlatformConfigProvider from '@effect/platform/PlatformConfigProvider'
import { Order } from 'effect'

// TODO: test how the handle per character streaming: who waits to buffer
// everything, and who waits for newline

class MarkdownStdoutPrinter extends Context.Tag(
  '@nikelborm/github-extract-issues/index/MarkdownStdoutPrinter',
)<MarkdownStdoutPrinter, (mdContent: string) => Effect.Effect<void>>() {
  static layerFromCmdToPipeMdThrough = (
    ...command: EArray.NonEmptyArray<string>
  ) =>
    pipe(
      CommandExecutor.CommandExecutor,
      Effect.map(
        executor => (mdContent: string) =>
          pipe(
            Command.make(...command),
            Command.feed(mdContent),
            Command.stdout('inherit'),
            cmd => executor.start(cmd),
            Effect.flatMap(process => process.exitCode),
            Effect.scoped,
            Effect.orDie,
          ),
      ),
      Layer.effect(this),
    )

  // https://github.com/charmbracelet/glow
  static GlowLive = this.layerFromCmdToPipeMdThrough('glow', '--width=0')

  // https://github.com/tacheraSasi/mdcat
  static MdcatLive = this.layerFromCmdToPipeMdThrough(
    'mdcat',
    '--ansi',
    '--local',
    '--no-pager',
    // '--columns=500'
  )

  // https://github.com/sharkdp/bat/
  static BatLive = this.layerFromCmdToPipeMdThrough(
    'bat',
    '--style=plain',
    '--language=md',
    '--force-colorization',
    '--paging=never',
  )

  // https://github.com/Textualize/rich-cli
  static RichLive = this.layerFromCmdToPipeMdThrough(
    'rich',
    '--markdown',
    '--hyperlinks',
    '--emoji',
    '--force-terminal',
    '-',
  )

  static RawPrintLive = Layer.succeed(this, (mdContent: string) =>
    Console.log(mdContent),
  )
}

const AppLayer = pipe(
  Effect.map(Path.Path, path => path.join(import.meta.dirname, '.env')),
  Effect.flatMap(e => PlatformConfigProvider.fromDotEnv(e)),
  Effect.map(Layer.setConfigProvider),
  Layer.unwrapEffect,
  Layer.provideMerge(MarkdownStdoutPrinter.RichLive),
  Layer.provideMerge(
    Layer.mergeAll(OctokitLayerLive, Logger.pretty, BunContext.layer),
  ),
)

const saveIssuesWithCommentsToLocalMdFile =
  (repo: RepoArgs) =>
  <A extends Issues, E, R>(self: Effect.Effect<A, E, R>) =>
    Effect.flatMap(
      self,
      Effect.fn('saveIssuesWithCommentsToLocalMdFile')(
        function* (issueWithComments) {
          const fs = yield* FileSystem.FileSystem
          const path = yield* cachedIssuesJsonFilePath(repo)
          yield* Effect.annotateCurrentSpan({
            cachedIssuesJsonFilePath: path,
            issueWithCommentsSize: issueWithComments.length,
            ...repo,
          })
          yield* fs.writeFileString(
            path,
            JSON.stringify(issueWithComments, null, 2),
          )
          return issueWithComments
        },
      ),
    )

const getIssuesWithCommentsFromAPI = (repo: RepoArgs) =>
  Effect.flatMap(
    OctokitLayer.repo(repo).issues({ state: 'all', excludePulls: true }),
    // biome-ignore lint/suspicious/useIterableCallbackReturn: <It's fine in Effect>
    Effect.forEach(
      issue =>
        Effect.map(
          issue.comments
            ? OctokitLayer.repo(repo).issue(issue.number).comments()
            : Effect.succeed([]),
          comments => ({ ...issue, comments }),
        ),
      { concurrency: 'unbounded' },
    ),
  )

const preferLargerAmountOfBodyEntries = Order.mapInput(
  Order.number,
  (a: { body: string[] }) => a.body.length,
)

const preferHighPriority = Order.mapInput(
  Order.boolean,
  (a: { isHighPriority: boolean }) => a.isHighPriority,
)

const renderIssuesWithCommentsToMd = (issuesWithComments: Issues): string =>
  issuesWithComments
    .filter(e => e.state === 'open')
    .map(Struct.pick('title', 'comments', 'body', 'labels'))
    .map(
      Struct.evolve({
        comments: EArray.filterMap((comment: IssueComment) =>
          Option.fromNullable(
            comment.author_association === 'OWNER'
              ? comment.body?.trim() || null
              : null,
          ),
        ),
        labels: EArray.filterMap((label: IssueLabel) =>
          Option.fromNullable(
            (typeof label === 'string' ? label : label.name)?.trim() || null,
          ),
        ),
      }),
    )
    .map(({ body, comments, labels, title }) => ({
      title,
      body: [body?.trim(), ...comments].filter(Boolean),
      isHighPriority: labels.includes('High priority'),
    }))
    .sort(preferLargerAmountOfBodyEntries)
    .sort(preferHighPriority)
    .map(
      e =>
        `# ` +
        EffectString.capitalize(e.title) +
        '\n' +
        (body => (body ? `\n${body}\n` : ''))(e.body.join('\n\n')),
    )
    .join('\n')
    .split('\n')
    .map(e => e.trimEnd())
    .join('\n')

const cachedIssuesJsonFilePath = ({ owner, repo }: RepoArgs) =>
  Effect.map(Path.Path, path =>
    path.join(import.meta.dirname, `${owner}_${repo}_issues_data.json`),
  )

const mdFilePath = ({ owner, repo }: RepoArgs) =>
  Effect.map(Path.Path, path =>
    path.join(import.meta.dirname, `${owner}_${repo}_TODO.md`),
  )

const getIssuesWithCommentsFromLocalJsonFile = Effect.fn(function* (
  repo: RepoArgs,
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* cachedIssuesJsonFilePath(repo)
  const issues = yield* fs.readFileString(path)
  return yield* Effect.sync(() => JSON.parse(issues) as Issues)
})

type Issues = Effect.Effect.Success<
  ReturnType<typeof getIssuesWithCommentsFromAPI>
>
type Issue = Issues[number]
type IssueLabel = Issue['labels'][number]
type IssueComment = Issue['comments'][number]

export const getMdFromLocalMdFile = Effect.fn(function* (repo: RepoArgs) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* mdFilePath(repo)
  return yield* fs.readFileString(path)
})

export const getMdBasedOnLocalJsonFile = (repo: RepoArgs) =>
  Effect.map(
    getIssuesWithCommentsFromLocalJsonFile(repo),
    renderIssuesWithCommentsToMd,
  )

const getMdBasedOnRemoteAPI = (repo: RepoArgs) =>
  Effect.map(
    getIssuesWithCommentsFromAPI(repo).pipe(
      saveIssuesWithCommentsToLocalMdFile(repo),
    ),
    renderIssuesWithCommentsToMd,
  )

export const writeToMdFile = Effect.fn(function* (
  repo: RepoArgs,
  mdContent: string,
) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* mdFilePath(repo)
  yield* fs.writeFileString(path, mdContent)
})

await pipe(
  Effect.gen(function* () {
    const repo = {
      owner: 'nikelborm',
      repo: 'fetch-github-folder',
    } satisfies RepoArgs

    const renderMdToStdout = yield* MarkdownStdoutPrinter

    // const md = yield* getMdFromLocalMdFile(repo)
    // const md = yield* getMdBasedOnLocalJsonFile(repo)
    const md = yield* getMdBasedOnRemoteAPI(repo)
    // yield* writeToMdFile(repo, md)

    yield* renderMdToStdout(md)
  }),
  Effect.provide(AppLayer),
  Effect.runPromise,
)
