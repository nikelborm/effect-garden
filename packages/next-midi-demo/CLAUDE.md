# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Commands

```bash
bun dev        # Start dev server (HTTPS enabled via --experimental-https)
bun build      # Production build (webpack mode)
bun start      # Start production server
bun lint       # Run Biome linter
bun format     # Auto-format with Biome
```

This package lives in a bun monorepo at `/home/nikel/projects/effect-garden`.
Run commands from this package directory.

**Do not use Turborepo** — it is present but incomplete and discouraged. Use
per-package `bun` commands instead.

### Full dev environment (from monorepo root)

Run `bun max` from the monorepo root to start a Zellij session (`midi-demo.kdl`)
with all required watchers:

| Pane | Directory | Command |
|------|-----------|---------|
| Next.js dev | `packages/next-midi-demo` | `bun dev` |
| Next.js tsc watch | `packages/next-midi-demo` | `bunx tsc --noEmit --watch` |
| Web MIDI tsc watch | `packages/effect-web-midi` | `bun dev` |
| Web MediaCapture tsc watch | `packages/effect-web-mediacapture-streams` | `bun dev` |
| Web Audio tsc watch | `packages/effect-web-audio` | `bun dev` |

## Architecture

This is a MIDI music controller demo app that plays pre-recorded audio assets.
Users connect a MIDI device, then trigger playback by pressing pads/keys mapped
to musical phrases.

### Audio Asset Model

Each audio asset is identified by three dimensions:

- **Pattern** (0–7): rhythmic pattern
- **Accord** (C, Dm, Em, F, G, Am, D, E): chord
- **Strength** (s, m, v): soft / medium / vivid

That yields 8 × 8 × 3 = 192 total assets (~2.1 MB each), downloaded and cached
in the **Origin Private File System (OPFS)** for offline use.

### Layer Breakdown

**UI layer** (`src/app/lib/` component files, `src/components/`)

- Client-side React components subscribe to atoms via `useAtomValue` /
  `useAtomSet` from `@effect-atom/atom-react`.

**Atoms layer** (`src/app/lib/atoms/`)

- Reactive state cells (`@effect-atom/atom`) exposed to React. Atoms reflect
  button pressability, selected accord/pattern/strength, MIDI port map, and
  download progress.

**Service layer** (`src/app/lib/services/`)

- All services are `Effect.Service<>()` classes with scoped initialization,
  composed via `Layer` in `runtime.ts`.
- Key services:
  - `UIButtonService` — core interaction logic; determines button pressability
    and selection
  - `AppPlaybackStateService` — loads audio from OPFS, decodes and plays via Web
    Audio
  - `AssetDownloadScheduler` / `DownloadManager` — queues and limits (max 5)
    parallel downloads
  - `OpfsWritableHandleManager` — manages OPFS file handles
  - `AccordRegistry`, `PatternRegistry`, `StrengthRegistry` — typed registries
    for each dimension
  - `PhysicalKeyboard*`, `PhysicalMIDIDevice*`, `VirtualPad*` mapping services —
    translate raw input events into logical button presses via streams

**Stream/Effect runtime** (`src/app/lib/runtime.ts`)

- Assembles the full `AppLayer` by merging all service layers and runs it with `Effect.runFork`.

### Key Patterns

**Effect services:**

```typescript
export class FooService extends Effect.Service<FooService>()('next-midi-demo/FooService', {
  scoped: Effect.gen(function* () { ... })
})
```

**Branded types** (`src/app/lib/branded/`) — enforce range/type constraints at
compile time using `Brand.refined<T>()` with Schema decoders.

**Button press handling** — physical inputs (keyboard keys, MIDI notes, virtual
pad touches) each produce an `effect/Stream` of press/release events, mapped
through a `makePhysicalButtonToParamMappingService` factory into logical param
changes that feed `UIButtonService`.

**Atom families** — per-button state atoms are created with
`Atom.family(key => ...)` and read in React with `useAtomValue(buttonAtomFamily(key))`.

### Workspace Packages Used

- `effect-web-audio` — Effect bindings for the Web Audio API
- `effect-web-midi` — Effect bindings for the Web MIDI API
- `effect-opfs` — Effect bindings for the Origin Private File System
- `@nikelborm/effect-helpers` — shared Effect utilities

### Next.js Config Notes

- HTTPS required in dev (OPFS API needs a secure context)
- Cross-Origin isolation headers (`COOP`/`COEP`) are set for SharedArrayBuffer support
- `/samples/` directory has `no-store` cache-control (assets are managed by OPFS/SW)
- Service worker (Serwist) is disabled in dev, enabled in production;
  `/samples/` is excluded from precache
- React Compiler is enabled
