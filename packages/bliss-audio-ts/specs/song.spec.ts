// Tests mirrored from bliss-audio/src/song/mod.rs § #[cfg(test)] (lines 485-725):
//   test_analyze, test_analyze_with_options,
//   test_index_analysis, test_index_analysis_old_version,
//   test_analysis_index_with_wrong_version
//
// Tests skipped — require raw PCM array, Symphonia decoder, or Rust internals:
//   test_analysis_too_small          (Song::analyze(&[0.]) — no raw-array binding)
//   test_analyze_with_symphonia      (SymphoniaDecoder — no binding)
//   test_analyze_resampled_with_symphonia (SymphoniaDecoder — no binding)
//   test_debug_analysis              (Rust Debug trait formatting — no TS equivalent)
//   test_debug_analysis_v1          (Rust Debug trait formatting — no TS equivalent)
//   test_new_analysis_wrong_number_features (Analysis::new() — no binding)
//   test_debug_analysis_wrong_number_fields (Analysis internals — no binding)

import { resolve } from 'node:path'

import { expect, test } from 'vitest'

import {
  AnalysisIndex,
  AnalysisIndexV1,
  analyzeSong,
  analyzeSongWithOptions,
  FeaturesVersion,
  getFeature,
  getFeatureV1,
  isBlissError,
  NUMBER_FEATURES,
  NUMBER_FEATURES_V1,
} from '../index.ts'

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

const SONG_FILE = 's16_mono_22_5kHz.flac'

// ── test_analyze ──────────────────────────────────────────────────────────────

// Mirrors test_analyze: analyzes s16_mono_22_5kHz.flac and checks all 23
// features against pinned values, then checks features_version is LATEST.
// Rust tolerance: 1e-5.
test('test_analyze: s16_mono_22_5kHz.flac all features match expected values', () => {
  const result = analyzeSong(p(SONG_FILE))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = new Float32Array([
    0.3846389, -0.849141, -0.75481045, -0.8790748, -0.63258266, -0.7258959,
    -0.7757379, -0.8146726, 0.2716726, 0.25779057, -0.34292513, -0.62803423,
    -0.28095096, 0.08686459, 0.24446082, -0.5723257, 0.23292065, 0.19981146,
    -0.58594406, -0.06784296, -0.06000763, -0.58485717, -0.07880378,
  ])

  expect(features.length).toBe(NUMBER_FEATURES)
  for (let i = 0; i < expected.length; i++) {
    expect(Math.abs(features[i]! - expected[i]!)).toBeLessThan(1e-5)
  }
  expect(result.featuresVersion).toBe(FeaturesVersion.LATEST)
})

// ── test_analyze_with_options ─────────────────────────────────────────────────

// Mirrors test_analyze_with_options: analyzes with FeaturesVersion.Version1 and
// checks all 20 features against pinned values, then checks features_version is
// Version1. Rust tolerance: 1e-5.
test('test_analyze_with_options: s16_mono_22_5kHz.flac Version1 features match expected values', () => {
  const result = analyzeSongWithOptions(p(SONG_FILE), {
    featuresVersion: FeaturesVersion.Version1,
  })
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = new Float32Array([
    0.3846389, -0.849141, -0.75481045, -0.8790748, -0.63258266, -0.7258959,
    -0.7757379, -0.8146726, 0.2716726, 0.25779057, -0.35661936, -0.63578653,
    -0.29593682, 0.06421304, 0.21852458, -0.581239, -0.9466835, -0.9481153,
    -0.9820945, -0.95968974,
  ])

  expect(features.length).toBe(NUMBER_FEATURES_V1)
  for (let i = 0; i < expected.length; i++) {
    expect(Math.abs(features[i]! - expected[i]!)).toBeLessThan(1e-5)
  }
  expect(result.featuresVersion).toBe(FeaturesVersion.Version1)
})

// ── test_index_analysis ───────────────────────────────────────────────────────

// Mirrors test_index_analysis: checks that the named index constants resolve to
// the correct pinned values in the analyzed song.
test('test_index_analysis: Tempo and Chroma10 named indices match pinned values', () => {
  const result = analyzeSong(p(SONG_FILE))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  expect(features[AnalysisIndex.Tempo]).toBeCloseTo(0.3846389, 6)
  expect(features[AnalysisIndex.Chroma10]).toBeCloseTo(-0.06784296, 6)
})

// ── test_index_analysis_old_version ──────────────────────────────────────────

// Mirrors test_index_analysis_old_version: a Version1 feature array filled
// entirely with 1.0 should return 1.0 at both AnalysisIndexV1.Tempo (index 0)
// and AnalysisIndexV1.Chroma10 (index 19, the last V1 feature).
test('test_index_analysis_old_version: V1 all-ones array returns 1.0 at Tempo and Chroma10', () => {
  const features = new Float32Array(NUMBER_FEATURES_V1).fill(1)
  expect(features[AnalysisIndexV1.Tempo]).toBe(1)
  expect(features[AnalysisIndexV1.Chroma10]).toBe(1)
})

// ── test_analysis_index_with_wrong_version ────────────────────────────────────
//
// The Rust test panics inside Index<AnalysisIndex>::index() when analysis
// was created with Version1. That panic is NOT catchable from TypeScript:
//
//   1. Plain Float32Array indexing in TS never calls the Rust Index trait at
//      all — the features buffer is decoded into a JS Float32Array and all
//      subsequent reads are pure JavaScript.
//
//   2. Even if a future native function panicked during an FFI call, it would
//      be undefined behavior at the C boundary (Rust says "do not unwind across
//      FFI") and would most likely abort the process, not produce a catchable
//      JS Error. The current native bindings use no catch_unwind.
//
// Instead, getFeature / getFeatureV1 (exported from bliss.ts) mirror the Rust
// check in TypeScript and are the only path that can surface the message.
// The silent alternative — plain array access on a wrong-version Float32Array
// — returns undefined for out-of-bounds indices without any error.

test('test_analysis_index_with_wrong_version: getFeature throws on V1 analysis', () => {
  const analysis = {
    features: new Float32Array(NUMBER_FEATURES_V1).fill(0),
    featuresVersion: FeaturesVersion.Version1 as FeaturesVersion,
  }
  expect(() => getFeature(analysis, AnalysisIndex.Chroma13)).toThrow(
    'Tried to index features with incompatible indexes',
  )
})

test('test_analysis_index_with_wrong_version: getFeatureV1 throws on V2 analysis', () => {
  const analysis = {
    features: new Float32Array(NUMBER_FEATURES).fill(0),
    featuresVersion: FeaturesVersion.LATEST as FeaturesVersion,
  }
  expect(() => getFeatureV1(analysis, AnalysisIndexV1.Chroma10)).toThrow(
    'Tried to index features with incompatible indexes',
  )
})

test('test_analysis_index_with_wrong_version: plain array access returns undefined silently', () => {
  // Without getFeature, wrong-version access gives undefined — no error thrown.
  const features = new Float32Array(NUMBER_FEATURES_V1).fill(0)
  expect(features[AnalysisIndex.Chroma13]).toBeUndefined()
})
