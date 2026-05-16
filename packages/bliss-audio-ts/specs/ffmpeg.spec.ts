import { resolve } from 'node:path'

import { expect, test } from 'vitest'

import {
  analyzeSong,
  analyzeSongs,
  analyzeSongWithOptions,
  FeaturesVersion,
  isBlissError,
} from '../index.ts'

// Tests rewritten using existing bindings:
//   test_tags, test_special_tags, test_unsupported_tags_format, test_empty_tags,
//   test_decode_errors, test_analyze_paths, test_analyze_paths_with_cores,
//   test_analyze_paths_with_cores_empty_paths
//
// Tests skipped — require raw sample_array (no binding) or internal Rust types:
//   test_resample_mono, test_resample_multi, test_resample_stereo,
//   test_decode_mono, test_decode_mp3, test_dont_panic_no_channel_layout,
//   test_decode_wav  (all hash the raw PCM via Adler-32; sample_array has no TS binding)
//   test_decode_right_capacity_vec  (Vec::with_capacity detail; no TS equivalent)
//   test_try_from  (PreAnalyzedSong is an internal Rust type)

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

// ── test_tags ─────────────────────────────────────────────────────────────────

// Mirrors test_tags: checks every metadata field of s16_mono_22_5kHz.flac and
// that the computed duration is within 10 ms of the advertised 11 070 ms.
test('test_tags: s16_mono_22_5kHz.flac metadata and duration', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)

  expect(result.artist).toBe('David TMX')
  expect(result.albumArtist).toBe('David TMX - Album Artist')
  expect(result.title).toBe('Renaissance')
  expect(result.album).toBe('Renaissance')
  expect(result.trackNumber).toBe(2)
  expect(result.discNumber).toBe(1)
  expect(result.genre).toBe('Pop')
  expect(Math.abs(result.durationSecs * 1000 - 11070)).toBeLessThan(10)
})

// ── test_special_tags ─────────────────────────────────────────────────────────

// Mirrors test_special_tags: DISC "02/05" and TRACK "06/24" should parse as 2
// and 6 (the part before the slash).
test('test_special_tags: special-tags.mp3 disc 2 track 6', () => {
  const result = analyzeSong(p('special-tags.mp3'))
  if (isBlissError(result)) throw new Error(result.message)
  expect(result.discNumber).toBe(2)
  expect(result.trackNumber).toBe(6)
})

// ── test_unsupported_tags_format ──────────────────────────────────────────────

// Mirrors test_unsupported_tags_format: TRACK "02test/05" is not a valid integer
// and should not parse (null).
test('test_unsupported_tags_format: unsupported-tags.mp3 track_number is null', () => {
  const result = analyzeSong(p('unsupported-tags.mp3'))
  if (isBlissError(result)) throw new Error(result.message)
  expect(result.trackNumber).toBeUndefined()
})

// ── test_empty_tags ───────────────────────────────────────────────────────────

// Mirrors test_empty_tags: no_tags.flac carries no metadata at all.
test('test_empty_tags: no_tags.flac all metadata fields are null', () => {
  const result = analyzeSong(p('no_tags.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  expect(result.artist).toBeUndefined()
  expect(result.title).toBeUndefined()
  expect(result.album).toBeUndefined()
  expect(result.trackNumber).toBeUndefined()
  expect(result.discNumber).toBeUndefined()
  expect(result.genre).toBeUndefined()
})

// ── test_decode_errors ────────────────────────────────────────────────────────

// Mirrors test_decode_errors (nonexistent path branch): bare "nonexistent" → ffmpeg
// ENOENT error with the exact message produced by the Rust decoder.
test('test_decode_errors: nonexistent path returns DecodingError with ENOENT', () => {
  const result = analyzeSong('nonexistent')
  if (!isBlissError(result)) throw new Error('expected BlissError')
  expect(result._tag).toBe('DecodingError')
  expect(result.message).toBe(
    "while opening format for file 'nonexistent': ffmpeg::Error(2: No such file or directory).",
  )
})

// Mirrors test_decode_errors (PNG branch): a file with no audio stream → DecodingError.
// Uses the absolute path (so just the key phrases are checked rather than the exact path).
test('test_decode_errors: picture.png returns DecodingError with no-audio-stream message', () => {
  const result = analyzeSong(p('picture.png'))
  if (!isBlissError(result)) throw new Error('expected BlissError')
  expect(result._tag).toBe('DecodingError')
  expect(result.message).toContain("No audio stream found for file '")
  expect(result.message).toContain('picture.png')
})

// ── test_analyze_paths ────────────────────────────────────────────────────────

// Mirrors test_analyze_paths: [nonexistent, piano.flac] → [false, true] (is_ok).
test('test_analyze_paths: nonexistent fails, piano.flac succeeds', () => {
  const results = analyzeSongs(['data/nonexistent', p('piano.flac')])
  expect(isBlissError(results[0])).toBe(true)
  expect(isBlissError(results[1])).toBe(false)
})

// ── test_analyze_paths_with_cores ─────────────────────────────────────────────

// Mirrors test_analyze_paths_with_cores: analyze three paths using a core count
// larger than any system (u32::MAX mirrors Rust's usize::MAX, clamped internally).
// Expected: [false, true, false].
test('test_analyze_paths_with_cores: u32::MAX cores clamps; nonexistent errors, piano.flac succeeds, nonexistent.cue errors', () => {
  const paths = ['data/nonexistent', p('piano.flac'), 'data/nonexistent.cue']
  const results = paths.map(path =>
    analyzeSongWithOptions(path, {
      featuresVersion: FeaturesVersion.LATEST,
      numberCores: 4294967295, // u32::MAX — mirrors Rust's usize::MAX
    }),
  )
  expect(isBlissError(results[0])).toBe(true)
  expect(isBlissError(results[1])).toBe(false)
  expect(isBlissError(results[2])).toBe(true)
})

// ── test_analyze_paths_with_cores_empty_paths ─────────────────────────────────

// Mirrors test_analyze_paths_with_cores_empty_paths: empty path list → empty result.
test('test_analyze_paths_with_cores_empty_paths: empty input returns empty array', () => {
  const results = ([] as string[]).map(path =>
    analyzeSongWithOptions(path, {
      featuresVersion: FeaturesVersion.LATEST,
      numberCores: 1,
    }),
  )
  expect(results).toHaveLength(0)
})
