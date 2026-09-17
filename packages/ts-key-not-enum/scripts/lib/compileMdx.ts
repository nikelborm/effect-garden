import path from 'node:path'

import { nodeTypes } from '@mdx-js/mdx'
import matter from 'gray-matter'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import type { Transformer } from 'unified'
import { unified } from 'unified'
import type { Node } from 'unist'

import * as Effect from 'effect/Effect'
import { pipe } from 'effect/Function'
import * as Struct from 'effect/Struct'

// a hack because I need this plugin but it's not in exports of the package
const { remarkMarkAndUnravel } = import.meta.require(
  path.join(
    path.dirname(import.meta.resolve('@mdx-js/mdx').slice(7)),
    './lib/plugin/remark-mark-and-unravel.js',
  ),
) as unknown as { remarkMarkAndUnravel: () => Transformer }

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkMarkAndUnravel)
  .use(remarkRehype, {
    allowDangerousHtml: true,
    passThrough: [...nodeTypes],
  })

export const compileMdx = (mdxContent: string): Effect.Effect<Node, Error> =>
  Effect.tryPromise({
    try: () => pipe(
      mdxContent,
      matter,
      Struct.get('content'),
      processor.parse.bind(processor),
      processor.run.bind(processor),
    ),
    catch: cause =>
      new Error(
        `Failed to compile MDX: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      ),
  })
