import { readFile, writeFile } from 'node:fs/promises'
import { $ } from 'bun'

import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

const simpleSchemas = new Set<Schema.Schema.Any>([
  Schema.String,
  Schema.Null,
  Schema.Boolean,
  Schema.JsonNumber,
])

const toKey = (schema: Schema.Schema.Any) => {
  // TODO: test if canonicalization is needed here
  const str = schema.toString()
  if (!str) throw new Error('wtf failed to canonicalize')
  return str
}

type FieldExamples = Map<string, Set<string | number>>
type Subtree = {
  schema: Schema.Schema.AnyNoContext
  code: () => string
  fieldExamples?: FieldExamples
}

const data = JSON.parse(await readFile('data/sample1.json', 'utf-8'))

const stringLeaf = { schema: Schema.String, code: () => 'Schema.String' }
const booleanLeaf = { schema: Schema.Boolean, code: () => 'Schema.Boolean' }
const numberLeaf = {
  schema: Schema.JsonNumber,
  code: () => 'Schema.JsonNumber',
}
const nullLeaf = { schema: Schema.Null, code: () => 'Schema.Null' }

const walkRoot = (obj: unknown, options?: { skipFields?: string[] }) => {
  const skipFields = new Set(options?.skipFields ?? [])

  const registry = new Map<
    string,
    { id: number; subtree: Subtree; dependenciesMap: Map<number, number> }
  >()

  const updateRegistry = (
    subtree: Subtree,
    dependencies: Schema.Schema.Any[],
  ) => {
    const key = toKey(subtree.schema)

    const oldval = registry.get(key)
    if (oldval) {
      const existingMap = oldval.subtree.fieldExamples
      if (subtree.fieldExamples && existingMap) {
        for (const [field, incoming] of subtree.fieldExamples) {
          const existing = existingMap.get(field) ?? new Set()
          existingMap.set(field, existing)
          /* if (existing.size < 5) */ for (const ex of incoming)
            existing.add(ex)
        }
      }
      return oldval.subtree
    }

    const dependenciesMap = new Map<number, number>()

    for (const dep of dependencies) {
      if (simpleSchemas.has(dep)) continue

      const depRegistryValue = registry.get(toKey(dep))

      if (!depRegistryValue)
        throw new Error(
          'invariant failed. depRegistryValue should be in the registry',
        )

      const { id } = depRegistryValue
      dependenciesMap.set(id, (dependenciesMap.get(id) ?? 0) + 1)
    }

    registry.set(key, { id: registry.size, subtree, dependenciesMap })
    return subtree
  }

  const walk = (something: unknown): Subtree => {
    if (Array.isArray(something)) {
      const subtrees: Subtree[] = []
      const unionMembers = new Set<Schema.Schema.AnyNoContext>()

      for (const child of something) {
        const subtree = walk(child)
        subtrees.push(subtree)
        unionMembers.add(subtree.schema)
      }

      const schema = Schema.Array(Schema.Union(...unionMembers))

      const code = () => {
        const members = [
          ...new Set(
            subtrees.map(subtree => {
              const val = registry.get(toKey(subtree.schema))
              return val ? 'Part' + val.id : subtree.code()
            }),
          ),
        ]

        return members.length === 1
          ? 'Schema.Array(' + members[0] + ')'
          : 'Schema.Array(Schema.Union(' + members.join(', ') + '))'
      }

      return updateRegistry({ schema, code }, [...unionMembers])
    }

    if (typeof something === 'string') return stringLeaf
    if (typeof something === 'boolean') return booleanLeaf
    if (typeof something === 'number') return numberLeaf
    if (something === null) return nullLeaf

    const fieldExamples: FieldExamples = new Map()
    const structTree = Record.map(
      Record.filter(
        something as Record<string, unknown>,
        (_, key) => !skipFields.has(key),
      ),
      (value, key) => {
        if (typeof value === 'string' || typeof value === 'number')
          fieldExamples.set(key, new Set([value]))
        return walk(value)
      },
    )

    const structFields = Record.map(structTree, t => t.schema)
    const schema = Schema.Struct(structFields)

    const code = () =>
      `Schema.Struct({` +
      Record.toEntries(structTree)
        .map(([key, subtree]) => {
          const registryRecord = registry.get(toKey(subtree.schema))
          if (registryRecord) return `"${key}": Part${registryRecord.id}`
          let schemaCode = subtree.code()

          const examples = [...(fieldExamples.get(key) ?? [])]
          if (examples.length)
            schemaCode += `.annotations(${JSON.stringify({ examples })})`

          return `"${key}": ${schemaCode}`
        })
        .join(',\n') +
      `})`

    return updateRegistry(
      { schema, code, fieldExamples },
      Record.values(structFields),
    )
  }

  return { registry, tree: walk(obj) }
}

const { registry, tree: rootNode } = walkRoot(data, {
  skipFields: [
    'trackingParams',
    'iconType',
    'clickTrackingParams',
    'serializedContextData',
    'feedbackEndpoint',
    'playIcon',
    'pauseIcon',
    'iconColor',
    'backgroundColor',
    'activeBackgroundColor',
    'loadingIndicatorColor',
    'playingIcon',
    'iconLoadingColor',
    'activeScaleFactor',
    'buttonSize',
    'playerParams',
    'contentPosition',
    'queueInsertPosition',
    'loggingContext',
    'isDisabled',
    'displayStyle',
    'serviceTrackingParams',
    'style',
    'shareEntityEndpoint',
    'displayPriority',
    'size',
    'rippleTarget',
    'addToToastAction',
    'background',
    'icon',
    'accessibility',
    'accessibilityPlayData',
    'accessibilityPauseData',
    'accessibilityData',
    'signInEndpoint',
    'defaultIcon',
    'toggledIcon',
    'toggleMenuServiceItemRenderer',
    'likeStatus',
    'likesAllowed',
    'dislikeNavigationEndpoint',
    'likeCommand',
    'multiSelectCheckbox',
    'likeButtonRenderer',
    'shelfDivider',
    'contentsMultiSelectable',
    'isToggled',
    'toggleButtonRenderer',
    'siteName',
    'appName',
  ],
})

// they're already sorted, and we make one pass to delete siblingless nodes
for (const [childKey, child] of registry) {
  const parents = [...registry].flatMap(([, parent]) => {
    const count = parent.dependenciesMap.get(child.id)
    return count !== undefined ? [[parent, count] as const] : []
  })

  if (parents.reduce((sum, [, count]) => sum + count, 0) !== 1) continue

  const parent = parents[0]?.[0]
  if (!parent) throw new Error('assertion failed. parent not found')

  for (const [childDependencyId, count] of child.dependenciesMap)
    parent.dependenciesMap.set(
      childDependencyId,
      (parent.dependenciesMap.get(childDependencyId) ?? 0) + count,
    )
  // biome-ignore lint/plugin/drizzle: it's not drizzle
  parent.dependenciesMap.delete(child.id)
  // biome-ignore lint/plugin/drizzle: it's not drizzle
  registry.delete(childKey)
}

const file =
  'import * as Schema from "effect/Schema"\n\n' +
  registry
    .values()
    .toArray()
    .sort((a, b) => a.id - b.id)
    .slice(0, -1)
    .map(({ id, subtree }) => `const Part${id} = ${subtree.code()}`)
    .join('\n\n') +
  '\n\n' +
  `export const MainSchema = ${rootNode.code()}`

await writeFile('./generated/experiment1_sample_schema.ts', file)

await $`bunx biome format --fix`
await $`bunx tsgo --noEmit`

const { MainSchema } = await import('./generated/experiment1_sample_schema.ts')

// sanity check of the resulted schema
Schema.decodeUnknownSync(MainSchema, {
  exact: true,
  // onExcessProperty: 'error',
})(data)

console.log('done')
