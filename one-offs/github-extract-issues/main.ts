import '@total-typescript/ts-reset'

import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as EArray from 'effect/Array'
import * as ConfigProvider from 'effect/ConfigProvider'
import * as Console from 'effect/Console'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as FileSystem from 'effect/FileSystem'
import { flow, pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Order from 'effect/Order'
import * as Path from 'effect/Path'
import * as Result from 'effect/Result'
import * as Stream from 'effect/Stream'
import * as EffectString from 'effect/String'
import * as Struct from 'effect/Struct'
import * as ChildProcess from 'effect/unstable/process/ChildProcess'
import * as ChildProcessSpawner from 'effect/unstable/process/ChildProcessSpawner'

import {
  getIssueComments,
  getRepoIssues,
  type RepoArgs,
} from './effect-octokit-layer-extracted.ts'

// TODO: test how the handle per character streaming: who waits to buffer
// everything, and who waits for newline

class MarkdownStdoutPrinter extends Context.Service<
  MarkdownStdoutPrinter,
  (mdContent: string) => Effect.Effect<void>
>()('@evadev/github-extract-issues/index/MarkdownStdoutPrinter') {}

export const layerFromCmdToPipeMdThrough = (
  templates: TemplateStringsArray,
  ...expressions: ReadonlyArray<ChildProcess.TemplateExpression>
) =>
  pipe(
    ChildProcessSpawner.ChildProcessSpawner.useSync(
      spawner => (mdContent: string) => {
        const command = ChildProcess.make({
          stdout: 'inherit',
          stdin: Stream.encodeText(Stream.make(mdContent)),
        })(templates, ...expressions)

        return pipe(
          spawner.exitCode(command),
          Effect.filterOrFail(
            code => code === 0,
            code =>
              new Error(
                `Markdown printer command (${command.command}) exited with code ${code}. Please try another layer, or check if the program is installed`,
              ),
          ),
          Effect.scoped,
          Effect.orDie,
        )
      },
    ),
    Layer.effect(MarkdownStdoutPrinter),
  )

// https://github.com/charmbracelet/glow
export const GlowLive = layerFromCmdToPipeMdThrough`glow --width=0`

// https://github.com/tacheraSasi/mdcat
export const MdcatLive = layerFromCmdToPipeMdThrough`mdcat --ansi --local --no-pager`
// '--columns=500'

// https://github.com/sharkdp/bat/
export const BatLive = layerFromCmdToPipeMdThrough`bat --style=plain --language=md --force-colorization --paging=never`

// https://github.com/Textualize/rich-cli
export const RichLive = layerFromCmdToPipeMdThrough`rich --markdown --hyperlinks --emoji --force-terminal -`

// TODO: https://github.com/themackabu/ink

export const RawPrintLive = Layer.succeed(
  MarkdownStdoutPrinter,
  (mdContent: string) => Console.log(mdContent),
)

const AppLayer = pipe(
  Effect.map(Path.Path, path => path.join(import.meta.dirname, '.env')),
  Effect.flatMap(path => ConfigProvider.fromDotEnv({ path })),
  Effect.map(ConfigProvider.layer),
  Layer.unwrap,
  Layer.provideMerge(BatLive),
  Layer.provideMerge(
    Layer.mergeAll(
      Logger.layer([Logger.consolePrettyTty()]),
      BunServices.layer,
    ),
  ),
)

const saveIssuesWithCommentsToLocalMdFile = (repo: RepoArgs) =>
  Effect.fn('saveIssuesWithCommentsToLocalMdFile')(function* <
    A extends Issues,
    E,
    R,
  >(self: Effect.Effect<A, E, R>) {
    const issueWithComments = yield* self
    const fs = yield* FileSystem.FileSystem
    const path = yield* cachedIssuesJsonFilePath(repo)
    yield* Effect.annotateCurrentSpan({
      cachedIssuesJsonFilePath: path,
      issueWithCommentsSize: issueWithComments.length,
      ...repo,
    })
    yield* fs.writeFileString(path, JSON.stringify(issueWithComments, null, 2))
    return issueWithComments
  })

const getIssuesWithCommentsFromAPI = (args: RepoArgs) =>
  Effect.flatMap(
    getRepoIssues({ ...args, state: 'all', excludePulls: true }),
    Effect.forEach(
      issue =>
        Effect.map(
          issue.comments
            ? getIssueComments({ ...args, issueNumber: issue.number })
            : Effect.succeed([]),
          comments => ({ ...issue, comments }),
        ),
      { concurrency: 'unbounded' },
    ),
  )

const preferLargerAmountOfBodyEntries = Order.mapInput(
  Order.Number,
  (a: { body: string[] }) => a.body.length,
)

const preferHighPriority = Order.mapInput(
  Order.Boolean,
  (a: { isHighPriority: boolean }) => a.isHighPriority,
)

const renderIssuesWithCommentsToMd = (issuesWithComments: Issues): string =>
  issuesWithComments
    .filter(e => e.state === 'closed')
    .map(
      flow(
        Struct.evolve({
          comments: EArray.filterMap((comment: IssueComment) => {
            const res = comment.body?.trim()
            if (comment.author_association !== 'OWNER' || !res)
              return Result.failVoid
            return Result.succeed(res)
          }),
          labels: EArray.filterMap((label: IssueLabel) => {
            const res = (typeof label === 'string' ? label : label.name)?.trim()
            if (!res) return Result.failVoid
            return Result.succeed(res)
          }),
        }),
        ({ body, comments, labels, title }) => ({
          title,
          body: [body?.trim(), ...comments].filter(Boolean),
          isHighPriority: labels.includes('High priority'),
        }),
      ),
    )
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

const getIssuesWithCommentsFromLocalJsonFile = Effect.fn(
  'getIssuesWithCommentsFromLocalJsonFile',
)(function* (repo: RepoArgs) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* cachedIssuesJsonFilePath(repo)
  const issues = yield* fs.readFileString(path)
  return yield* Effect.sync(() => JSON.parse(issues) as Issues)
})

type Issues = Effect.Success<ReturnType<typeof getIssuesWithCommentsFromAPI>>
type Issue = Issues[number]
type IssueLabel = Issue['labels'][number]
type IssueComment = Issue['comments'][number]

export const getMdContentFromLocalMdFile = Effect.fn(
  'getMdContentFromLocalMdFile',
)(function* (repo: RepoArgs) {
  const fs = yield* FileSystem.FileSystem
  const path = yield* mdFilePath(repo)
  return yield* fs.readFileString(path)
})

export const getMdContentBasedOnLocalJsonFile = (repo: RepoArgs) =>
  Effect.map(
    getIssuesWithCommentsFromLocalJsonFile(repo),
    renderIssuesWithCommentsToMd,
  )

const getMdContentBasedOnRemoteAPI = (repo: RepoArgs) =>
  Effect.map(
    getIssuesWithCommentsFromAPI(repo).pipe(
      saveIssuesWithCommentsToLocalMdFile(repo),
    ),
    renderIssuesWithCommentsToMd,
  )

export const writeToMdFile = Effect.fn('writeToMdFile')(function* (
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

    // const md = yield* getMdContentFromLocalMdFile(repo)
    const md = yield* getMdContentBasedOnLocalJsonFile(repo)
    // const md = yield* getMdContentBasedOnRemoteAPI(repo)
    // yield* writeToMdFile(repo, md)

    yield* renderMdToStdout(md)
  }),
  Effect.provide(AppLayer),
  // TODO: make custom runtime
  // https://typeonce.dev/course/effect-beginners-complete-getting-started/effect-in-production/most-common-effect-patterns#use-a-custom-runtime-from-the-beginning
  BunRuntime.runMain,
)
