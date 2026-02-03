#!/usr/bin/env bun

import { defaultMdxConfigLayer, MdxService, MdxServiceLive } from 'effect-mdx'
import type { Transformer } from 'unified'
import type { Node } from 'unist'

import * as Command from '@effect/platform/Command'
import * as FetchHttpClient from '@effect/platform/FetchHttpClient'
import * as FileSystem from '@effect/platform/FileSystem'
import { KiB } from '@effect/platform/FileSystem'
import * as HttpClient from '@effect/platform/HttpClient'
import type * as HttpClientError from '@effect/platform/HttpClientError'
import * as Path from '@effect/platform/Path'
import * as BunCommandExecutor from '@effect/platform-bun/BunCommandExecutor'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunPath from '@effect/platform-bun/BunPath'
import * as Console from 'effect/Console'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Option from 'effect/Option'
import * as Record from 'effect/Record'
import type * as Scope from 'effect/Scope'
import * as EString from 'effect/String'

import { parseMdxNodes } from './lib/parseMdxNodes.ts'
import {
  renderFileHeaderTsDocString,
  renderMainModuleTsDocString,
} from './lib/renderMainTsDoc.ts'

const DEBUG = false

// https://github.com/w3c/uievents-key/
const MDN_MDX_URL =
  'https://raw.githubusercontent.com/mdn/content/refs/heads/main/files/en-us/web/api/ui_events/keyboard_event_key_values/index.md'

const fetchMdnPageContentFromGithub = Effect.gen(function* () {
  const client = yield* Effect.map(
    HttpClient.HttpClient,
    HttpClient.filterStatusOk,
  )
  const response = yield* client.get(MDN_MDX_URL)
  const mdxPageContent = yield* response.text

  return mdxPageContent
    .replaceAll('{{', '{')
    .replaceAll('}}', '}')
    .replaceAll(/<!--.*-->/g, '')
    .replaceAll(/[\n ]*>/g, '>')
}).pipe(
  Effect.tapErrorCause(cause =>
    Effect.logError('Failed to fetch from GitHub: ', cause),
  ),
)

const fixGeneratedFolder = Effect.all([
  Effect.log('Started fixing comments with prettier.'),
  Command.string(
    Command.make('bunx', 'prettier', '--write', `src`, 'index.ts'),
  ),
  Effect.log('Finished fixing comments with prettier.\n'),
  Effect.log('Started fixing everything with biome.'),
  Command.string(Command.make('biome', 'check', '--write', `src`, 'index.ts')),
  Effect.log('Finished fixing everything with biome.\n'),
  Effect.log('Started compiling with tspc.'),
  Effect.flatMap(FileSystem.FileSystem, fs => {
    const rm = (p: string) => fs.remove(p, { force: true, recursive: true })
    return Effect.all([rm('dist'), rm('dist-types')])
  }),
  Command.string(Command.make('bunx', 'tspc')),
  Effect.log('Finished compiling with tspc.\n'),
])

const makeCacheError = (
  cause: unknown,
): Effect.Effect<never, LocalCacheError> =>
  Effect.fail({
    _tag: 'LocalCacheError' as const,
    cause,
    message: EString.stripMargin(
      ` |Wasn't able to take the page from cache, for one of the following reasons:
        |
        |1. Cache path points at something that's not a file
        |2. Cache file doesn't exists
        |3. Current process doesn't have access to cache file
        |4. Cache file is smaller than 1 KB, which is very sus, and it probably wasn't written properly
        |5. Something else`,
    ),
  })

const AppLayer = MdxServiceLive.pipe(
  Layer.provideMerge(defaultMdxConfigLayer),
  Layer.provideMerge(FetchHttpClient.layer),
  Layer.provideMerge(BunCommandExecutor.layer),
  Layer.provideMerge(BunFileSystem.layer),
  Layer.provideMerge(Logger.pretty),
  Layer.provideMerge(BunPath.layer),
)

await Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const cacheDirPath = path.join(
    // biome-ignore lint/complexity/useLiteralKeys: index signatures conflict with tsconfig
    import.meta?.env?.['HOME'] ?? '~',
    '.cache',
    'scrapeMDNForKeyboardButtons',
  )

  const cacheFilePath = path.join(cacheDirPath, 'page.mdx')

  const cacheStat = fs.stat(cacheFilePath)

  const cacheFallback = yield* cacheStat.pipe(
    Effect.map(info =>
      info.type === 'File' && info.size > KiB(10) ? info : null,
    ),
    Effect.orElseSucceed(() => null),
  )

  const preferRefetch =
    !cacheFallback ||
    Option.match(cacheFallback.birthtime, {
      onNone: () => true,
      onSome: birthtime => {
        const cacheExpiresAt = DateTime.add(
          DateTime.unsafeFromDate(birthtime),
          { weeks: 1 },
        )
        const isPastCacheExpiration = DateTime.unsafeNow().pipe(
          DateTime.greaterThanOrEqualTo(cacheExpiresAt),
        )
        return isPastCacheExpiration
      },
    })

  yield* Effect.log(
    `The script will attempt to ${preferRefetch ? 'fetch from github' : 'read from cache'} first`,
  )

  const readCacheFile = Effect.tapErrorCause(
    cacheFallback
      ? Effect.catchAll(fs.readFileString(cacheFilePath), makeCacheError)
      : makeCacheError({ message: 'cacheFallback is null' }),
    cause => Effect.logError('Failed to read from cache: ', cause),
  )

  const fetchAndCacheLocally = Effect.tap(
    fetchMdnPageContentFromGithub,
    Effect.fn(function* (mdxPageContent) {
      yield* fs.makeDirectory(cacheDirPath, { recursive: true })

      yield* fs.writeFileString(cacheFilePath, mdxPageContent)
    }, Effect.ignore),
  )

  const mdxPageContent = yield* Effect.orDieWith<
    string,
    HttpClientError.HttpClientError | LocalCacheError,
    HttpClient.HttpClient
  >(
    preferRefetch
      ? fetchAndCacheLocally.pipe(
          Effect.tapErrorCause(() => Effect.log('Falling back to cache...')),
          Effect.orElse(() => readCacheFile),
        )
      : readCacheFile.pipe(
          Effect.tapErrorCause(() => Effect.log('Falling back to GitHub...')),
          Effect.orElse(() => fetchAndCacheLocally),
        ),
    () => 'Failed to both fetch from GitHub and read from cache',
  )

  yield* Effect.log('Successfully acquired MDN page contents.')

  const service = yield* MdxService

  let mdast = null as Node | null

  const logAstPlugin = (): Transformer => (tree, _file) => {
    mdast = tree
    return tree
  }

  yield* service.compileMdx(mdxPageContent, {
    rehypePlugins: [logAstPlugin],
  })

  if (!mdast) return yield* Effect.dieMessage(`MDX AST plugin didn't work`)
  yield* Effect.log('Parsed mdast by mdx parser')

  const removeEntries = (
    node: unknown,
    shouldRemoveOptions: ((key: string, value: any) => boolean)[],
  ): any =>
    Array.isArray(node)
      ? node.map(e => removeEntries(e, shouldRemoveOptions))
      : typeof node === 'object' && node !== null
        ? Object.fromEntries(
            Object.entries(node)
              .filter(([key, value]) =>
                shouldRemoveOptions.every(
                  shouldRemove => !shouldRemove(key, value),
                ),
              )
              .map(([key, value]) => [
                key,
                removeEntries(value, shouldRemoveOptions),
              ]),
          )
        : node

  const removeKeys = (node: unknown, keysToRemove: string[]): any =>
    removeEntries(node, [key => keysToRemove.includes(key)])

  yield* Effect.log('Started cleaning mdast with custom passes')
  const cleaned = pipe(
    removeKeys(mdast, [
      'position',
      '_mdxExplicitJsx',
      'start',
      'end',
      'loc',
      'optional',
      'comments',
      'sourceType',
      'range',
    ]),
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
  )
  yield* Effect.log('Cleaned mdast with custom passes')

  if (DEBUG) {
    yield* Effect.log('Started writing ./mdast.json')
    yield* fs.writeFileString('./mdast.json', JSON.stringify(mdast, void 0, 2))
    yield* Effect.log('Written ./mdast.json')
  }

  const report: any = { main: [] } as any

  yield* fs.remove('./src', { recursive: true })
  yield* fs.remove('./index.ts')
  let cursor = report as any
  let subcategoriesStack: string[] = []
  // TODO: solve this shit:
  // > [!NOTE]
  yield* Effect.log('recreated generated directories')
  yield* Effect.log('Started finishing touches with custom passes')

  for (const element of (cleaned as any).children) {
    if (element?.value?.trim?.() === '') continue
    if (['h2', 'h3'].includes(element.tagName)) {
      const expectedStackSize = parseInt(element.tagName.slice(1), 10) - 1

      if (expectedStackSize - subcategoriesStack.length > 1)
        throw new Error(
          'Wtf? seems like improper headings structure. trying to jump too deep without naming intermediate categories',
        )

      subcategoriesStack = [
        ...subcategoriesStack.slice(0, expectedStackSize - 1),
        EString.snakeToPascal(
          element.value.replaceAll('#', '').trim().replaceAll(' ', '_'),
        ),
      ]
      cursor = report

      for (const subcategory of subcategoriesStack) {
        if (!cursor.subcategories) cursor.subcategories = {}
        const obj = cursor?.subcategories?.[subcategory] ?? {
          main: [],
          rows: [],
          additions: [],
        }
        cursor.subcategories[subcategory] = obj
        cursor = obj
      }
      continue
    }

    if (['table 6', 'table 3'].includes(element?.type)) {
      cursor.rows = element?.rows
      continue
    }
    const addition = element?.value?.match(/^\[(?<index>\d)\] (?<note>.*)/)

    if (addition) {
      let { index, note } = addition.groups
      index = parseInt(index, 10) - 1
      cursor.additions[index] = note
      continue
    }

    if (!element.value) {
      yield* Effect.logError(element)
      throw new Error('wtf. likely incompletely parsed object')
    }

    cursor.main.push(element.value)
  }
  yield* Effect.log('Done finishing touches with custom passes\n')

  if (DEBUG) {
    yield* Effect.log('Started writing ./report.json')
    yield* fs.writeFileString(
      './report.json',
      JSON.stringify(report, void 0, 2),
    )
    yield* Effect.log('Written report')
  }

  const walk: (
    node: any,
    nodeName: string,
    stack?: string[] | undefined,
  ) => Effect.Effect<void, never, Scope.Scope> = Effect.fn(function* (
    node: any,
    nodeName: string,
    stack: string[] = [''],
  ) {
    const isLeaf = !('subcategories' in node)

    if (isLeaf) {
      const dirPath = path.join(...stack)

      yield* fs.makeDirectory(dirPath, { recursive: true })
      const tsdocString = renderFileHeaderTsDocString(node.main, nodeName)

      const tsFilePath = path.join(dirPath, nodeName + '.ts')
      const renderRowOf3Columns = ({
        compositionEventDataValue,
        comments,
        symbol,
      }: any) => {
        const {
          groups: { name },
        } = compositionEventDataValue.match(
          /`GDK_KEY_dead_(?<name>\w+)`/,
        ) as any as { groups: { name: string } }

        const tsComment = EString.stripMargin(`|
          |/**
          | * One of the possible {@linkcode GlobalEventHandlersEventMap.compositionupdate|compositionupdate} event's data property
          | *
          | * ${comments}
          | *
          | * ${compositionEventDataValue}
          | *
          | * @generated
          | */`)
        return EString.stripMargin(`|${tsComment}
        |export type ${name} = '${symbol}'
        |${tsComment}
        |export const ${name}: ${name} = '${symbol}'
        |`)
      }
      const renderRowOfSixColumns = (e: any) => {
        let deprecatedTag = ''
        const currAdditions: Set<string> = new Set()
        const indexRegexp = /\[(?<index>\d)\]/g
        const entriesCleaned = Object.entries<any>(e)
          .filter(([, v]) => v.trim())
          .map(([k, v]) => {
            ;[...v.matchAll(indexRegexp)]
              .map(
                e =>
                  node.additions[parseInt(e?.groups?.['index'] ?? '', 10) - 1],
              )
              .forEach(v => currAdditions.add(v))

            return [k, v.replaceAll(indexRegexp, '')]
          })
        const objClean = Object.fromEntries(entriesCleaned) as any
        const valueDirty = objClean.keyValue
        if (valueDirty.includes('deprecated')) deprecatedTag = '@deprecated'

        const valueRegexp = /`\W*"(.+)"\W*`/
        const valueMatched = valueDirty.match(valueRegexp)

        if (!valueMatched)
          console.log('bad keyValue name', { valueDirty, valueMatched })

        const value = valueMatched[1]
        const varName =
          value === ' ' ? 'Space' : value === 'Symbol' ? 'SymbolKey' : value

        if (
          value === '0"` through `"9' ||
          (value === 'Clear' && nodeName === 'NumericKeypadKeys')
        )
          return ''

        const comment = EString.stripMargin(`|/**
          |* ${objClean.description || ''}
          |*
          |* ${[...currAdditions].join('\n\n')}
          |*
          |* ${objClean.windowsVirtualKeyCode ? `Windows virtual key code: ${objClean.windowsVirtualKeyCode}` : ''}
          |*
          |* ${objClean.macVirtualKeyCode ? `Mac virtual key code: ${objClean.macVirtualKeyCode}` : ''}
          |*
          |* ${objClean.linuxVirtualKeyCode ? `Linux virtual key code: ${objClean.linuxVirtualKeyCode}` : ''}
          |*
          |* ${objClean.androidVirtualKeyCode ? `Android virtual key code: ${objClean.androidVirtualKeyCode}` : ''}
          |*
          |* ${deprecatedTag}
          |* @generated
        |*/`)
        return EString.stripMargin(`|
          |${comment}
          |export type ${varName} = '${value}'
          |
          |${comment}
          |export const ${varName}: ${varName} = '${value}'
        |`)
      }
      const code =
        tsdocString +
        '\n' +
        (Object.entries(node.rows[0]).length === 3
          ? node.rows.map(renderRowOf3Columns)
          : node.rows.map(renderRowOfSixColumns)
        ).join('\n\n')

      yield* fs.writeFileString(tsFilePath, code)
    } else {
      const dirPath = path.join(...stack, nodeName)
      yield* fs.makeDirectory(dirPath, { recursive: true })

      let indexFileBody = ''
      let aggregateFileBody = ''

      for (const [subNodeName, subNode] of Record.toEntries<string, any>(
        node.subcategories,
      )) {
        const newStack = [...stack, nodeName]
        yield* walk(subNode, subNodeName, newStack).pipe(
          Effect.catchAllCause(Effect.logError),
        )
        indexFileBody += renderMainModuleTsDocString(subNode.main)
        indexFileBody += `export * as ${subNodeName} from './${subNodeName}.ts'\n\n`
        aggregateFileBody += `export * from './${nodeName}/${subNodeName}.ts'\n`
      }

      const tsdocString = renderFileHeaderTsDocString(node.main, nodeName)

      yield* fs.writeFileString(
        path.join(dirPath, 'subcategories.ts'),
        tsdocString + '\n' + indexFileBody,
      )
      yield* fs.writeFileString(
        path.join(...stack, `${nodeName}.ts`),
        aggregateFileBody,
      )
    }
  }, Effect.orDie)

  yield* Effect.log('Started walking and building actual files.')
  yield* walk(report, 'src', [])
  yield* fs.rename('src.ts', 'index.ts')
  yield* Effect.log('Finished walking and building actual files.\n')

  yield* fixGeneratedFolder
  yield* Effect.log('finished formatting and linting.\n')

  yield* Effect.log('✓ All done! Successfully updated index.ts.')
}).pipe(
  Effect.scoped,
  Effect.catchAllCause(error => Console.error(error)),
  Effect.provide(AppLayer),
  Effect.runPromise,
)

interface LocalCacheError {
  _tag: 'LocalCacheError'
  cause: unknown
  message: string
}
