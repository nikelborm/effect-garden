import { nodeTypes } from '@mdx-js/mdx'
import matter from 'gray-matter'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import type { Node } from 'unist'

import * as Effect from 'effect/Effect'

// Paragraph unraveling, trimmed down from `remarkMarkAndUnravel`
// in `@mdx-js/mdx` (which also tags explicit JSX, something the
// downstream cleanup strips anyway): a paragraph holding nothing but
// JSX and expressions (such as a lone `<kbd>` or a table cell) is
// replaced by its children, promoted from inline to flow nodes.
const unravelMdxParagraphs =
  () =>
  (tree: Node): undefined => {
    const visit = (parent: { children: Array<Node> }): void => {
      const { children } = parent

      for (const node of children) {
        if (
          'children' in node &&
          Array.isArray((node as { children: unknown }).children)
        ) {
          visit(node as unknown as { children: Array<Node> })
        }
      }

      for (let index = 0; index < children.length; index++) {
        const node = children[index] as Node & { children?: Array<Node> }
        if (node.type !== 'paragraph' || !node.children) continue

        const allJsxOrWhitespace =
          node.children.length > 0 &&
          node.children.every(
            (child) =>
              child.type === 'mdxJsxTextElement' ||
              child.type === 'mdxTextExpression' ||
              (child.type === 'text' &&
                /^[\t\n\f\r ]*$/.test(
                  (child as unknown as { value: string }).value,
                )),
          )
        if (!allJsxOrWhitespace) continue

        const lifted: Array<Node> = []
        for (const child of node.children) {
          if (child.type === 'mdxJsxTextElement') {
            child.type = 'mdxJsxFlowElement'
            lifted.push(child)
          } else if (child.type === 'mdxTextExpression') {
            child.type = 'mdxFlowExpression'
            lifted.push(child)
          } else if (
            !/^[\t\r\n ]+$/.test((child as unknown as { value: string }).value)
          ) {
            lifted.push(child)
          }
        }
        children.splice(index, 1, ...lifted)
      }
    }

    visit(tree as unknown as { children: Array<Node> })
    return undefined
  }

// The remark → rehype segment of the MDX pipeline
// (see `createProcessor` in `@mdx-js/mdx`), run directly instead of
// smuggling the tree out of `compile` with a probe plugin.
// See https://github.com/PaulJPhilp/effect-mdx/issues/3
const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(unravelMdxParagraphs)
  .use(remarkRehype, {
    allowDangerousHtml: true,
    passThrough: [...nodeTypes],
  })

export const compileMdx = (mdxContent: string): Effect.Effect<Node, Error> =>
  Effect.tryPromise({
    try: () => {
      const { content: body } = matter(mdxContent)
      return processor.run(processor.parse(body))
    },
    catch: (cause) =>
      new Error(
        `Failed to compile MDX: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      ),
  })
