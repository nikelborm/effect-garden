# My effect garden

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/nikelborm/effect-garden)

A place where I carefully grow species of my favorite flower bindweed. In
programmer terms -- all my pet-projects, most of which will be somehow be
related to effect.

This repo uses `mise` to install cargo, bun, node etc, as well as to instate env
vars. Install it.

## Directories

1. `ideas` - almost empty packages, or which have some exploration going on.
   Don't expect anything to be there except maybe some random ts files and
   Readme.
2. `one-offs` - packages, scripts I created to solve a single task and don't
   realistically expect to ever revisit or use again (hopefully). Many of them
   still are quite interesting and recommended to be checked-out as they might
   represent a demo usage of the other packages I made.

   1. [btrfs-partition-restoration](./one-offs/btrfs-partition-restoration)
   2. [github-extract-issues](./one-offs/github-extract-issues)
   3. [yt-music-export](./one-offs/yt-music-export)
3. `packages` - the ones worth at least something. Some of them are even
   installable. Some are even usable.

   The ones I'm confident to be working:

   1. [bliss-audio-ts](./packages/bliss-audio-ts)
   2. [effect-web-midi](./packages/effect-web-midi)
   3. [joiners](./packages/joiners)
   4. [effect-btrfs](./packages/effect-btrfs)
   5. [git-dl](./packages/git-dl)
   6. [effect-zstd](./packages/effect-zstd)
   7. [effect-helpers](./packages/effect-helpers)
   8. [apache-superset-init](./packages/apache-superset-init)
   9. [archive-compress-encrypt-and-back](./packages/archive-compress-encrypt-and-back)
   10. [tsconfig](./packages/tsconfig)
   11. [ts-key-not-enum](./packages/ts-key-not-enum)

   The ones I less confident to be working about:

   1. [backend-config](./packages/backend-config)
   2. [effect-command-executors](./packages/effect-command-executors)
   3. [effect-drizzle-helpers](./packages/effect-drizzle-helpers) (recommend checking out)
   4. [effect-npm-api](./packages/effect-npm-api)
   5. [effect-npm-api-schema](./packages/effect-npm-api-schema)
   6. [effect-web-audio](./packages/effect-web-audio)
   7. [effect-web-mediacapture-streams](./packages/effect-web-mediacapture-streams)
   8. [next-midi-demo](./packages/next-midi-demo) (recommend checking out)
   9. [scripts](./packages/scripts)
   10. [trellisform-database](./packages/trellisform-database)
   11. [ts-better-tuple](./packages/ts-better-tuple)
   12. [vscode-json-schemas-offline](./packages/vscode-json-schemas-offline)

4. `scripts` - a single package with all the random scripts I ever used. The one
   I use often is `fix_package_jsons.ts` or `cleanup.ts`. All of the scripts
   from there are automatically added to the `PATH` by mise so they are callable
   wherever in the monorepo you'd be.
