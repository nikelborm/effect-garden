import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const WEB_AUDIO_IDL_NAME = 'webaudio'

interface GeneratedWrapper {
  name: string
  content: string
  errors: string
}

async function generateEffectWrappers() {
  console.log('Fetching Web Audio IDL definitions...')

  const idl = await import('@webref/idl')
  const parsedFiles = await idl.parseAll()
  const webAudioIdl = parsedFiles[WEB_AUDIO_IDL_NAME]

  if (!webAudioIdl) {
    throw new Error(`Could not find ${WEB_AUDIO_IDL_NAME} IDL`)
  }

  console.log(`Found ${Object.keys(webAudioIdl).length} Web Audio definitions`)

  const alreadyImplemented = ['AudioBuffer', 'AudioContext']

  const generatedWrappers: GeneratedWrapper[] = []

  for (const [name, ast] of Object.entries(webAudioIdl)) {
    if (alreadyImplemented.includes(name)) {
      console.log(`Skipping already implemented: ${name}`)
      continue
    }

    const wrapper = generateWrapper(name, ast)
    if (wrapper) {
      generatedWrappers.push(wrapper)
      console.log(`Generated wrapper for: ${name}`)
    }
  }

  const outputDir = join(__dirname, '..', 'src', 'generated')

  for (const wrapper of generatedWrappers) {
    writeFileSync(join(outputDir, `E${wrapper.name}.ts`), wrapper.content)
    writeFileSync(join(outputDir, `E${wrapper.name}Errors.ts`), wrapper.errors)
  }

  const indexContent = generateIndex(generatedWrappers)
  writeFileSync(join(outputDir, 'index.ts'), indexContent)
  console.log(`Generated index.ts with ${generatedWrappers.length} exports`)
}

function generateWrapper(name: string, ast: any): GeneratedWrapper | null {
  if (ast.type !== 'interface') {
    return null
  }

  const interfaceName = ast.name
  const members = ast.members || []

  const readonlyProperties = members
    .filter((m: any) => m.type === 'attribute' && m.readonly)
    .map((m: any) => m.name.replace(/,/g, '_'))

  const content = `import * as Either from 'effect/Either'
import * as Equal from 'effect/Equal'
import * as Hash from 'effect/Hash'
import * as Inspectable from 'effect/Inspectable'
import * as Pipeable from 'effect/Pipeable'

const TypeId: unique symbol = Symbol.for("effect-web-audio/${interfaceName}")

export type TypeId = typeof TypeId

export interface E${interfaceName}
  extends Equal.Equal,
    Pipeable.Pipeable,
    Inspectable.Inspectable {
  readonly [TypeId]: TypeId
  readonly _tag: "${interfaceName}"
${readonlyProperties.map(p => `  readonly ${p}: unknown`).join('\n')}
}

interface E${interfaceName}Impl extends E${interfaceName} {
  readonly _${interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1)}: any
}

const Proto = {
  _tag: "${interfaceName}" as const,
  [TypeId]: TypeId,
  [Hash.symbol](this: E${interfaceName}Impl) {
    return Hash.random(assumeImpl(this)._${interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1)})
  },
  [Equal.symbol](that: Equal.Equal) {
    return this === that
  },
  pipe() {
    return Pipeable.pipeArguments(this, arguments)
  },
  toString() {
    return Inspectable.format(this.toJSON())
  },
  toJSON() {
    return { _id: "${interfaceName}" }
  },
  [Inspectable.NodeInspectSymbol]() {
    return this.toJSON()
  },
${readonlyProperties
  .map(
    p => `  get ${p}() {
    return assumeImpl(this)._${interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1)}.${p.replace(/_/g, ',')}
  }`,
  )
  .join(',\n')}
} as E${interfaceName}Impl

export function makeImpl(raw${interfaceName}: any): E${interfaceName}Impl {
  const instance = Object.create(Proto)
  instance._${interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1)} = raw${interfaceName}
  return instance
}

export function is(value: unknown): value is E${interfaceName} {
  return typeof value === "object" &&
    value !== null &&
    TypeId in value &&
    "_${interfaceName.charAt(0).toLowerCase() + interfaceName.slice(1)}" in value
}

export function assumeImpl(value: E${interfaceName}): E${interfaceName}Impl {
  return value as E${interfaceName}Impl
}

export function assert(value: unknown): E${interfaceName} {
  if (!is(value)) throw new Error("Failed to cast to E${interfaceName}")
  return value
}
`

  const errors = `import * as Schema from "effect/Schema"

export class CannotMakeE${interfaceName} extends Schema.TaggedError<CannotMakeE${interfaceName}>()(
  "CannotMakeE${interfaceName}",
  { cause: Schema.Unknown },
) {}
`

  return {
    name: interfaceName,
    content,
    errors,
  }
}

function generateIndex(wrappers: GeneratedWrapper[]): string {
  return `// This file is auto-generated. Do not edit manually.
${wrappers
  .map(
    w =>
      `export type { E${w.name} } from "./E${w.name}.js"
export * from "./E${w.name}Errors.js"`,
  )
  .join('\n')}
`
}

generateEffectWrappers().catch(console.error)
