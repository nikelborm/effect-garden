#!/usr/bin/env bun

import { defaultMdxConfigLayer, MdxService, MdxServiceLive } from 'effect-mdx'
import prettier from 'prettier'
import { match, P } from 'ts-pattern'
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

import { renderMainTsDoc } from './renderMainTsDoc.ts'

interface Key {
  value: string
  description: string
}

const MDN_URL_BASE = 'https://developer.mozilla.org'

const MDN_URL = `${MDN_URL_BASE}/en-US/docs/Web/API/KeyboardEvent/key/Key_Values`

// https://github.com/w3c/uievents-key/
const MDN_MDX_URL =
  'https://raw.githubusercontent.com/mdn/content/refs/heads/main/files/en-us/web/api/ui_events/keyboard_event_key_values/index.md'

// Extract key name from strings like "LaunchCalculator" [5]
const _keyValueRegex = /"([a-z0-9_]+)"/i

// const parseKeys = (html: string) =>
//   Effect.try(() => {
//     const $ = cheerio.load(html)
//     const keys: Key[] = []

//     $('tr').each((_, element) => {
//       const value = $(element).find('td:nth-child(1) code').text()
//       const description = $(element).find('td:nth-child(2)').text()

//       const matches = keyValueRegex.exec(value)
//       const extractedValue = matches ? matches[1] : undefined

//       if (extractedValue && description) {
//         keys.push({ value: extractedValue, description: description })
//       }
//     })

//     return keys
//   })

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

const compactCleanup = (value: any) =>
  value.children
    .map((child: any) => child.value)
    .join(' ')
    .replaceAll(/[\s]+/g, ' ')
    .trim()
    .replaceAll(/ ([.?,:;)])/g, '$1')
    .replaceAll('>', '\n>')

const parseMdxNodes = (
  node:
    | {
        type: string
      }
    | {
        type: string
      }[],
):
  | {
      type: string
    }
  | {
      type: string
    }[] =>
  match(node)
    .with(
      {
        type: 'mdxTextExpression',
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ExpressionStatement',
                expression: P.union(
                  {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'domxref' },
                    arguments: [
                      ...P.array({ type: 'Literal' }),
                      {
                        type: 'Literal',
                        value: P.select('domxrefArg', P.string),
                      },
                    ],
                  },
                  {
                    type: 'CallExpression',
                    callee: { type: 'Identifier', name: 'glossary' },
                    arguments: [
                      {
                        type: 'Literal',
                        value: P.select('glossaryArg', P.string),
                      },
                    ],
                  },
                ),
              },
            ],
          },
        },
      },
      selection => ({
        type: 'text',
        value: Object.values(selection)
          .filter(Boolean)
          .join(' ')
          .replaceAll(/[\s]+/g, ' ')
          .trim(),
      }),
    )
    .with(
      {
        type: 'mdxFlowExpression',
        data: {
          estree: {
            type: 'Program',
            body: [
              {
                type: 'ExpressionStatement',
                expression: {
                  type: 'CallExpression',
                  callee: { type: 'Identifier', name: 'DefaultAPISidebar' },
                  arguments: [{ type: 'Literal', value: P.select(P.string) }],
                },
              },
            ],
          },
        },
      },
      // I don't care about 'UI Events' string
      () => ({ type: 'text', value: '' }),
    )
    .with({ type: 'mdxTextExpression', value: 'deprecated_inline' }, () => ({
      type: 'text',
      value: 'deprecated',
    }))
    .with(
      {
        type: 'element',
        tagName: 'a',
        properties: { href: P.select('url', P.string) },
        children: [{ type: 'text', value: P.select('textAlias', P.string) }],
      },
      ({ textAlias, url }) => ({
        type: 'text',
        value: `[${textAlias}](${(url[0] === '#' ? new URL(url, MDN_URL) : url[0] === '/' ? new URL(url, MDN_URL_BASE) : new URL(url)).toString()})`,
      }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: 'a',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'href',
            value: P.select('url', P.string),
          },
        ],
        children: [{ type: 'text', value: P.select('textAlias', P.string) }],
      },
      ({ textAlias, url }) => ({
        type: 'text',
        value: `[${textAlias}](${(url[0] === '#' ? new URL(url, MDN_URL) : url[0] === '/' ? new URL(url, MDN_URL_BASE) : new URL(url)).toString()})`,
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'code',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', value: '`' + value + '`' }),
    )
    // @ts-expect-error
    .with({ name: 'br' }, () => ({ type: 'text', value: ' ' }))
    .with(
      {
        type: 'mdxJsxTextElement',
        name: P.union('kbd', 'code'),
        attributes: [],
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        value:
          '`' +
          value.children
            .flatMap(child => child.value.split('\n'))
            .map(e => e.trim())
            .filter(Boolean)
            .join('') +
          '`',
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'ul',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        value: value.children
          .map(child => child.value.trim())
          .filter(Boolean)
          .map(e => '- ' + e)
          .join('\n'),
      }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: 'strong',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', value: '**' + value + '**' }),
    )
    .with(
      {
        type: 'element',
        tagName: 'strong',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', value: '**' + value + '**' }),
    )
    .with(
      {
        type: 'element',
        tagName: 'em',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', value: '*' + value + '*' }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: 'em',
        attributes: [],
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', value: '*' + value + '*' }),
    )
    .with(
      {
        type: 'element',
        tagName: 'h2',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', tagName: 'h2', value: '## ' + value }),
    )
    .with(
      {
        type: 'element',
        tagName: 'h3',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({ type: 'text', tagName: 'h3', value: '### ' + value }),
    )
    .with(
      {
        type: 'element',
        tagName: 'li',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({ type: 'text', tagName: 'li', value: compactCleanup(value) }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'div',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({ type: 'text', name: 'div', value: compactCleanup(value) }),
    )
    .with(
      {
        type: 'element',
        tagName: 'p',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({ type: 'text', tagName: 'p', value: compactCleanup(value) }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'p',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({ type: 'text', name: 'p', value: compactCleanup(value) }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'td',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({ type: 'text', name: 'td', value: compactCleanup(value) }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        attributes: P.array({
          type: P.string,
          name: P.string,
          value: P.string,
        }),
      },
      value => ({
        ...value,
        attributes: Object.fromEntries(
          value.attributes.map(e => [e.name, e.value]),
        ),
      }),
    )
    .with(
      { type: 'mdxJsxFlowElement', attributes: { class: 'no-markdown' } },
      ({ attributes, ...value }) => value,
    )

    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'table',
        children: [
          { name: 'thead' },
          {
            name: 'tbody',
            children: P.select(
              P.array({
                type: 'mdxJsxFlowElement',
                name: 'tr',
                children: [
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                ],
              }),
            ),
          },
        ],
      },
      value => ({
        type: 'table 3',
        rows: value.map(
          ({
            children: [
              { value: compositionEventDataValue },
              { value: symbol },
              { value: comments },
            ],
          }) => {
            const {
              groups: { name },
            } = compositionEventDataValue.match(
              /`GDK_KEY_dead_(?<name>\w+)`/,
            ) as any as { groups: { name: string } }

            return EString.stripMargin(`|/**
            | * One of the possible {@linkcode GlobalEventHandlersEventMap.compositionupdate|compositionupdate} event's data property
            | *
            | * ${comments}
            | *
            | * ${compositionEventDataValue}
            | *
            | * @generated
            | */
            |export type ${name} = "${symbol}"
            |
            |/**
            | * One of the possible {@linkcode GlobalEventHandlersEventMap.compositionupdate|compositionupdate} event's data property
            | *
            | * ${comments}
            | *
            | * ${compositionEventDataValue}
            | *
            | * @generated
            | */
            |export const ${name}: ${name} = "${symbol}"
            |`)
          },
        ),
      }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'table',
        children: [
          { name: 'thead' },
          {
            name: 'tbody',
            children: P.select(
              P.array({
                type: 'mdxJsxFlowElement',
                name: 'tr',
                children: [
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                  { type: 'text', name: 'td', value: P.string },
                ],
              }),
            ),
          },
        ],
      },
      value => ({
        type: 'table 3',
        rows: value.map(
          ({
            children: [
              { value: keyValue },
              { value: description },
              { value: windowsVirtualKeyCode },
              { value: macVirtualKeyCode },
              { value: linuxVirtualKeyCode },
              { value: androidVirtualKeyCode },
            ],
          }) => ({
            keyValue,
            description,
            windowsVirtualKeyCode,
            macVirtualKeyCode,
            linuxVirtualKeyCode,
            androidVirtualKeyCode,
          }),
        ),
      }),
    )
    .with(P.array({ type: P.string }), values =>
      values.map(e => parseMdxNodes(e) as { type: string }),
    )
    .with(P.record(P.string, P.any), values =>
      Object.fromEntries(
        Object.entries(values).map(
          ([key, value]) => [key as any, parseMdxNodes(value as any)] as const,
        ),
      ),
    )
    .otherwise(() => node)

//   [
//     '/**',
//     ' * @file',
//     ' * @generated',
//     ' * Here are listed all non-printable string values one can expect from $event.key.',
//     ' * For example, values like "CapsLock", "Backspace", and "AudioVolumeMute" are present,',
//     ' * but values like "a", "A", "#", "é", or "¿" are not.',
//     ' * Auto generated from MDN: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys',
//     ' */\n',

//     keys.map(formatKeyEntry).join('\n\n'),

//     '',
//   ].join('\n')

const _writeEnumFile = (content: string) =>
  Effect.flatMap(FileSystem.FileSystem, fs =>
    fs.writeFileString('./index.ts', content),
  )

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

  const extractValuesAtKeys = (node: unknown, keys: string[]): any[] =>
    Array.isArray(node)
      ? node.flatMap(e => extractValuesAtKeys(e, keys))
      : typeof node === 'object' && node !== null
        ? Object.entries(node).flatMap(([key, value]) =>
            (keys.includes(key) ? [value] : []).concat(
              extractValuesAtKeys(value, keys),
            ),
          )
        : []

  const extractTypes = (node: unknown): string[] =>
    extractValuesAtKeys(node, ['type'])

  const collectNodesOfCertainType = (
    node: unknown,
    targetTypes: string[],
  ): { type: string }[] =>
    Array.isArray(node)
      ? node.flatMap(e => collectNodesOfCertainType(e, targetTypes))
      : typeof node === 'object' && node !== null
        ? ('type' in node &&
          typeof node.type === 'string' &&
          targetTypes.includes(node.type)
            ? [node as { type: string }]
            : []
          ).concat(collectNodesOfCertainType(Object.values(node), targetTypes))
        : []

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

  yield* fs.writeFileString(
    path.join('./generated', './report.json'),
    JSON.stringify(report, void 0, 2),
  )

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
      const tsdocString = renderMainTsDoc(node.main)
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
        indexFileBody += `\nexport * as ${subNodeName} from './${'subcategories' in subNode ? `${subNodeName}/index.ts` : `${subNodeName}.ts`}'`
      }

      const tsdocString = renderMainTsDoc(node.main)
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
