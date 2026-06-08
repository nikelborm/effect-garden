# My effect garden

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/nikelborm/effect-garden)

A place where I carefully grow species of my favorite flower bindweed. In
programmer terms -- all my pet-projects, most of which will be somehow be
related to effect.

This repo uses `mise` to install cargo, bun, node etc, as well as to instate env
vars. Install it.

## Directories

1. `packages` - the ones worth at least something. Some of them are even
   installable. Some are even usable.

   The ones I'm confident to be working. At the top are the ones I'm most proud of:

   1. [effect-web-midi](./packages/effect-web-midi) (published) — Effect
      wrapper for the Web MIDI API: typed streams of port state changes and MIDI
      messages, error-channel-annotated access requests, data-first and data-last
      APIs. Tested on Novation Launchpad X and KORG NanoPad.
   2. [drizzle-fp](./packages/drizzle-fp) (published) — Write Drizzle ORM table
      declarations in functional style and compose reusable table parts.
   3. [joiners](./packages/joiners) (published) — Join any Iterables with
      SQL-style semantics (inner, left, right, full, cross, and Venn diagram
      parts) and extreme TypeScript type inference.
   4. [bliss-audio-ts](./packages/bliss-audio-ts) (published) — Bun FFI bindings
      for bliss-audio (Rust); analyzes audio files into 23-dimensional feature
      vectors for similarity search and automatic playlist building.
   5. [gitdl](./packages/gitdl) (published) — CLI + library to download any file
      or folder from any GitHub repo at any ref, without cloning the whole repo.
   6. [effect-zstd](./packages/effect-zstd) (published) — Zstd
      compress/decompress as an Effect service; exposes stream operators for
      streaming compression pipelines.
   7. [ts-key-not-enum](./packages/ts-key-not-enum) (published) —
      Type-safe constants for `KeyboardEvent.key` non-printable values
      (arrows, function keys, media keys, etc.), auto-generated from MDN. Avoids
      `const enum` so it works with `erasableSyntaxOnly`.
   8. [apache-superset-init](./packages/apache-superset-init) (published) —
      One-command script to download and pre-configure Apache Superset for
      production Docker Compose: generates random secrets, enables PostgreSQL
      support, creates a named Docker network.
   9. [archive-compress-encrypt-and-back](./packages/archive-compress-encrypt-and-back)
      (published) — CLI (ACE) to archive, compress, and encrypt directories and
      restore them back; a TypeScript rewrite of a bash script.
   10. [effect-btrfs](./packages/effect-btrfs) (published) — Effect
       wrapper around btrfs-progs CLI for Btrfs filesystem operations.
   11. [tsconfig](./packages/tsconfig) (published) — Strict, opinionated
       TypeScript base config used across the monorepo; enables
       `erasableSyntaxOnly`, `isolatedDeclarations`, `verbatimModuleSyntax`, and
       more.
   12. [backend-config](./packages/backend-config) (published) — Reusable Effect
       Tags for declaring which environment config values a layer depends on;
       catches missing values at startup rather than at first use.
   13. [effect-helpers](./packages/effect-helpers) (published) — Miscellaneous
       Effect helpers: schema utilities, exec wrappers, stream combinators, OpenAPI
       annotations, and more.

   The ones I less confident to be working about:

   1. [effect-web-audio](./packages/effect-web-audio) (published) — Effect
      wrapper for the Web Audio API (W3C spec).
   2. [effect-web-mediacapture-streams](./packages/effect-web-mediacapture-streams)
      (published) — Effect wrapper for the Media Capture and Streams API
      (`getUserMedia`, `mediaDevices`).
   3. [ts-better-tuple](./packages/ts-better-tuple) — Type-safe tuple iteration
      that preserves literal index types through `.map()`, `.entries()`, and
      similar operations.
   4. [vscode-json-schemas-offline](./packages/vscode-json-schemas-offline) — VS
      Code extension bundling 1125+ SchemaStore schemas offline — full
      JSON/YAML/TOML validation with zero network requests at runtime.
   5. [effect-command-executors](./packages/effect-command-executors) — Extra
      `@effect/platform/CommandExecutor` implementations, including a sudo-backed
      executor with filesystem cache.
   6. [effect-npm-api](./packages/effect-npm-api) — Effect `HttpApi` declarations
      for the NPM registry API.
   7. [effect-npm-api-schema](./packages/effect-npm-api-schema) — Effect Schema
      definitions for objects returned by the NPM registry API.
2. `apps` - end-user apps. Some of them are good demos of how to use other
   packages.

   1. [trellisform/database](./apps/trellisform/database) (recommend checking
      out - demo of `drizzle-fp`)
   2. [next-midi-demo](./apps/next-midi-demo) (recommend checking out - demo of
      `effect-web-midi` and other audio stuff with effect. the juiciest part is
      in [app/services](./apps/next-midi-demo/app/services))
   3. Aside from the one above, in trellisform, there are also `api`, `backend`,
      `backend-better-auth-service`, `database-effect-schema`, `model`. But not
      much interesting in all of them. They're only at a prototyping stage rn.
3. `one-offs` - packages, scripts I created to solve a single task and don't
   realistically expect to ever revisit or use again (hopefully). Many of them
   still are quite interesting and recommended to be checked-out as they might
   represent a demo usage of the other packages I made.

   1. [btrfs-partition-restoration](./one-offs/btrfs-partition-restoration) —
      Exploratory scripts for recovering corrupted important files from a Btrfs
      partition.
   2. [github-extract-issues](./one-offs/github-extract-issues) — Bulk-extracts
      issues with comments from GitHub repos via Octokit; written during the
      monorepo migration.
   3. [yt-music-export](./one-offs/yt-music-export) — Exports a personal library
      from YouTube Music.
   4. [oxlint-plugin-effect-imports](./one-offs/oxlint-plugin-effect-imports) —
      ESLint/Oxlint plugin that enforces subpath imports from Effect packages.
      Auto-infers `import * as Module from 'effect/Module'` for PascalCase names
      and `import { fn } from 'effect/Function'` for configured individual
      exports; supports aliases for JS built-in name conflicts and per-package
      overrides.
   5. [webref-idl-types](./one-offs/webref-idl-types) — Type declarations
      (`@types/webref__idl`) for `@webref/idl`, the W3C's machine-readable Web
      IDL definitions. Provides typed `listAll()` and `parseAll()` so you get
      structured `IDLRootType[]` parse trees instead of raw strings.
4. `scripts` - a single package with all the random scripts I ever used. The one
   I use often is `fix_package_jsons.ts` or `cleanup.ts`. All of the scripts
   from there are automatically added to the `PATH` by mise so they are callable
   wherever in the monorepo you'd be.
5. `ideas` - almost empty packages, or which have some exploration going on.
   Don't expect anything to be there except maybe some random ts files and
   Readme.
