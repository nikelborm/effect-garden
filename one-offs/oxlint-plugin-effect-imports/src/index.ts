import type { Rule } from 'eslint'

// ─── types ───────────────────────────────────────────────────────────────────

export type EntryConfig =
  | string // namespace import with custom alias (subpath = import name)
  | { kind: 'namespace'; alias?: string }
  | { kind: 'named'; subpath: string } // import { fn } from 'pkg/subpath'

export type Overrides = Record<string, Record<string, EntryConfig | null>>

export type RuleConfig = {
  autoPackages?: string[] // glob patterns: 'effect', '@effect/*'
  overrides?: Overrides
}

// ─── defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_AUTO_PACKAGES = ['effect', '@effect/*']

// Only exceptions to the auto-infer convention need to be listed here.
export const DEFAULT_OVERRIDES: Overrides = {
  effect: {
    // JS built-in name conflicts — need aliases
    Array: 'EArray',
    String: 'EString',
    Function: 'EFunction',
    // Individual function exports — named import from the subpath, not namespace
    pipe: { kind: 'named', subpath: 'Function' },
    flow: { kind: 'named', subpath: 'Function' },
    identity: { kind: 'named', subpath: 'Function' },
    constant: { kind: 'named', subpath: 'Function' },
    absurd: { kind: 'named', subpath: 'Function' },
    hole: { kind: 'named', subpath: 'Function' },
    unsafeCoerce: { kind: 'named', subpath: 'Function' },
  },
  '@effect/cli': {
    // Aliases to avoid collisions with same-named modules in other packages
    Command: 'CliCommand',
    Options: 'CliOptions',
  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

// Supports exact match and trailing /* glob (e.g. '@effect/*').
// The * matches exactly one path segment, so '@effect/*' matches '@effect/platform'
// but NOT '@effect/platform/HttpApiError' (which is already a subpath specifier).
function matchesGlob(pkg: string, pattern: string): boolean {
  if (pattern === pkg) return true
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2) // '@effect'
    if (!pkg.startsWith(prefix + '/')) return false
    const rest = pkg.slice(prefix.length + 1)
    return !rest.includes('/')
  }
  return false
}

// Effect's convention: module namespaces are PascalCase; individual exports are camelCase.
// We only auto-infer namespace imports for PascalCase names without an explicit override.
function isPascalCase(name: string): boolean {
  const first = name[0]
  return first !== undefined && first >= 'A' && first <= 'Z'
}

// ─── rule ────────────────────────────────────────────────────────────────────

export const namedToNamespace: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Enforce subpath imports from Effect packages (namespace or named)',
      recommended: true,
    },
    messages: {
      useSubpathImport: "Use subpath imports from '{{pkg}}'.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          autoPackages: { type: 'array', items: { type: 'string' } },
          overrides: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: {
                oneOf: [
                  { type: 'string' },
                  { type: 'null' },
                  {
                    type: 'object',
                    properties: {
                      kind: { type: 'string', enum: ['namespace', 'named'] },
                      alias: { type: 'string' },
                      subpath: { type: 'string' },
                    },
                    required: ['kind'],
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const config = context.options[0] as RuleConfig | undefined
    const autoPackages = config?.autoPackages ?? DEFAULT_AUTO_PACKAGES
    const overrides = config?.overrides ?? DEFAULT_OVERRIDES

    return {
      ImportDeclaration(node) {
        const importKind = (node as any).importKind as string | undefined
        if (importKind === 'type') return

        const pkg = node.source.value as string
        if (!autoPackages.some(p => matchesGlob(pkg, p))) return

        const pkgOverrides = overrides[pkg] ?? {}
        const named = node.specifiers.filter(
          s => s.type === 'ImportSpecifier' && (s as any).importKind !== 'type',
        )

        type NsSpec = { name: string; alias: string }
        type NamedSpec = { name: string; local: string }

        const nsImports: NsSpec[] = []
        const namedBySubpath = new Map<string, NamedSpec[]>()
        const remaining: NamedSpec[] = [] // null override or camelCase without override

        for (const s of named) {
          const name = (s as any).imported.name as string
          const local = (s as any).local.name as string
          const override = pkgOverrides[name]

          if (override === null) {
            // Explicitly excluded — keep as named import
            remaining.push({ name, local })
            continue
          }

          if (override !== undefined) {
            if (typeof override === 'string') {
              nsImports.push({ name, alias: override })
            } else if (override.kind === 'namespace') {
              nsImports.push({ name, alias: override.alias ?? name })
            } else {
              const group = namedBySubpath.get(override.subpath) ?? []
              group.push({ name, local })
              namedBySubpath.set(override.subpath, group)
            }
            continue
          }

          // No override: auto-infer based on naming convention.
          // PascalCase → namespace module; camelCase → individual export, skip.
          if (isPascalCase(name)) {
            nsImports.push({ name, alias: name })
          } else {
            remaining.push({ name, local })
          }
        }

        if (nsImports.length === 0 && namedBySubpath.size === 0) return

        context.report({
          node,
          messageId: 'useSubpathImport',
          data: { pkg },
          fix(fixer) {
            const lines: string[] = []

            for (const { name, alias } of nsImports) {
              lines.push(`import * as ${alias} from '${pkg}/${name}'`)
            }

            for (const [subpath, specs] of namedBySubpath) {
              const specText = specs
                .map(({ name, local }) =>
                  name === local ? name : `${name} as ${local}`,
                )
                .join(', ')
              lines.push(`import { ${specText} } from '${pkg}/${subpath}'`)
            }

            if (remaining.length > 0) {
              const remainingText = remaining
                .map(({ name, local }) =>
                  name === local ? name : `${name} as ${local}`,
                )
                .join(', ')
              lines.push(`import { ${remainingText} } from '${pkg}'`)
            }

            return fixer.replaceText(node, lines.join('\n'))
          },
        })
      },
    }
  },
}

// ─── plugin ───────────────────────────────────────────────────────────────────

const plugin = {
  meta: { name: 'effect-imports' },
  rules: { 'named-to-namespace': namedToNamespace },
}

export default plugin
