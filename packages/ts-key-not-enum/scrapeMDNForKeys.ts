#!/usr/bin/env bun

import { DateTime, String as EString } from 'effect'
import { defaultMdxConfigLayer, MdxService, MdxServiceLive } from 'effect-mdx'
import { match, P } from 'ts-pattern'
import type { Transformer } from 'unified'
import type { Node } from 'unist'

import {
  FetchHttpClient,
  FileSystem,
  HttpClient,
  type HttpClientError,
  Path,
} from '@effect/platform'
import { KiB } from '@effect/platform/FileSystem'
import { BunFileSystem, BunPath } from '@effect/platform-bun'
import * as EArray from 'effect/Array'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'

interface Key {
  value: string
  description: string
}

const MDN_URL =
  'https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys'

const MDN_MDX_URL =
  'https://raw.githubusercontent.com/mdn/content/refs/heads/main/files/en-us/web/api/ui_events/keyboard_event_key_values/index.md'

// Extract key name from strings like "LaunchCalculator" [5]
const keyValueRegex = /"([a-z0-9_]+)"/i

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

const removeDuplicates = (keys: Key[]) =>
  EArray.dedupeWith<Key>(
    EArray.sort(keys, OrderKey),
    (a, b) => a.value === b.value,
  )

const formatKeyEntry = ({ value, description }: Key) => {
  let formattedDescription: string

  if (value === 'Symbol') value = 'SymbolModifier'
  if (value === '0') value = 'Zero'

  if (description.includes('\n')) {
    formattedDescription = [
      '/**',
      ...description
        .trim()
        .split(/\n\s*/)
        .map(s => ` * ${s.trim()}`),
      ' */',
    ].join('\n')
  } else {
    formattedDescription = `/** ${description} */`
  }

  return `${formattedDescription}\nexport const ${value} = '${value}';`
}

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
        transformationLabel: 'mdxTextExpression',
        value: Object.values(selection).filter(Boolean).join(' '),
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
      value => ({
        type: 'text',
        transformationLabel: 'mdxFlowExpression',
        value,
      }),
    )
    .with({ type: 'mdxTextExpression', value: 'deprecated_inline' }, () => ({
      type: 'text',
      transformationLabel: 'mdxTextExpression',
      value: 'deprecated',
    }))
    .with(
      {
        type: 'element',
        tagName: 'a',
        properties: P.optional({ href: P.select('url', P.string) }),
        children: [{ type: 'text', value: P.select('textAlias', P.string) }],
      },
      ({ textAlias, url }) => ({
        type: 'text',
        transformationLabel: 'a-element-primitive',
        value: `[${textAlias}](${url ?? 'https://www.google.com/search?q=' + textAlias})`,
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
        transformationLabel: 'a-mdxJsxTextElement-primitive',
        value: `[${textAlias}](${url})`,
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'code',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        transformationLabel: 'code-element-primitive',
        value: '`' + value + '`',
      }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: 'br',
        attributes: [],
        children: [],
      },
      () => ({
        type: 'text',
        transformationLabel: 'br-mdxJsxTextElement-primitive',
        value: '\n',
      }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: P.union('kbd', 'code'),
        attributes: [],
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        transformationLabel: 'kbd/code-mdxJsxTextElement-primitive',
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
        type: 'mdxJsxTextElement',
        name: 'strong',
        attributes: [],
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        transformationLabel: 'strong-mdxJsxTextElement-primitive',
        value: '**' + value + '**',
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'strong',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        transformationLabel: 'strong-mdxJsxTextElement-primitive',
        value: '**' + value + '**',
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'em',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        transformationLabel: 'em-element-primitive',
        value: '*' + value + '*',
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'h2',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        tagName: 'h2',
        transformationLabel: 'h2-element-primitive',
        value: '## ' + value,
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'h3',
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        tagName: 'h3',
        transformationLabel: 'h3-element-primitive',
        value: '### ' + value,
      }),
    )
    .with(
      {
        type: 'mdxJsxTextElement',
        name: 'em',
        attributes: [],
        children: [{ type: 'text', value: P.select() }],
      },
      value => ({
        type: 'text',
        transformationLabel: 'em-element-primitive',
        value: '*' + value + '*',
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'li',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        tagName: 'li',
        transformationLabel: 'li-stack-children',
        value: value.children.map(child => child.value).join(''),
      }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'div',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        name: 'div',
        transformationLabel: 'div-stack-children',
        value: value.children.map(child => child.value).join(''),
      }),
    )
    .with(
      {
        type: 'element',
        tagName: 'p',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        tagName: 'p',
        transformationLabel: 'p-stack-children',
        value: value.children.map(child => child.value).join('\n'),
      }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'p',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        name: 'p',
        transformationLabel: 'p-compact',
        value: value.children.map(child => child.value).join('\n'),
      }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'td',
        children: P.array({ type: 'text', value: P.string }),
      },
      value => ({
        type: 'text',
        name: 'td',
        transformationLabel: 'td-compact',
        value: value.children.map(child => child.value).join(''),
      }),
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
        name: 'tr',

        children: [
          { value: P.select('keyValue') },
          { value: P.select('description') },
          { value: P.select('windowsVirtualKeyCode') },
          { value: P.select('macVirtualKeyCode') },
          { value: P.select('linuxVirtualKeyCode') },
          { value: P.select('androidVirtualKeyCode') },
        ],
      },
      value => ({ type: 'full width row', value }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'tr',
        children: [
          { value: P.select('compositionEventDataValue') },
          { value: P.select('symbol') },
          { value: P.select('comments') },
        ],
      },
      value => ({ type: 'row 3 width', value }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'table',
        children: [
          { name: 'thead' },
          {
            name: 'tbody',
            children: P.array({
              type: 'row 3 width',
              value: {
                compositionEventDataValue: P.string,
                symbol: P.string,
                comments: P.string,
              },
            }),
          },
        ],
      },
      value => ({
        type: 'table 3',
        rows: value.children[1].children.map(_ => _.value),
      }),
    )
    .with(
      {
        type: 'mdxJsxFlowElement',
        name: 'table',
        children: [
          { name: 'thead' },
          {
            type: 'mdxJsxFlowElement',
            name: 'tbody',
            children: P.array({
              type: 'full width row',
              value: {
                keyValue: P.string,
                description: P.string,
                windowsVirtualKeyCode: P.string,
                macVirtualKeyCode: P.string,
                linuxVirtualKeyCode: P.string,
                androidVirtualKeyCode: P.string,
              },
            }),
          },
        ],
      },
      value => ({
        type: 'table 6',
        rows: value.children[1].children.map(_ => _.value),
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

const generateEnumFile = (keys: Key[]) =>
  [
    '/**',
    ' * @file',
    ' * @generated',
    ' * Here are listed all non-printable string values one can expect from $event.key.',
    ' * For example, values like "CapsLock", "Backspace", and "AudioVolumeMute" are present,',
    ' * but values like "a", "A", "#", "é", or "¿" are not.',
    ' * Auto generated from MDN: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values#Speech_recognition_keys',
    ' */\n',

    keys.map(formatKeyEntry).join('\n\n'),

    '',
  ].join('\n')

const writeEnumFile = (content: string) =>
  Effect.flatMap(FileSystem.FileSystem, fs =>
    fs.writeFileString('./index.ts', content),
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
    process.env['HOME'] ?? '~',
    '.cache',
    'scrapeMDNForKeys',
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
      ? fs.readFileString(cacheFilePath).pipe(Effect.catchAll(makeCacheError))
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

  const logAstPlugin = (): Transformer => {
    return (tree, _file) => {
      mdast = tree
      return tree
    }
  }

  const parsedMdx = yield* service.compileMdx(mdxPageContent, {
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

  const extractUniqueTypes = (node: unknown) => [...new Set(extractTypes(node))]

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
      'properties',
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
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
    parseMdxNodes,
  )

  const report = {
    uniqueTypes: extractUniqueTypes(cleaned),
    // mdxTextExpressionNodes: collectNodesOfCertainType(
    //   cleaned,
    //   'mdxTextExpression',
    // ),
    // uniqueTypesOfMdxTextExpressionNodes: extractUniqueTypes(
    //   collectNodesOfCertainType(cleaned, 'mdxTextExpression'),
    // ),
    // parsed: collectNodesOfCertainType(cleaned, [
    //   // handled
    //   'mdxFlowExpression',
    //   'mdxTextExpression',
    //   'mdxJsxTextElement',
    //   'text',
    //   'element',

    //   // not handled
    //   // 'mdxJsxFlowElement',
    //   // 'mdxJsxAttribute',
    // ]).map(e => parseMdxNodes(e as any)),
    datas: [...new Set(collectNodesOfCertainType(cleaned, ['root']))].map(
      parseMdxNodes,
    ),
    // datas: [...new Set(extractValuesAtKeys(cleaned, ['class']))].map(
    //   parseMdxNodes,
    // ),
  }

  console.log(report)
  yield* fs.writeFileString('./mdast.json', JSON.stringify(mdast, void 0, 2))
  yield* fs.writeFileString('./report.json', JSON.stringify(report, void 0, 2))

  yield* Effect.log('✓ All done! Successfully updated index.ts.')
}).pipe(
  Effect.catchAll(error => Console.error(error)),
  Effect.provide(AppLayer),
  Effect.runPromise,
)

interface LocalCacheError {
  _tag: 'LocalCacheError'
  cause: unknown
  message: string
}
