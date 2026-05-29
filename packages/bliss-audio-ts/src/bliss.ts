/**
 * TypeScript bindings for bliss-audio — a music analysis library for smart playlists.
 *
 * bliss analyzes audio files and produces a fixed-length feature vector for
 * each song. Feature vectors can be compared with distance metrics to find
 * musically similar songs.
 *
 * Errors are never thrown; every function that calls into the native library
 * returns a tagged-union result (`Song | BlissError` or `CueSongsResult | BlissError`).
 * Use `isBlissError` to discriminate.
 *
 * @example
 * ```ts
 * import { analyzeSong, closestSongs, euclideanDistance, isBlissError } from "./bliss.ts";
 *
 * const result = analyzeSong("/path/to/song.flac");
 * if (isBlissError(result)) throw new Error(result.message);
 * const playlist = closestSongs(result, [result]);
 * ```
 */
import { dlopen, FFIType } from 'bun:ffi'
import { resolve } from 'node:path'

// ── Feature-version enum ──────────────────────────────────────────────────────

/** Maps to Rust's `FeaturesVersion` enum. Use `FeaturesVersion.LATEST` in new code. */
export const FeaturesVersion = {
  Version1: 1,
  Version2: 2,
  LATEST: 2,
} as const

/** Numeric discriminant for a features version (`1` or `2`). */
export type FeaturesVersion = 1 | 2

// ── Analysis-index enums ──────────────────────────────────────────────────────

/**
 * Named indices into an `Analysis.features` array produced with
 * `FeaturesVersion.Version2` (the latest).
 *
 * @example
 * ```ts
 * const tempo = analysis.features[AnalysisIndex.Tempo];
 * ```
 */
export const AnalysisIndex = {
  Tempo: 0,
  Zcr: 1,
  MeanSpectralCentroid: 2,
  StdDeviationSpectralCentroid: 3,
  MeanSpectralRolloff: 4,
  StdDeviationSpectralRolloff: 5,
  MeanSpectralFlatness: 6,
  StdDeviationSpectralFlatness: 7,
  MeanLoudness: 8,
  StdDeviationLoudness: 9,
  Chroma1: 10,
  Chroma2: 11,
  Chroma3: 12,
  Chroma4: 13,
  Chroma5: 14,
  Chroma6: 15,
  Chroma7: 16,
  Chroma8: 17,
  Chroma9: 18,
  Chroma10: 19,
  Chroma11: 20,
  Chroma12: 21,
  Chroma13: 22,
} as const

/** Numeric value of an `AnalysisIndex` key. */
export type AnalysisIndex = (typeof AnalysisIndex)[keyof typeof AnalysisIndex]

/**
 * Named indices into an `Analysis.features` array produced with
 * `FeaturesVersion.Version1`.
 */
export const AnalysisIndexV1 = {
  Tempo: 0,
  Zcr: 1,
  MeanSpectralCentroid: 2,
  StdDeviationSpectralCentroid: 3,
  MeanSpectralRolloff: 4,
  StdDeviationSpectralRolloff: 5,
  MeanSpectralFlatness: 6,
  StdDeviationSpectralFlatness: 7,
  MeanLoudness: 8,
  StdDeviationLoudness: 9,
  Chroma1: 10,
  Chroma2: 11,
  Chroma3: 12,
  Chroma4: 13,
  Chroma5: 14,
  Chroma6: 15,
  Chroma7: 16,
  Chroma8: 17,
  Chroma9: 18,
  Chroma10: 19,
} as const

/** Numeric value of an `AnalysisIndexV1` key. */
export type AnalysisIndexV1 =
  (typeof AnalysisIndexV1)[keyof typeof AnalysisIndexV1]

// ── Core data types ───────────────────────────────────────────────────────────

/** CUE sheet provenance for a song extracted from a split audio file. */
export interface CueInfo {
  /** Absolute path of the `.cue` file, e.g. `/path/to/album.cue`. */
  cuePath: string
  /** Absolute path of the audio file the track was extracted from. */
  audioFilePath: string
}

/** Per-feature breakdown of a bliss analysis. */
export interface Analysis {
  /** Normalised f32 feature vector. Length depends on `featuresVersion`. */
  features: Float32Array<ArrayBuffer>
  /** Feature-set version used to produce this analysis. */
  featuresVersion: FeaturesVersion
}

/** An analyzed audio file with metadata and analysis results. */
export interface Song {
  path: string
  artist?: string
  title?: string
  album?: string
  albumArtist?: string
  trackNumber?: number
  discNumber?: number
  genre?: string
  durationSecs: number
  analysis: Analysis
  /** Top-level features version (mirrors `analysis.featuresVersion`). */
  featuresVersion: FeaturesVersion
  /** Populated only when the song was extracted from a CUE sheet. */
  cueInfo?: CueInfo
}

/** Options forwarded to the bliss analysis engine. */
export interface AnalysisOptions {
  /** Feature set to use. Default: `FeaturesVersion.LATEST`. */
  featuresVersion: FeaturesVersion
  /**
   * Number of CPU cores to use for multi-song analysis.
   * `0` or `undefined` lets the native library auto-detect.
   */
  numberCores?: number | undefined
}

// ── Error types ───────────────────────────────────────────────────────────────

/** An error that occurred while decoding an audio or CUE file. */
export interface DecodingError {
  readonly _tag: 'DecodingError'
  readonly message: string
}

/** An error that occurred during signal analysis (e.g. song too short). */
export interface AnalysisError {
  readonly _tag: 'AnalysisError'
  readonly message: string
}

/** An error reported by the music-library provider layer. */
export interface ProviderError {
  readonly _tag: 'ProviderError'
  readonly message: string
}

/** Union of all bliss error variants. Discriminate via `_tag`. */
export type BlissError = DecodingError | AnalysisError | ProviderError

/** String literal type for `BlissError._tag`. */
export type BlissErrorTag = BlissError['_tag']

/** Result of parsing a CUE sheet (when no CUE-level error occurred). */
export interface CueSongsResult {
  /** Per-track results; each entry is either a decoded `Song` or a `BlissError`. */
  readonly songs: ReadonlyArray<Song | BlissError>
}

/** A function that computes the distance between two feature vectors. */
export type DistanceFunction = (
  a: Float32Array<ArrayBuffer>,
  b: Float32Array<ArrayBuffer>,
) => number

// ── Raw JSON shapes returned by Rust ─────────────────────────────────────────

/**
 * Metadata-only JSON shape returned by the native `_into` functions.
 * The feature vector is written directly into a pre-allocated `Float32Array`
 * buffer rather than being embedded in the JSON.
 */
export interface RawSongMeta {
  path: string
  artist?: string
  title?: string
  album?: string
  album_artist?: string
  track_number?: number
  disc_number?: number
  genre?: string
  duration_secs: number
  features_version: number
  cue_info?: { cue_path: string; audio_file_path: string }
  error?: string
  error_tag?: BlissErrorTag
}

/**
 * Full JSON shape including a serialized feature array.
 * Kept for backward compatibility with `decodeSong` / `decodeSongResult`.
 */
export interface RawSongResult extends RawSongMeta {
  features: number[]
}

/** Metadata-only CUE JSON shape (features in buffer, not JSON). */
export interface RawCueMeta {
  error?: string
  error_tag?: BlissErrorTag
  songs?: RawSongMeta[]
}

/** Full CUE JSON shape including per-track feature arrays. */
export interface RawCueResult {
  error?: string
  error_tag?: BlissErrorTag
  songs?: RawSongResult[]
}

// ── FFI setup ─────────────────────────────────────────────────────────────────

const LIB_PATH = resolve(
  import.meta.dirname,
  './native/target/release/libbliss_native.so',
)

const { symbols } = dlopen(LIB_PATH, {
  bliss_number_features: {
    args: [],
    returns: FFIType.i32,
  },
  /** Writes features into `features_out`; returns metadata JSON (no features field). */
  bliss_analyze_song: {
    args: [FFIType.cstring, FFIType.ptr, FFIType.i32],
    returns: FFIType.cstring,
  },
  /** `features_version`: u16 (1 or 2); `number_cores`: u32 (0 = auto). */
  bliss_analyze_song_with_options: {
    args: [FFIType.cstring, FFIType.u16, FFIType.u32, FFIType.ptr, FFIType.i32],
    returns: FFIType.cstring,
  },
  /** Writes per-track features into `features_out`; returns metadata JSON. */
  bliss_analyze_cue: {
    args: [FFIType.cstring, FFIType.ptr, FFIType.i32, FFIType.i32],
    returns: FFIType.cstring,
  },
  /** `features_version`: u16 (1 or 2); `number_cores`: u32 (0 = auto). */
  bliss_analyze_cue_with_options: {
    args: [
      FFIType.cstring,
      FFIType.u16,
      FFIType.u32,
      FFIType.ptr,
      FFIType.i32,
      FFIType.i32,
    ],
    returns: FFIType.cstring,
  },
  bliss_free_string: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  bliss_euclidean_distance: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.f32,
  },
  bliss_cosine_distance: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
    returns: FFIType.f32,
  },
})

// ── Constants ─────────────────────────────────────────────────────────────────

/** Number of features in a `FeaturesVersion.LATEST` (Version2) analysis vector. */
export const NUMBER_FEATURES: number = symbols.bliss_number_features()

/** Number of features in a `FeaturesVersion.Version1` analysis vector. */
export const NUMBER_FEATURES_V1 = 20

/**
 * Maximum number of CUE tracks supported per `analyzeCue` call.
 * The pre-allocated features buffer has space for this many tracks.
 * Real-world CUE sheets are almost always well under this limit.
 */
export const MAX_CUE_TRACKS = 512

// ── Encode helpers ────────────────────────────────────────────────────────────

/**
 * Encode an `AnalysisOptions` object into the two primitive values passed to
 * the native `bliss_analyze_*_with_options` functions.
 *
 * Returns `[featuresVersion, numberCores]` where `numberCores = 0` means
 * auto-detect on the Rust side.
 */
export function encodeAnalysisOptions(
  opts: AnalysisOptions,
): readonly [featuresVersion: number, numberCores: number] {
  return [opts.featuresVersion, opts.numberCores ?? 0] as const
}

// ── Decode helpers ────────────────────────────────────────────────────────────

/**
 * Decode a raw features array and version number into an `Analysis` object.
 *
 * `featuresVersion` must be `1` or `2`; pass the value from `RawSongResult.features_version`.
 */
export function decodeAnalysis(
  features: number[],
  featuresVersion: number,
): Analysis {
  return {
    features: new Float32Array(features),
    featuresVersion: featuresVersion as FeaturesVersion,
  }
}

/**
 * Decode a `RawSongResult` (the snake_case JSON shape from Rust) into a typed `Song`.
 *
 * Only call this when `raw.error` is `null`; for error results use `decodeSongResult`.
 */
export function decodeSong(raw: RawSongResult): Song {
  return {
    path: raw.path,
    ...('artist' in raw ? { artist: raw.artist! } : {}),
    ...('title' in raw ? { title: raw.title! } : {}),
    ...('album' in raw ? { album: raw.album! } : {}),
    ...('album_artist' in raw ? { albumArtist: raw.album_artist! } : {}),
    ...('track_number' in raw ? { trackNumber: raw.track_number! } : {}),
    ...('disc_number' in raw ? { discNumber: raw.disc_number! } : {}),
    ...('genre' in raw ? { genre: raw.genre! } : {}),
    durationSecs: raw.duration_secs,
    analysis: decodeAnalysis(raw.features, raw.features_version),
    featuresVersion: raw.features_version as FeaturesVersion,
    ...('cue_info' in raw
      ? {
          cueInfo: {
            cuePath: raw.cue_info?.cue_path,
            audioFilePath: raw.cue_info?.audio_file_path,
          },
        }
      : {}),
  }
}

/**
 * Decode a `RawSongResult` into either a `Song` or a `BlissError`.
 *
 * Checks `raw.error_tag` first; if present returns the appropriate error variant.
 */
export function decodeSongResult(raw: RawSongResult): Song | BlissError {
  if ('error_tag' in raw && 'error' in raw) {
    return { _tag: raw.error_tag!, message: raw.error! }
  }
  return decodeSong(raw)
}

/**
 * Decode a `RawCueResult` into either a `CueSongsResult` or a `BlissError`.
 *
 * A `BlissError` is returned when the CUE file itself could not be parsed.
 * Individual per-track errors are embedded inside `CueSongsResult.songs`.
 */
export function decodeCueResult(
  raw: RawCueResult,
): CueSongsResult | BlissError {
  if ('error_tag' in raw && 'error' in raw) {
    return { _tag: raw.error_tag!, message: raw.error! }
  }
  return { songs: ('songs' in raw ? raw.songs! : []).map(decodeSongResult) }
}

/** Type guard — returns `true` when `value` is a `BlissError` variant. */
export function isBlissError(value: unknown): value is BlissError {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    (value._tag === 'DecodingError' ||
      value._tag === 'AnalysisError' ||
      value._tag === 'ProviderError')
  )
}

/**
 * Read a single feature from a `FeaturesVersion.LATEST` (Version2) analysis,
 * throwing if the analysis was produced with a different version.
 *
 * Mirrors Rust's `impl Index<AnalysisIndex> for Analysis`, which panics with
 * "Tried to index features with incompatible indexes" on a version mismatch.
 * That panic is unreachable from TypeScript (plain `Float32Array` access never
 * goes through the Rust `Index` trait), so this function is the only path that
 * can surface that message.
 */
export function getFeature(analysis: Analysis, index: AnalysisIndex): number {
  if (analysis.featuresVersion !== FeaturesVersion.LATEST) {
    throw new Error('Tried to index features with incompatible indexes')
  }
  return analysis.features[index]!
}

/**
 * Read a single feature from a `FeaturesVersion.Version1` analysis,
 * throwing if the analysis was produced with a different version.
 *
 * Mirrors Rust's `impl Index<AnalysisIndexv1> for Analysis`.
 */
export function getFeatureV1(
  analysis: Analysis,
  index: AnalysisIndexV1,
): number {
  if (analysis.featuresVersion !== FeaturesVersion.Version1) {
    throw new Error('Tried to index features with incompatible indexes')
  }
  return analysis.features[index]!
}

// ── Internal call helpers ─────────────────────────────────────────────────────

type SongCall = { json: string; features: Float32Array<ArrayBuffer> }
type CueCall = {
  json: string
  features: Float32Array<ArrayBuffer>
  stride: number
}

function numFeaturesForVersion(v: number): number {
  return v === FeaturesVersion.Version1 ? NUMBER_FEATURES_V1 : NUMBER_FEATURES
}

function callAnalyzeSong(pathBuf: Buffer): SongCall {
  const features = new Float32Array(NUMBER_FEATURES)
  const cstr = symbols.bliss_analyze_song(pathBuf, features, NUMBER_FEATURES)
  const json = cstr.toString()
  symbols.bliss_free_string(cstr.ptr)
  return { json, features }
}

function callAnalyzeSongWithOptions(
  pathBuf: Buffer,
  featuresVersion: number,
  numberCores: number,
): SongCall {
  const n = numFeaturesForVersion(featuresVersion)
  const features = new Float32Array(n)
  const cstr = symbols.bliss_analyze_song_with_options(
    pathBuf,
    featuresVersion,
    numberCores,
    features,
    n,
  )
  const json = cstr.toString()
  symbols.bliss_free_string(cstr.ptr)
  return { json, features }
}

function callAnalyzeCue(pathBuf: Buffer): CueCall {
  const stride = NUMBER_FEATURES
  const features = new Float32Array(MAX_CUE_TRACKS * stride)
  const cstr = symbols.bliss_analyze_cue(
    pathBuf,
    features,
    stride,
    MAX_CUE_TRACKS,
  )
  const json = cstr.toString()
  symbols.bliss_free_string(cstr.ptr)
  return { json, features, stride }
}

function callAnalyzeCueWithOptions(
  pathBuf: Buffer,
  featuresVersion: number,
  numberCores: number,
): CueCall {
  const stride = numFeaturesForVersion(featuresVersion)
  const features = new Float32Array(MAX_CUE_TRACKS * stride)
  const cstr = symbols.bliss_analyze_cue_with_options(
    pathBuf,
    featuresVersion,
    numberCores,
    features,
    stride,
    MAX_CUE_TRACKS,
  )
  const json = cstr.toString()
  symbols.bliss_free_string(cstr.ptr)
  return { json, features, stride }
}

// ── Internal meta-decode helpers ──────────────────────────────────────────────

function decodeSongFromMeta(
  raw: RawSongMeta,
  features: Float32Array<ArrayBuffer>,
): Song {
  return {
    path: raw.path,
    ...('artist' in raw ? { artist: raw.artist! } : {}),
    ...('title' in raw ? { title: raw.title! } : {}),
    ...('album' in raw ? { album: raw.album! } : {}),
    ...('album_artist' in raw ? { albumArtist: raw.album_artist! } : {}),
    ...('track_number' in raw ? { trackNumber: raw.track_number! } : {}),
    ...('disc_number' in raw ? { discNumber: raw.disc_number! } : {}),
    ...('genre' in raw ? { genre: raw.genre! } : {}),
    durationSecs: raw.duration_secs,
    analysis: {
      features,
      featuresVersion: raw.features_version as FeaturesVersion,
    },
    featuresVersion: raw.features_version as FeaturesVersion,
    ...('cue_info' in raw
      ? {
          cueInfo: {
            cuePath: raw.cue_info?.cue_path,
            audioFilePath: raw.cue_info?.audio_file_path,
          },
        }
      : {}),
  }
}

function decodeSongResultFromMeta(
  raw: RawSongMeta,
  features: Float32Array<ArrayBuffer>,
): Song | BlissError {
  if ('error_tag' in raw && 'error' in raw) {
    return { _tag: raw.error_tag!, message: raw.error! }
  }
  return decodeSongFromMeta(raw, features)
}

function decodeCueMeta(
  raw: RawCueMeta,
  featBuf: Float32Array<ArrayBuffer>,
  stride: number,
): CueSongsResult | BlissError {
  if ('error_tag' in raw && 'error' in raw) {
    return { _tag: raw.error_tag!, message: raw.error! }
  }
  return {
    songs: ('songs' in raw ? raw.songs! : []).map((meta, i) =>
      decodeSongResultFromMeta(
        meta,
        featBuf.slice(i * stride, (i + 1) * stride),
      ),
    ),
  }
}

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Analyze a single audio file synchronously using the latest features version.
 *
 * Returns a `Song` on success or a `BlissError` on failure.
 * Use `isBlissError` to discriminate.
 *
 * For typical 3–5 minute tracks this takes ~100–500 ms.
 */
export function analyzeSong(filePath: string): Song | BlissError {
  const { json, features } = callAnalyzeSong(Buffer.from(`${filePath}\0`))
  return decodeSongResultFromMeta(JSON.parse(json) as RawSongMeta, features)
}

/**
 * Analyze a single audio file with explicit `AnalysisOptions`.
 *
 * Pass `{ featuresVersion: FeaturesVersion.Version1 }` for backwards-compatible
 * analysis. Returns a `Song` on success or a `BlissError` on failure.
 */
export function analyzeSongWithOptions(
  filePath: string,
  options: AnalysisOptions,
): Song | BlissError {
  const [fv, nc] = encodeAnalysisOptions(options)
  const { json, features } = callAnalyzeSongWithOptions(
    Buffer.from(`${filePath}\0`),
    fv,
    nc,
  )
  return decodeSongResultFromMeta(JSON.parse(json) as RawSongMeta, features)
}

/**
 * Analyze all tracks in a CUE sheet at `cuePath` using the latest features version.
 *
 * Returns a `CueSongsResult` on success (the CUE file was parseable) or a
 * `BlissError` if the CUE file itself could not be read. Individual per-track
 * failures are embedded as `BlissError` entries inside `CueSongsResult.songs`.
 */
export function analyzeCue(cuePath: string): CueSongsResult | BlissError {
  const { json, features, stride } = callAnalyzeCue(Buffer.from(`${cuePath}\0`))
  return decodeCueMeta(JSON.parse(json) as RawCueMeta, features, stride)
}

/**
 * Analyze all tracks in a CUE sheet with explicit `AnalysisOptions`.
 *
 * Same semantics as `analyzeCue`; `options.featuresVersion` controls which
 * feature set is extracted.
 */
export function analyzeCueWithOptions(
  cuePath: string,
  options: AnalysisOptions,
): CueSongsResult | BlissError {
  const [fv, nc] = encodeAnalysisOptions(options)
  const { json, features, stride } = callAnalyzeCueWithOptions(
    Buffer.from(`${cuePath}\0`),
    fv,
    nc,
  )
  return decodeCueMeta(JSON.parse(json) as RawCueMeta, features, stride)
}

/**
 * Analyze multiple audio files sequentially.
 *
 * Returns one entry per path; errors are embedded as `BlissError` values —
 * no exception is thrown.
 */
export function analyzeSongs(filePaths: string[]): Array<Song | BlissError> {
  return filePaths.map(analyzeSong)
}

/**
 * Analyze multiple audio files, splitting results into successes and failures.
 *
 * Convenience wrapper around `analyzeSongs` for callers that want to handle
 * errors separately.
 */
export function analyzeSongsSafe(filePaths: string[]): {
  songs: Song[]
  errors: Array<{ path: string; error: BlissError }>
} {
  const songs: Song[] = []
  const errors: Array<{ path: string; error: BlissError }> = []
  for (const p of filePaths) {
    const result = analyzeSong(p)
    if (isBlissError(result)) {
      errors.push({ path: p, error: result })
    } else {
      songs.push(result)
    }
  }
  return { songs, errors }
}

// ── Distance metrics ──────────────────────────────────────────────────────────

/**
 * Euclidean distance between two feature vectors.
 * Lower values indicate more similar songs.
 */
export function euclideanDistance(
  a: Float32Array<ArrayBuffer>,
  b: Float32Array<ArrayBuffer>,
): number {
  if (a.length !== b.length) {
    throw new Error(
      `bliss: feature length mismatch (${a.length} vs ${b.length})`,
    )
  }
  return symbols.bliss_euclidean_distance(a, b, a.length)
}

/**
 * Cosine distance between two feature vectors.
 * Lower values indicate more similar songs.
 */
export function cosineDistance(
  a: Float32Array<ArrayBuffer>,
  b: Float32Array<ArrayBuffer>,
): number {
  if (a.length !== b.length) {
    throw new Error(
      `bliss: feature length mismatch (${a.length} vs ${b.length})`,
    )
  }
  return symbols.bliss_cosine_distance(a, b, a.length)
}

/**
 * Mahalanobis (weighted) distance between two feature vectors.
 *
 * Computes `sqrt((a - b)^T · M · (a - b))` where `m` is an NxN weight matrix
 * stored as a flat row-major Float32Array of length N² (N = NUMBER_FEATURES).
 * When `m` is the identity matrix this equals euclidean distance.
 */
export function mahalanobisDistance(
  a: Float32Array<ArrayBuffer>,
  b: Float32Array<ArrayBuffer>,
  m: Float32Array<ArrayBuffer>,
): number {
  const n = a.length
  const delta = new Float32Array(n)
  for (let i = 0; i < n; i++) delta[i] = (a[i] ?? 0) - (b[i] ?? 0)

  // deltaM[j] = Σᵢ delta[i] * M[i,j]  (row-vector × matrix)
  const deltaM = new Float32Array(n)
  for (let j = 0; j < n; j++) {
    let sum = 0
    for (let i = 0; i < n; i++) sum += (delta[i] ?? 0) * (m[i * n + j] ?? 0)
    deltaM[j] = sum
  }

  let dot = 0
  for (let j = 0; j < n; j++) dot += (deltaM[j] ?? 0) * (delta[j] ?? 0)
  return Math.sqrt(dot)
}

/**
 * Build a Mahalanobis distance function bound to a fixed weight matrix.
 *
 * `m` must be a flat row-major Float32Array of length NUMBER_FEATURES².
 * The returned function has the same signature as `euclideanDistance` and
 * `cosineDistance`.
 *
 * @example
 * // Identity matrix → equivalent to euclidean distance
 * const identity = Float32Array.from({ length: NUMBER_FEATURES ** 2 },
 *   (_, k) => (k % (NUMBER_FEATURES + 1) === 0 ? 1 : 0));
 * const dist = mahalanobisDistanceBuilder(identity);
 */
export function mahalanobisDistanceBuilder(
  m: Float32Array<ArrayBuffer>,
): DistanceFunction {
  return (a, b) => mahalanobisDistance(a, b, m)
}

// ── Playlist helpers ──────────────────────────────────────────────────────────

function meanFeatures(songs: Song[]): Float32Array<ArrayBuffer> {
  const n = songs.length
  const result = new Float32Array(NUMBER_FEATURES)
  for (const song of songs) {
    for (let i = 0; i < NUMBER_FEATURES; i++) {
      result[i] = (result[i] ?? 0) + (song.analysis.features[i] ?? 0)
    }
  }
  for (let i = 0; i < NUMBER_FEATURES; i++) {
    result[i] = (result[i] ?? 0) / n
  }
  return result
}

/**
 * Return a playlist starting with `group`, followed by every album in `pool`
 * ordered by how close each album's mean feature vector is to the group's mean.
 *
 * Songs already in `group` are excluded from `pool` by path. Within each
 * album the tracks are sorted by disc number then track number.
 *
 * @param group      - Seed songs that anchor the feature centroid.
 * @param pool       - Candidate songs to rank and append.
 * @param distanceFn - Distance metric to use (default: euclidean).
 */
export function closestAlbumToGroup(
  group: Song[],
  pool: Song[],
  distanceFn: DistanceFunction = euclideanDistance,
): Song[] {
  const groupPaths = new Set(group.map(s => s.path))
  const filtered = pool.filter(s => !groupPaths.has(s.path))

  const albumMap = new Map<string, Song[]>()
  for (const song of filtered) {
    if (song.album == null) continue
    const bucket = albumMap.get(song.album) ?? []
    bucket.push(song)
    albumMap.set(song.album, bucket)
  }

  const groupMean = meanFeatures(group)
  const albums = [...albumMap.entries()]
    .map(([album, songs]) => ({ album, songs, mean: meanFeatures(songs) }))
    .sort(
      (a, b) => distanceFn(groupMean, a.mean) - distanceFn(groupMean, b.mean),
    )

  const playlist: Song[] = [...group]
  for (const { songs } of albums) {
    songs.sort(
      (a, b) =>
        (a.discNumber ?? 0) - (b.discNumber ?? 0) ||
        (a.trackNumber ?? 0) - (b.trackNumber ?? 0),
    )
    playlist.push(...songs)
  }
  return playlist
}

/**
 * Sort `songs` by musical similarity to `target`, closest first.
 *
 * The `target` may itself be in `songs`; it will sort to position 0
 * (distance 0). Returns a new sorted array without mutating the input.
 *
 * @param target - Reference song or feature vector.
 * @param songs  - Pool of songs to rank.
 * @param distanceFn - Distance metric to use (default: euclidean).
 */
export function closestSongs(
  target: Song | Float32Array<ArrayBuffer>,
  songs: Song[],
  distanceFn: DistanceFunction = euclideanDistance,
): Song[] {
  const targetFeatures =
    target instanceof Float32Array ? target : target.analysis.features

  return [...songs].sort((a, b) => {
    const da = distanceFn(targetFeatures, a.analysis.features)
    const db = distanceFn(targetFeatures, b.analysis.features)
    return da - db
  })
}

/**
 * Build a playlist by greedy nearest-neighbour chaining.
 *
 * At each step the candidate whose summed distance to all current anchor
 * vectors is smallest is picked next, then it becomes the sole anchor for
 * the following step. This produces a smooth "song-to-song" transition where
 * each track leads naturally into the next.
 *
 * @param initialSongs   - One or more seed songs or raw feature vectors that
 *                         define the starting context. They are not included
 *                         in the returned playlist.
 * @param candidateSongs - Pool of songs to arrange.
 * @param distanceFn     - Distance metric to use (default: euclidean).
 */
export function songToSong(
  initialSongs: (Song | Float32Array<ArrayBuffer>)[],
  candidateSongs: Song[],
  distanceFn: DistanceFunction = euclideanDistance,
): Song[] {
  let vectors = initialSongs.map(s =>
    s instanceof Float32Array ? s : s.analysis.features,
  )

  const pool = [...candidateSongs]
  const result: Song[] = []

  while (pool.length > 0) {
    let minDist = Infinity
    let minIdx = 0
    for (let i = 0; i < pool.length; i++) {
      const poolSong = pool[i]
      if (!poolSong) continue
      const d = vectors.reduce(
        (sum, v) => sum + distanceFn(v, poolSong.analysis.features),
        0,
      )
      if (d < minDist) {
        minDist = d
        minIdx = i
      }
    }
    const song = pool.splice(minIdx, 1)[0]
    if (!song) break
    vectors = [song.analysis.features]
    result.push(song)
  }

  return result
}

/**
 * Build a playlist of `count` songs most similar to `target`.
 *
 * Convenience wrapper around `closestSongs` that limits the result length.
 */
export function buildPlaylist(
  target: Song | Float32Array<ArrayBuffer>,
  songs: Song[],
  count: number,
  distanceFn: DistanceFunction = euclideanDistance,
): Song[] {
  return closestSongs(target, songs, distanceFn).slice(0, count)
}

/**
 * Compute a pairwise distance matrix for a list of songs.
 *
 * Returns a flat `Float32Array` of length `songs.length²` where
 * `matrix[i * n + j]` is the distance between `songs[i]` and `songs[j]`.
 */
export function distanceMatrix(
  songs: Song[],
  distanceFn: DistanceFunction = euclideanDistance,
): Float32Array<ArrayBuffer> {
  const n = songs.length
  const matrix = new Float32Array(n * n)
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const si = songs[i]
      const sj = songs[j]
      if (!si || !sj) continue
      const d = distanceFn(si.analysis.features, sj.analysis.features)
      matrix[i * n + j] = d
      matrix[j * n + i] = d
    }
  }
  return matrix
}

/**
 * Remove acoustically redundant or duplicate consecutive entries from a playlist.
 *
 * A song is dropped when it is either too similar to the previous kept song
 * (feature distance below `distanceThreshold`) or is the same track (matching
 * title and artist). Only adjacent pairs are compared — non-consecutive
 * duplicates are not removed.
 *
 * @param playlist          - Ordered list of songs to filter.
 * @param distanceThreshold - Maximum feature distance considered "too close"
 *                            (default: 0.05).
 * @param distanceFn        - Distance metric to use (default: euclidean).
 */
export function dedupPlaylist(
  playlist: Song[],
  distanceThreshold = 0.05,
  distanceFn: DistanceFunction = euclideanDistance,
): Song[] {
  if (playlist.length === 0) return []
  const first = playlist[0]
  if (!first) return []
  const result: Song[] = [first]
  for (let i = 1; i < playlist.length; i++) {
    const last = result.at(-1)
    const curr = playlist[i]
    if (!last || !curr) continue
    const tooClose =
      distanceFn(last.analysis.features, curr.analysis.features) <
      distanceThreshold
    const sameTrack =
      last.title &&
      curr.title &&
      last.artist &&
      curr.artist &&
      last.title === curr.title &&
      last.artist === curr.artist
    if (!tooClose && !sameTrack) result.push(curr)
  }
  return result
}
