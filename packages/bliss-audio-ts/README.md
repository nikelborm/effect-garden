# bliss-audio-ts

TypeScript bindings for [bliss-audio](https://github.com/Polochon-street/bliss-rs),
a music analysis library that produces fixed-length feature vectors from audio
files. Feature vectors can be compared with distance metrics to find musically
similar songs and build automatic playlists.

## Why Bun FFI instead of WebAssembly

bliss-audio depends on FFmpeg for audio decoding. This dependency makes WASM
targets impractical: the upstream project's own Emscripten CI build strips
FFmpeg entirely (`--no-default-features`), leaving only a bare analysis core
that cannot read audio files by path. Getting full FFmpeg into a WASM bundle
would add ~100 MB of binary, require a virtual filesystem layer, and still
degrade performance.

Since the use case is server-side analysis of files on disk, the right approach
is a native shared library. This project compiles a thin Rust `cdylib` that
wraps bliss-audio and exposes a C ABI, then calls it from TypeScript through [Bun's
built-in FFI](https://bun.sh/docs/api/ffi). Data crosses the boundary as JSON
strings, which is negligible overhead compared to the 100–500 ms per-song
analysis time.

## TODO

1. Effect.ts integration
2. deno, node ffi options
3. abstract classes to easily switch between ffi platforms

## Requirements

- [mise](https://mise.jdx.dev/) (preferred to pull cargo and bun easily)
- [Bun](https://bun.sh) v1.1+
- Rust toolchain (`cargo`)
- FFmpeg development libraries (e.g. `libavcodec-dev`, `libavformat-dev`,
  `libavutil-dev`, `libswresample-dev` on Debian/Ubuntu)

  ```
  $ readelf -d ./bliss-audio-ts/native/target/release/libbliss_native.so | grep NEEDED

  libavutil.so.60
  libavformat.so.62
  libavdevice.so.62
  libswresample.so.6
  libavcodec.so.62
  ```

```sh
# so that it's able to get bun and cargo
mise trust

# Install TypeScript dependencies
bun install

# Required to run tests, which rely on that folder from the original repo
bunx fetch-github-folder \
  --repoOwner Polochon-street \
  --repoName bliss-rs \
  --pathToEntityInRepo /data \
  --destinationPath bliss-audio/data \
  --gitRef c5036035f63cd7d83e9152c2468a6a4a4bc9e0cc

# If you're interested in studying the bliss-audio code too, you can clone the repo instead
git clone git@github.com:Polochon-street/bliss-rs.git bliss-audio
```

## Build

```sh
# Does both. (run is required word)
bun run build

# Builds the native library (one-time, or after bliss-audio changes)
bun build:native

# Compiles TS to JS
bun build:ts
```

The compiled library lands at `native/target/release/libbliss_native.so` (Linux)
or `.dylib` (macOS). `bliss.ts` loads it from that path at import time. Although
I currently don't compile for macOS/Windows because I didn't have a reson to yet

## Usage

```ts
import { analyzeSong, closestSongs, euclideanDistance, isBlissError } from "./index.ts";

const result = analyzeSong("/path/to/song.flac");
if (isBlissError(result)) {
  console.error(result._tag, result.message);
} else {
  console.log(result.analysis.features); // Float32Array of length 23
  const playlist = closestSongs(result, [result]);
}
```

Errors are never thrown. Every function that calls into the native library
returns a tagged-union result. Use `isBlissError` to discriminate.

## API

### Analysis

```ts
analyzeSong(filePath: string): Song | BlissError
analyzeSongWithOptions(filePath: string, options: AnalysisOptions): Song | BlissError

analyzeSongs(filePaths: string[]): Array<Song | BlissError>
analyzeSongsSafe(filePaths: string[]): { songs: Song[]; errors: Array<{ path: string; error: BlissError }> }

analyzeCue(cuePath: string): CueSongsResult | BlissError
analyzeCueWithOptions(cuePath: string, options: AnalysisOptions): CueSongsResult | BlissError
```

`AnalysisOptions`:

```ts
interface AnalysisOptions {
  featuresVersion: FeaturesVersion; // FeaturesVersion.LATEST for new code
  numberCores?: number;             // 0 or undefined = auto-detect
}
```

### Distance metrics

```ts
euclideanDistance(a: Float32Array, b: Float32Array): number
cosineDistance(a: Float32Array, b: Float32Array): number
mahalanobisDistance(a: Float32Array, b: Float32Array, m: Float32Array): number
mahalanobisDistanceBuilder(m: Float32Array): DistanceFunction
```

### Playlist helpers

```ts
closestSongs(target: Song | Float32Array, songs: Song[], distanceFn?): Song[]
buildPlaylist(target: Song | Float32Array, songs: Song[], count: number, distanceFn?): Song[]
songToSong(initialSongs: (Song | Float32Array)[], candidateSongs: Song[], distanceFn?): Song[]
closestAlbumToGroup(group: Song[], pool: Song[], distanceFn?): Song[]
distanceMatrix(songs: Song[], distanceFn?): Float32Array
dedupPlaylist(playlist: Song[], distanceThreshold?, distanceFn?): Song[]
```

### Core types

```ts
interface Song {
  path: string;
  artist?: string;
  title?: string;
  album?: string;
  albumArtist?: string;
  trackNumber?: number;
  discNumber?: number;
  genre?: string;
  durationSecs: number;
  analysis: Analysis;
  featuresVersion: FeaturesVersion;
  cueInfo?: CueInfo; // only present for CUE sheet tracks
}

interface Analysis {
  features: Float32Array; // length = NUMBER_FEATURES (23 for Version2)
  featuresVersion: FeaturesVersion;
}

type BlissError = DecodingError | AnalysisError | ProviderError;
// each has: { _tag: "DecodingError" | "AnalysisError" | "ProviderError"; message: string }
```

Named indices into the features array are exported as `AnalysisIndex` (Version2)
and `AnalysisIndexV1` (Version1):

```ts
import { AnalysisIndex } from "./index.ts";

const tempo = song.analysis.features[AnalysisIndex.Tempo];
const chroma1 = song.analysis.features[AnalysisIndex.Chroma1];
```

## Examples

**Print analysis for a file:**
```sh
bun examples/analyze.ts /path/to/song.flac
```

**Euclidean distance between two songs:**
```sh
bun examples/distance.ts /path/to/a.flac /path/to/b.flac
```

**Build a playlist from a folder:**
```sh
bun examples/playlist.ts [-o playlist.m3u] [-a analysis.json] <folder> <first-song>
```

**Persistent library with incremental updates:**
```sh
bun examples/library.ts init <folder> [-d db.json] [-c config.json]
bun examples/library.ts update [-c config.json]
bun examples/library.ts playlist <song> [-c config.json] [-l 20]
```

The `library_extra_info.ts` variant demonstrates storing arbitrary per-song
metadata alongside the analysis.

## Tests

```sh
# Runs vitest (relatively fast)
bun run test

# Runs Stryker mutator for mutational testing
# Slow and expensive (might eat a lot of RAM), but very thourough
bun test:stryker

# Does both
bun format

# Calls biome to format TS code in-place
bun format:ts

# Calls cargo fmt to format Rust code in-place
bun format:native
```

Tests use the sample files bundled in `bliss-audio/data/` (`.flac`, `.cue`, etc.)
and include snapshot tests for feature vectors and distance values. Make sure
you fetched them with the command from the [Requirements](#Requirements) section.
