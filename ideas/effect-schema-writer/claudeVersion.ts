import * as FileSystem from '@effect/platform/FileSystem'
import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as Console from 'effect/Console'
import * as Effect from 'effect/Effect'
import * as Match from 'effect/Match'

// ---------------------------------------------------------------------------
// IR
// ---------------------------------------------------------------------------

type SchemaIR =
  | { readonly _tag: 'Str' }
  | { readonly _tag: 'Num' }
  | { readonly _tag: 'Bool' }
  | { readonly _tag: 'Null' }
  | { readonly _tag: 'Unknown' }
  | { readonly _tag: 'Ref'; readonly name: string }
  | { readonly _tag: 'Struct'; readonly fields: Record<string, FieldIR> }
  | { readonly _tag: 'Union'; readonly members: readonly SchemaIR[] }

type FieldIR = { readonly schema: SchemaIR; readonly optional: boolean }

// ---------------------------------------------------------------------------
// Component registry
// ---------------------------------------------------------------------------

type Registry = {
  byKey: Map<string, string> // serialized → component name
  ordered: Array<{ name: string; ir: SchemaIR }> // insertion-ordered components
  counter: number
}

const makeRegistry = (): Registry => ({
  byKey: new Map(),
  ordered: [],
  counter: 0,
})

// Serialize IR to a canonical string for structural deduplication.
const serialize = (ir: SchemaIR): string =>
  Match.value(ir).pipe(
    Match.tag('Str', () => 'S'),
    Match.tag('Num', () => 'N'),
    Match.tag('Bool', () => 'B'),
    Match.tag('Null', () => '0'),
    Match.tag('Unknown', () => '?'),
    Match.tag('Ref', ({ name }) => `@${name}`),
    Match.tag(
      'Union',
      ({ members }) => `U(${[...members].map(serialize).sort().join(',')})`,
    ),
    Match.tag('Struct', ({ fields }) => {
      const parts = Object.entries(fields)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, f]) => `${k}${f.optional ? '?' : ''}:${serialize(f.schema)}`)
      return `{${parts.join(';')}}`
    }),
    Match.exhaustive,
  )

// Register a struct/union as a component; return a Ref to it.
// Primitives are returned as-is — no point extracting Schema.String into a variable.
const register = (ir: SchemaIR, registry: Registry): SchemaIR => {
  if (ir._tag !== 'Struct' && ir._tag !== 'Union') return ir
  const key = serialize(ir)
  const existing = registry.byKey.get(key)
  if (existing !== undefined) return { _tag: 'Ref', name: existing }
  const name = `component${++registry.counter}`
  registry.byKey.set(key, name)
  registry.ordered.push({ name, ir })
  return { _tag: 'Ref', name }
}

// ---------------------------------------------------------------------------
// Merging (for fields that appear across multiple array elements)
// ---------------------------------------------------------------------------

const schemaEq = (a: SchemaIR, b: SchemaIR): boolean => {
  if (a._tag !== b._tag) return false
  if (a._tag === 'Ref' && b._tag === 'Ref') return a.name === b.name
  if (a._tag === 'Struct' && b._tag === 'Struct') {
    const ak = Object.keys(a.fields).sort()
    const bk = Object.keys(b.fields).sort()
    if (ak.join(',') !== bk.join(',')) return false
    return ak.every(
      k =>
        a.fields[k]!.optional === b.fields[k]!.optional &&
        schemaEq(a.fields[k]!.schema, b.fields[k]!.schema),
    )
  }
  if (a._tag === 'Union' && b._tag === 'Union') {
    return (
      a.members.length === b.members.length &&
      a.members.every((m, i) => schemaEq(m, b.members[i]!))
    )
  }
  return true
}

const dedup = (schemas: SchemaIR[]): SchemaIR[] =>
  schemas.reduce<SchemaIR[]>(
    (acc, s) => (acc.some(a => schemaEq(a, s)) ? acc : [...acc, s]),
    [],
  )

const mergeTypes = (schemas: SchemaIR[]): SchemaIR => {
  const unique = dedup(schemas)
  if (unique.length === 1) return unique[0]!
  const nonNull = unique.filter(s => s._tag !== 'Null')
  const hasNull = nonNull.length < unique.length
  if (nonNull.length === 0) return { _tag: 'Null' }
  const core: SchemaIR =
    nonNull.length === 1 ? nonNull[0]! : { _tag: 'Union', members: nonNull }
  return hasNull ? { _tag: 'Union', members: [core, { _tag: 'Null' }] } : core
}

// ---------------------------------------------------------------------------
// Inference — walks to leaves, extracts components at every array boundary
// ---------------------------------------------------------------------------

const processValue = (value: unknown, registry: Registry): SchemaIR => {
  if (value === null) return { _tag: 'Null' }
  if (typeof value === 'string') return { _tag: 'Str' }
  if (typeof value === 'number') return { _tag: 'Num' }
  if (typeof value === 'boolean') return { _tag: 'Bool' }
  if (Array.isArray(value)) return processArray(value, registry)
  if (typeof value === 'object')
    return processObject(value as Record<string, unknown>, registry)
  return { _tag: 'Unknown' }
}

const processObject = (
  obj: Record<string, unknown>,
  registry: Registry,
): SchemaIR => ({
  _tag: 'Struct',
  fields: Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      { schema: processValue(v, registry), optional: false },
    ]),
  ),
})

// Array boundary: collect all element keys, merge into one struct, register as component.
const processArray = (arr: unknown[], registry: Registry): SchemaIR => {
  const keyValues = new Map<string, unknown[]>()
  let objectCount = 0

  for (const item of arr) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      objectCount++
      for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
        const bucket = keyValues.get(k) ?? []
        bucket.push(v)
        keyValues.set(k, bucket)
      }
    }
  }

  if (objectCount === 0) {
    // Array of primitives or nested arrays — merge element types and register.
    const elementTypes = arr.map(item => processValue(item, registry))
    return register(mergeTypes(elementTypes), registry)
  }

  const fields: Record<string, FieldIR> = {}
  for (const [key, values] of keyValues) {
    fields[key] = {
      schema: mergeTypes(values.map(v => processValue(v, registry))),
      optional: values.length < objectCount,
    }
  }

  return register({ _tag: 'Struct', fields }, registry)
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

const isIdentifier = (s: string) => /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s)

const genSchema = (ir: SchemaIR, depth = 0): string => {
  const pad = '  '.repeat(depth)

  return Match.value(ir).pipe(
    Match.tag('Str', () => 'Schema.String'),
    Match.tag('Num', () => 'Schema.Number'),
    Match.tag('Bool', () => 'Schema.Boolean'),
    Match.tag('Null', () => 'Schema.Null'),
    Match.tag('Unknown', () => 'Schema.Unknown'),
    Match.tag('Ref', ({ name }) => name),
    Match.tag(
      'Union',
      ({ members }) =>
        `Schema.Union(${members.map(m => genSchema(m, depth)).join(', ')})`,
    ),
    Match.tag('Struct', ({ fields }) => {
      const entries = Object.entries(fields)
      if (entries.length === 0) return 'Schema.Struct({})'
      const lines = entries.map(([k, f]) => {
        const inner = genSchema(f.schema, depth + 1)
        const value = f.optional ? `Schema.optional(${inner})` : inner
        const key = isIdentifier(k) ? k : JSON.stringify(k)
        return `${pad}  ${key}: ${value}`
      })
      return `Schema.Struct({\n${lines.join(',\n')}\n${pad}})`
    }),
    Match.exhaustive,
  )
}

const genCode = (rootIR: SchemaIR, registry: Registry): string => {
  const lines: string[] = [`import * as Schema from 'effect/Schema'`, ``]
  for (const { name, ir } of registry.ordered) {
    lines.push(`export const ${name} = ${genSchema(ir)}`, ``)
  }
  lines.push(`export const Root = ${genSchema(rootIR)}`, ``)
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = Effect.gen(function* () {
  const [, , input, output] = process.argv

  if (!input || !output) {
    yield* Console.error('Usage: bun index.ts <input.json> <output.ts>')
    return yield* Effect.fail(new Error('Missing arguments'))
  }

  const fs = yield* FileSystem.FileSystem

  const raw = yield* fs.readFileString(input)
  const json = yield* Effect.try({
    try: () => JSON.parse(raw) as unknown,
    catch: e => new Error(`JSON parse error: ${e}`),
  })

  const registry = makeRegistry()
  const rootIR = processValue(json, registry)
  const code = genCode(rootIR, registry)

  yield* fs.writeFileString(output, code)
  yield* Console.log(`Wrote ${registry.counter} components + Root to ${output}`)
})

BunRuntime.runMain(main.pipe(Effect.provide(BunFileSystem.layer)))
