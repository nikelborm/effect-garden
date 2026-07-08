# oxlint-plugin-effect-imports

An [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) plugin that enforces
namespace (subpath) imports from [Effect](https://effect.website) packages.

It rewrites barrel imports like this:

```ts
import { Effect, Layer, pipe } from 'effect'
```

into the idiomatic Effect style, using the linter's autofix:

```ts
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import { pipe } from 'effect/Function'
```

This keeps bundles tree-shakeable, avoids name collisions with JS built-ins
(`Array`, `String`, `Function`, …), and matches the convention used throughout
the Effect ecosystem.

## Requirements

- **oxlint `>= 1.0`** — the plugin uses oxlint's JS-plugin API (`jsPlugins`),
  which requires a recent oxlint release. Verified against oxlint `1.73`.

## Installation

```sh
npm install --save-dev oxlint-plugin-effect-imports
# or
pnpm add -D oxlint-plugin-effect-imports
# or
bun add -d oxlint-plugin-effect-imports
```

## Usage

Register the plugin in your `.oxlintrc.json` via `jsPlugins`, then enable the
rule under the plugin's name (`effect-imports`):

```jsonc
{
  "jsPlugins": ["oxlint-plugin-effect-imports"],
  "rules": {
    "effect-imports/named-to-namespace": "error"
  }
}
```

Then run oxlint as usual. Add `--fix` to apply the rewrites automatically:

```sh
oxlint          # report violations
oxlint --fix    # rewrite imports in place
```

> `jsPlugins` accepts any import specifier, resolved relative to the config
> file. The package name above works once installed; you can also point at a
> local build with a relative path, e.g. `"./path/to/dist/index.js"`.

## The rule: `effect-imports/named-to-namespace`

By default the rule targets the `effect` package and every `@effect/*` scoped
package (e.g. `@effect/platform`, `@effect/cli`). For each named import it
decides what to do from Effect's naming convention:

| Imported name | Convention | Rewritten to |
| --- | --- | --- |
| `PascalCase` (a module namespace) | `import * as X from 'pkg/X'` | namespace import |
| `camelCase` (an individual export) | left as a named import | untouched, unless overridden |

A few names need special handling and are built in as defaults:

- **Built-in name conflicts** are aliased: `Array` → `EArray`, `String` →
  `EString`, `Function` → `EFunction`.
- **Function combinators** (`pipe`, `flow`, `identity`, `constant`, `absurd`,
  `hole`, `unsafeCoerce`) become named imports from `effect/Function`.
- **`@effect/cli`** modules are aliased to avoid collisions: `Command` →
  `CliCommand`, `Options` → `CliOptions`.

Already-correct subpath imports (`import * as Effect from 'effect/Effect'`),
type-only imports, and non-Effect packages are never touched.

### Options

The rule accepts a single options object. All fields are optional; the defaults
above apply when omitted.

```jsonc
{
  "rules": {
    "effect-imports/named-to-namespace": [
      "error",
      {
        // Packages the rule applies to. Exact names or a single-segment
        // trailing glob ('@effect/*' matches '@effect/platform' but not
        // '@effect/platform/HttpApiError'). Default: ["effect", "@effect/*"].
        "autoPackages": ["effect", "@effect/*", "my-effect-lib"],

        // Per-package, per-name overrides. Replaces the built-in defaults
        // when provided, so re-declare any defaults you still want.
        "overrides": {
          "effect": {
            // string  -> namespace import aliased to that name
            "Array": "EArray",
            // { kind: 'namespace', alias? } -> namespace import
            "Stream": { "kind": "namespace", "alias": "S" },
            // { kind: 'named', subpath } -> named import from pkg/subpath
            "pipe": { "kind": "named", "subpath": "Function" },
            // null -> exclude this name from auto-inference (keep as-is)
            "Layer": null
          }
        }
      }
    ]
  }
}
```

**`autoPackages`** — the list of packages to lint. A trailing `/*` matches
exactly one extra path segment, so it targets package roots (`@effect/platform`)
without touching specifiers that are already subpaths
(`@effect/platform/HttpApiError`).

**`overrides`** — `Record<pkg, Record<importName, override>>`, where each
override is one of:

- `string` — namespace import aliased to that string.
- `{ kind: 'namespace', alias?: string }` — namespace import (defaults the alias
  to the import name).
- `{ kind: 'named', subpath: string }` — named import from `pkg/subpath`.
- `null` — leave this name as a named import from the package root.

Providing `overrides` replaces the built-in `DEFAULT_OVERRIDES` entirely, so
include any defaults you still want alongside your additions.

## Programmatic use

The package also exports the rule and defaults for testing or custom
composition:

```ts
import plugin, {
  namedToNamespace,
  DEFAULT_AUTO_PACKAGES,
  DEFAULT_OVERRIDES,
} from 'oxlint-plugin-effect-imports'
```

## Contributing / building from source

```sh
bun install
bun run build   # tsgo: JS -> dist/, type declarations -> dist-types/
bun run test    # vitest + eslint RuleTester
```

## License

MIT © [nikelborm](https://github.com/nikelborm)
