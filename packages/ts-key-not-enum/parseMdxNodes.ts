import { match, P } from 'ts-pattern'

import * as EString from 'effect/String'

export const MDN_URL_BASE = 'https://developer.mozilla.org'

export const MDN_URL = `${MDN_URL_BASE}/en-US/docs/Web/API/KeyboardEvent/key/Key_Values`

const compactCleanup = (value: any) =>
  value.children
    .map((child: any) => child.value)
    .join(' ')
    .replaceAll(/[\s]+/g, ' ')
    .trim()
    .replaceAll(/ ([.?,:;)])/g, '$1')
    .replaceAll('>', '\n>')

export const parseMdxNodes = (
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
