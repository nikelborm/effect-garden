import { resolve } from 'node:path'

import { expect, test } from 'vitest'

import { AnalysisIndex, analyzeSong, isBlissError } from '../index.ts'

// Tests that can be rewritten using existing bindings:
//   test_zcr, test_spectral_flatness, test_spectral_roll_off, test_spectral_centroid,
//   data-file portions of test_spectral_flatness_boundaries,
//   test_spectral_roll_off_boundaries, test_spectral_centroid_boundaries
//
// Tests skipped — require direct access to ZeroCrossingRateDesc / SpectralDesc
// internals (feeding raw PCM chunks; no bindings exist):
//   test_zcr_boundaries (entire test)
//   test_spectral_flatness_boundaries   — zero-chunk portion only
//   test_spectral_roll_off_boundaries   — zero-chunk portion only
//   test_spectral_centroid_boundaries   — zero-chunk portion only

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

// ── test_zcr ──────────────────────────────────────────────────────────────────

// Mirrors test_zcr: analyzes s16_mono_22_5kHz.flac and checks the ZCR feature.
// Rust tolerance: 0.001; widened to 0.002 for f32/f64 accumulation differences.
test('test_zcr: s16_mono_22_5kHz.flac Zcr feature matches expected value', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  expect(
    Math.abs(result.analysis.features[AnalysisIndex.Zcr]! - -0.85036),
  ).toBeLessThan(0.002)
})

// ── test_spectral_flatness ────────────────────────────────────────────────────

// Mirrors test_spectral_flatness: analyzes s16_mono_22_5kHz.flac and checks the
// two flatness features (mean + std deviation). Rust tolerance: 0.01.
test('test_spectral_flatness: s16_mono_22_5kHz.flac flatness features match expected values', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [-0.77610075, -0.8148179]
  const indices = [
    AnalysisIndex.MeanSpectralFlatness,
    AnalysisIndex.StdDeviationSpectralFlatness,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.01)
  }
})

// ── test_spectral_flatness_boundaries (white_noise.mp3 data portion) ──────────

// Mirrors the white_noise.mp3 branch of test_spectral_flatness_boundaries.
// White noise should have a flatness close to 1 (mean near +1, std near -1).
// Rust tolerance: 0.001.
// The zero-chunk branch requires SpectralDesc internals — skipped.
test('test_spectral_flatness_boundaries: white_noise.mp3 flatness features match expected values', () => {
  const result = analyzeSong(p('white_noise.mp3'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [0.5785303, -0.9426308]
  const indices = [
    AnalysisIndex.MeanSpectralFlatness,
    AnalysisIndex.StdDeviationSpectralFlatness,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.001)
  }
})

// ── test_spectral_roll_off ────────────────────────────────────────────────────

// Mirrors test_spectral_roll_off: analyzes s16_mono_22_5kHz.flac and checks the
// two roll-off features (mean + std deviation). Rust tolerance: 0.01.
test('test_spectral_roll_off: s16_mono_22_5kHz.flac rolloff features match expected values', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [-0.6326486, -0.7260933]
  const indices = [
    AnalysisIndex.MeanSpectralRolloff,
    AnalysisIndex.StdDeviationSpectralRolloff,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.01)
  }
})

// ── test_spectral_roll_off_boundaries (tone_11080Hz.flac data portion) ────────

// Mirrors the tone_11080Hz.flac branch of test_spectral_roll_off_boundaries.
// A pure 11080 Hz tone should roll off near the Nyquist limit. Rust tolerance: 0.0001.
// The zero-chunk branch requires SpectralDesc internals — skipped.
test('test_spectral_roll_off_boundaries: tone_11080Hz.flac rolloff features match expected values', () => {
  const result = analyzeSong(p('tone_11080Hz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [0.9967681, -0.99615175]
  const indices = [
    AnalysisIndex.MeanSpectralRolloff,
    AnalysisIndex.StdDeviationSpectralRolloff,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.0001)
  }
})

// ── test_spectral_centroid ────────────────────────────────────────────────────

// Mirrors test_spectral_centroid: analyzes s16_mono_22_5kHz.flac and checks the
// two centroid features (mean + std deviation). Rust tolerance: 0.0001.
test('test_spectral_centroid: s16_mono_22_5kHz.flac centroid features match expected values', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [-0.75483, -0.87916887]
  const indices = [
    AnalysisIndex.MeanSpectralCentroid,
    AnalysisIndex.StdDeviationSpectralCentroid,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.0001)
  }
})

// ── test_spectral_centroid_boundaries (tone_11080Hz.flac data portion) ────────

// Mirrors the tone_11080Hz.flac branch of test_spectral_centroid_boundaries.
// A pure 11080 Hz tone should have a centroid near the Nyquist limit.
// Rust tolerance: 0.00001; widened to 0.0001 for f32/f64 accumulation differences.
// The zero-chunk branch requires SpectralDesc internals — skipped.
test('test_spectral_centroid_boundaries: tone_11080Hz.flac centroid features match expected values', () => {
  const result = analyzeSong(p('tone_11080Hz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [0.97266, -0.9609926]
  const indices = [
    AnalysisIndex.MeanSpectralCentroid,
    AnalysisIndex.StdDeviationSpectralCentroid,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.0001)
  }
})
