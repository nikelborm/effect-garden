import { describe, test } from 'vitest'
import { RuleTester } from 'eslint'
import { namedToNamespace } from './index.ts'

const tester = new RuleTester({
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
})

describe('effect-imports/named-to-namespace', () => {
  test('does not flag already-specific subpath specifiers (glob only matches one segment)', () => {
    // '@effect/platform/HttpApiError' must NOT match '@effect/*' —
    // it is already a subpath specifier, not a package root.
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        { code: `import { Unauthorized } from '@effect/platform/HttpApiError'` },
        { code: `import { KiB } from '@effect/platform/FileSystem'` },
        { code: `import { PlatformError } from '@effect/platform/Error'` },
      ],
      invalid: [],
    })
  })

  test('does not flag non-effect packages', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        { code: `import { useState } from 'react'` },
        { code: `import { z } from 'zod'` },
        { code: `import { describe, it } from 'vitest'` },
      ],
      invalid: [],
    })
  })

  test('does not flag already-correct subpath imports', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        { code: `import * as Effect from 'effect/Effect'` },
        { code: `import * as EArray from 'effect/Array'` },
        { code: `import { pipe } from 'effect/Function'` },
        { code: `import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder'` },
        { code: `import * as BunRuntime from '@effect/platform-bun/BunRuntime'` },
      ],
      invalid: [],
    })
  })

  test('auto-infers namespace imports for PascalCase names (no override needed)', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [],
      invalid: [
        {
          // @effect/platform — all PascalCase, fully auto-inferred, no override entry required
          code: `import { HttpApiBuilder } from '@effect/platform'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder'`,
        },
        {
          code: `import { HttpApiBuilder, HttpMiddleware, HttpServerRequest } from '@effect/platform'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder'`,
            `import * as HttpMiddleware from '@effect/platform/HttpMiddleware'`,
            `import * as HttpServerRequest from '@effect/platform/HttpServerRequest'`,
          ].join('\n'),
        },
        {
          // @effect/platform-bun — all auto-inferred
          code: `import { BunFileSystem, BunHttpServer, BunRuntime } from '@effect/platform-bun'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as BunFileSystem from '@effect/platform-bun/BunFileSystem'`,
            `import * as BunHttpServer from '@effect/platform-bun/BunHttpServer'`,
            `import * as BunRuntime from '@effect/platform-bun/BunRuntime'`,
          ].join('\n'),
        },
        {
          code: `import { Layer, Option, Scope } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as Layer from 'effect/Layer'`,
            `import * as Option from 'effect/Option'`,
            `import * as Scope from 'effect/Scope'`,
          ].join('\n'),
        },
      ],
    })
  })

  test('uses alias overrides for JS built-in name conflicts', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [],
      invalid: [
        {
          code: `import { Array } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as EArray from 'effect/Array'`,
        },
        {
          code: `import { String } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as EString from 'effect/String'`,
        },
        {
          code: `import { Function } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as EFunction from 'effect/Function'`,
        },
      ],
    })
  })

  test('uses named subpath overrides for individual function exports (camelCase)', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [],
      invalid: [
        {
          code: `import { pipe } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import { pipe } from 'effect/Function'`,
        },
        {
          code: `import { flow, pipe } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import { flow, pipe } from 'effect/Function'`,
        },
      ],
    })
  })

  test('leaves camelCase names without an override untouched (treated as individual exports)', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        // camelCase from @effect/* — no override → skipped, no report
        { code: `import { describe, it } from '@effect/vitest'` },
        // camelCase from effect with no override
        { code: `import { dual } from 'effect'` },
      ],
      invalid: [],
    })
  })

  test('splits a mixed import: namespace + named subpath + remaining camelCase', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [],
      invalid: [
        {
          code: `import { Effect, Layer, flow, pipe } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as Effect from 'effect/Effect'`,
            `import * as Layer from 'effect/Layer'`,
            `import { flow, pipe } from 'effect/Function'`,
          ].join('\n'),
        },
        {
          // 'dual' has no override and is camelCase → stays as named import
          code: `import { Effect, dual } from 'effect'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as Effect from 'effect/Effect'`,
            `import { dual } from 'effect'`,
          ].join('\n'),
        },
      ],
    })
  })

  test('applies package-level alias overrides (e.g. @effect/cli)', () => {
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [],
      invalid: [
        {
          code: `import { Options } from '@effect/cli'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as CliOptions from '@effect/cli/Options'`,
        },
        {
          code: `import { Command } from '@effect/cli'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as CliCommand from '@effect/cli/Command'`,
        },
        {
          // Args has no override → auto-inferred (PascalCase)
          code: `import { Args } from '@effect/cli'`,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as Args from '@effect/cli/Args'`,
        },
      ],
    })
  })

  test('null override explicitly excludes a name from auto-inference', () => {
    const overrides = {
      effect: {
        Layer: null, // user doesn't want Layer auto-imported
      },
    }
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        {
          // Layer is excluded → no fixable imports → no report
          code: `import { Layer } from 'effect'`,
          options: [{ overrides }],
        },
      ],
      invalid: [
        {
          // Effect still auto-infers; Layer stays
          code: `import { Effect, Layer } from 'effect'`,
          options: [{ overrides }],
          errors: [{ messageId: 'useSubpathImport' }],
          output: [
            `import * as Effect from 'effect/Effect'`,
            `import { Layer } from 'effect'`,
          ].join('\n'),
        },
      ],
    })
  })

  test('respects custom autoPackages — only handles listed packages', () => {
    const options = [{ autoPackages: ['mylib'] }]
    tester.run('named-to-namespace', namedToNamespace, {
      valid: [
        {
          // effect is no longer in autoPackages
          code: `import { Effect } from 'effect'`,
          options,
        },
      ],
      invalid: [
        {
          // PascalCase in mylib → auto-inferred
          code: `import { MyModule } from 'mylib'`,
          options,
          errors: [{ messageId: 'useSubpathImport' }],
          output: `import * as MyModule from 'mylib/MyModule'`,
        },
      ],
    })
  })
})
