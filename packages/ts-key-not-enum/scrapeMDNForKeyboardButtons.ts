#!/usr/bin/env bun

import { defaultMdxConfigLayer, MdxService, MdxServiceLive } from 'effect-mdx'
import prettier from 'prettier'
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
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Record from 'effect/Record'
import type * as Scope from 'effect/Scope'
import * as EString from 'effect/String'

import { parseMdxNodes } from './parseMdxNodes.ts'
import {
  renderMainFileTsDocString,
  renderMainModuleTsDocString,
} from './renderMainTsDoc.ts'

interface Key {
  value: string
  description: string
}

// https://github.com/w3c/uievents-key/
const MDN_MDX_URL =
  'https://raw.githubusercontent.com/mdn/content/refs/heads/main/files/en-us/web/api/ui_events/keyboard_event_key_values/index.md'

const _keyValueRegex = /"([a-z0-9_]+)"/i

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

const OrderKey = Order.mapInput(Order.string, (e: Key) => e.value)

const _removeDuplicates = (keys: Key[]) =>
  EArray.dedupeWith<Key>(
    EArray.sort(keys, OrderKey),
    (a, b) => a.value === b.value,
  )

// const formatKeyEntry = ({ value, description }: Key) => {
//   let formattedDescription: string

//   if (value === 'Symbol') value = 'SymbolModifier'
//   if (value === '0') value = 'Zero'

//   if (description.includes('\n')) {
//     formattedDescription = [
//       '/**',
//       ...description
//         .trim()
//         .split(/\n\s*/)
//         .map(s => ` * ${s.trim()}`),
//       ' */',
//     ].join('\n')
//   } else {
//     formattedDescription = `/** ${description} */`
//   }

//   return `${formattedDescription}\nexport const ${value} = '${value}';`
// }

// '/**',
// ' * @file',
// ' * @generated',
// ' * Here are listed all non-printable string values one can expect from $event.key.',
// ' * For example, values like "CapsLock", "Backspace", and "AudioVolumeMute" are present,',
// ' * but values like "a", "A", "#", "é", or "¿" are not.',
// ' * Auto generated from MDN: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys',

const fixGeneratedFolder = Command.string(
  Command.make('biome', 'check', '--write', './generated'),
)

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
  Layer.provideMerge(BunPath.layer),
)

await Effect.gen(function* () {
  yield* Effect.log('Making GET request to MDN...')

  // yield* Effect.log('Eliminating duplicate keys...')
  // const uniqueKeys = removeDuplicates(keys)
  // yield* Effect.log('Generating .d.ts file...')
  // const enumFile = generateEnumFile(uniqueKeys)
  // yield* Effect.log('Writing result to index.ts...')
  // yield* writeEnumFile(enumFile)

  const fs = yield* FileSystem.FileSystem
  const path = yield* Path.Path

  const cacheDirPath = path.join(
    // biome-ignore lint/complexity/useLiteralKeys: index signatures conflict with tsconfig
    import.meta?.env?.['HOME'] ?? '~',
    '.cache',
    'scrapeMDNForKeyboardButtons',
  )

  // TODO: Make use of ExecutionPlan?
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

  const _parsedMdx = yield* service.compileMdx(mdxPageContent, {
    rehypePlugins: [logAstPlugin],
  })

  if (!mdast) return yield* Effect.dieMessage(`MDX AST plugin didn't work`)

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

  const removeEmptyDatas = (node: unknown): any =>
    removeEntries(node, [
      (key, value) => key === 'data' && Object.entries(value).length === 0,
    ])

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
    removeEmptyDatas,
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
    parseMdxNodes,
  )

  // TODO: explicitly set the type of constant to reference the type below to not double the amount of types
  // TODO: generate types as well as consts

  yield* fs.writeFileString('./mdast.json', JSON.stringify(mdast, void 0, 2))

  const formatCommentsByPrettier = (code: string) =>
    Effect.promise(() =>
      prettier.format(code, {
        parser: 'typescript',
        plugins: ['prettier-plugin-jsdoc'],
        printWidth: 80,
        jsdocPrintWidth: 80,
        jsdocDescriptionWithDot: true,
        jsdocEmptyCommentStrategy: 'remove',
      }),
    )

  const report: any = { main: [] } as any

  yield* fs.remove('./generated', { force: true, recursive: true })
  yield* fs.makeDirectory('./generated')
  let cursor = report as any
  let subcategoriesStack: string[] = []
  // TODO: solve this shit:
  // > [!NOTE]

  for (const element of (cleaned as any).children) {
    if (element?.value?.trim?.() === '') continue
    if (element.tagName === 'h2' || element.tagName === 'h3') {
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

    if (element?.type === 'table 6' || element?.type === 'table 3') {
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
      console.error(element)
      throw new Error('wtf. likely incompletely parsed object')
    }

    cursor.main.push(element.value)
  }

  yield* fs.writeFileString('./report.json', JSON.stringify(report, void 0, 2))

  const walk: (
    node: any,
    nodeName: string,
    stack?: string[] | undefined,
  ) => Effect.Effect<void, never, Scope.Scope> = Effect.fn(function* (
    node: any,
    nodeName: string,
    stack: string[] = [],
  ) {
    const isLeaf = !('subcategories' in node)

    if (isLeaf) {
      const dirPath = path.join('./generated', ...stack)

      yield* fs.makeDirectory(dirPath, { recursive: true })
      const tsdocString = renderMainFileTsDocString(node.main, nodeName)
      let additional = ''

      if (typeof node.rows[0] === 'string') {
        additional = node.rows.join('\n\n')
      }

      const tsFilePath = path.join(dirPath, nodeName + '.ts')
      const code = yield* formatCommentsByPrettier(
        tsdocString + '\n' + additional,
      )

      yield* fs.writeFileString(tsFilePath, code)
    } else {
      const dirPath = path.join('./generated', ...stack, nodeName)
      yield* fs.makeDirectory(dirPath, { recursive: true })
      const tsFilePath = path.join(dirPath, 'index.ts')

      let indexFileBody = ''

      for (const [subNodeName, subNode] of Record.toEntries<string, any>(
        node.subcategories,
      )) {
        yield* walk(subNode, subNodeName, [...stack, nodeName])
        indexFileBody += `
        ${renderMainModuleTsDocString(subNode.main, subNodeName)}export * as ${subNodeName} from './${'subcategories' in subNode ? `${subNodeName}/index.ts` : `${subNodeName}.ts`}'

        `
      }

      const tsdocString = renderMainFileTsDocString(node.main, nodeName)
      const code = yield* formatCommentsByPrettier(tsdocString + indexFileBody)

      yield* fs.writeFileString(tsFilePath, code)
    }
  }, Effect.orDie)

  yield* walk(report, 'EventDotKey').pipe(Effect.scoped)
  yield* fixGeneratedFolder

  yield* Effect.log('✓ All done! Successfully updated index.ts.')
}).pipe(
  Effect.catchAllCause(error => Console.error(error)),
  Effect.provide(AppLayer),
  Effect.runPromise,
)

interface LocalCacheError {
  _tag: 'LocalCacheError'
  cause: unknown
  message: string
}
