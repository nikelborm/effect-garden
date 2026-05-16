import { resolve } from 'node:path'

import { beforeAll, describe, expect, test } from 'vitest'

import {
  AnalysisIndex,
  AnalysisIndexV1,
  analyzeSong,
  analyzeSongWithOptions,
  FeaturesVersion,
  isBlissError,
} from '../index.ts'

// Tests that can be rewritten using existing bindings:
//   test_chroma_desc, test_chroma_desc_version_1,
//   test_end_result_triads, test_end_l2_norm_dyad,
//   test_end_l2_norm_mode, test_end_l2_norm_ratio,
//   test_end_result_intervals, test_end_result_edge_cases
//
// Tests skipped — require private Rust functions with no bindings:
//   test_chroma_interval_features, test_extract_interval_features,
//   test_normalize_feature_sequence, test_get_values_no_values,
//   test_chroma_stft_decode, test_estimate_tuning,
//   test_chroma_estimate_tuning_empty_fix, test_estimate_tuning_decode,
//   test_pitch_tuning, test_pitch_tuning_no_frequencies,
//   test_pip_track, test_chroma_filter

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const CHROMA_DIR = resolve(DATA, 'chroma')
const p = (f: string) => resolve(DATA, f)
const c = (f: string) => resolve(CHROMA_DIR, f)

// Extract the 13 chroma interval-feature values [Chroma1..Chroma13] from a v2 vector.
function chromaFeats(features: Float32Array): Float32Array {
  return features.slice(AnalysisIndex.Chroma1, AnalysisIndex.Chroma13 + 1)
}

// Extract the 10 chroma values [Chroma1..Chroma10] from a v1 vector.
function chromaFeatsV1(features: Float32Array): Float32Array {
  return features.slice(AnalysisIndexV1.Chroma1, AnalysisIndexV1.Chroma10 + 1)
}

// ── test_chroma_desc / test_chroma_desc_version_1 ─────────────────────────────

describe('chroma descriptor on s16_mono_22_5kHz.flac', () => {
  let chromaV2: Float32Array
  let chromaV1: Float32Array

  beforeAll(() => {
    const r2 = analyzeSong(p('s16_mono_22_5kHz.flac'))
    if (isBlissError(r2)) throw new Error(r2.message)
    chromaV2 = chromaFeats(r2.analysis.features)

    const r1 = analyzeSongWithOptions(p('s16_mono_22_5kHz.flac'), {
      featuresVersion: FeaturesVersion.Version1,
    })
    if (isBlissError(r1)) throw new Error(r1.message)
    chromaV1 = chromaFeatsV1(r1.analysis.features)
  })

  // Mirrors test_chroma_desc — checks the first 10 of 13 chroma features produced
  // by get_values() (version 2) via zip with the expected slice.
  test('test_chroma_desc: first 10 chroma features match expected values', () => {
    const expected = [
      -0.34292513, -0.62803423, -0.28095096, 0.08686459, 0.24446082, -0.5723257,
      0.23292065, 0.19981146, -0.58594406, -0.06784296,
    ]
    for (const [i, exp] of expected.entries()) {
      expect(Math.abs(chromaV2[i]! - exp)).toBeLessThan(1e-7)
    }
  })

  // Mirrors test_chroma_desc_version_1 — checks all 10 chroma features produced
  // by get_values_version_1() (version 1).
  test('test_chroma_desc_version_1: all 10 chroma features match expected values', () => {
    const expected = [
      -0.35661936, -0.63578653, -0.29593682, 0.06421304, 0.21852458, -0.581239,
      -0.9466835, -0.9481153, -0.9820945, -0.95968974,
    ]
    for (const [i, exp] of expected.entries()) {
      expect(Math.abs(chromaV1[i]! - exp)).toBeLessThan(1e-7)
    }
  })
})

// ── test_end_result_triads ────────────────────────────────────────────────────

describe('test_end_result_triads', () => {
  // chroma[6]=major, [7]=minor, [8]=diminished, [9]=augmented
  const triads: [file: string, expectedDominant: number][] = [
    ['Cmaj.ogg', 6],
    ['Dmaj.ogg', 6],
    ['Cmin.ogg', 7],
    ['Cdim.ogg', 8],
    ['Caug.ogg', 9],
  ]

  for (const [file, expectedDominant] of triads) {
    test(`${file}: dominant triad is chroma[${expectedDominant}] > 0.8, rest of [6..10] < 0`, () => {
      const result = analyzeSong(c(file))
      if (isBlissError(result)) throw new Error(result.message)
      const chroma = chromaFeats(result.analysis.features)

      // Descending sort of indices — highest value should be expectedDominant.
      const indices = Array.from({ length: chroma.length }, (_, i) => i)
      indices.sort((a, b) => chroma[b]! - chroma[a]!)
      expect(indices[0]).toBe(expectedDominant)

      // Triad range [6..10]: dominant > 0.8, all others < 0.
      for (let i = 6; i <= 10; i++) {
        if (i === expectedDominant) {
          expect(chroma[i]).toBeGreaterThan(0.8)
        } else {
          expect(chroma[i]).toBeLessThan(0.0)
        }
      }
    })
  }
})

// ── test_end_l2_norm_dyad ─────────────────────────────────────────────────────

// Mirrors test_end_l2_norm_dyad — a tritone dyad maximises the l2-norm of the
// IC1-6 vector (chroma[10] = normalised_l2_norm_interval_class).
test('test_end_l2_norm_dyad: dyad_tritone_IC6 chroma[10] > 0.9', () => {
  const result = analyzeSong(c('dyad_tritone_IC6.ogg'))
  if (isBlissError(result)) throw new Error(result.message)
  const chroma = chromaFeats(result.analysis.features)
  expect(chroma[10]).toBeGreaterThan(0.9)
})

// ── test_end_l2_norm_mode ─────────────────────────────────────────────────────

// Mirrors test_end_l2_norm_mode — repeated major triads maximise the l2-norm of
// the IC7-10 (triad) vector (chroma[11] = normalised_l2_norm_interval_class_mode).
test('test_end_l2_norm_mode: Cmaj_triads chroma[11] > 0.9', () => {
  const result = analyzeSong(c('Cmaj_triads.ogg'))
  if (isBlissError(result)) throw new Error(result.message)
  const chroma = chromaFeats(result.analysis.features)
  expect(chroma[11]).toBeGreaterThan(0.9)
})

// ── test_end_l2_norm_ratio ────────────────────────────────────────────────────

// Mirrors test_end_l2_norm_ratio — an augmented triad designed to maximise the
// triad/dyad ratio (chroma[12] = atan2-based normalised ratio).
test('test_end_l2_norm_ratio: triad_aug_maximize_ratio chroma[12] > 0.7', () => {
  const result = analyzeSong(c('triad_aug_maximize_ratio.ogg'))
  if (isBlissError(result)) throw new Error(result.message)
  const chroma = chromaFeats(result.analysis.features)
  expect(chroma[12]).toBeGreaterThan(0.7)
})

// ── test_end_result_intervals ─────────────────────────────────────────────────

describe('test_end_result_intervals', () => {
  // chroma[0..5] = IC1-6: minor-2nd, major-2nd, minor-3rd, major-3rd, P4/P5, tritone
  const intervals: [file: string, expectedDominant: number][] = [
    ['minor_second.ogg', 0],
    ['major_second.ogg', 1],
    ['minor_third.ogg', 2],
    ['major_third.ogg', 3],
    ['perfect_fourth.ogg', 4],
    ['perfect_fifth.ogg', 4],
    ['tritone.ogg', 5],
    ['minor_sixth.ogg', 3],
    ['major_sixth.ogg', 2],
    ['minor_seventh.ogg', 1],
    ['major_seventh.ogg', 0],
  ]

  for (const [file, expectedDominant] of intervals) {
    test(`${file}: dominant interval class is chroma[${expectedDominant}] > 0.9, rest of [0..5] < 0`, () => {
      const result = analyzeSong(c(file))
      if (isBlissError(result)) throw new Error(result.message)
      const chroma = chromaFeats(result.analysis.features)

      // Descending sort of indices — highest value should be expectedDominant.
      const indices = Array.from({ length: chroma.length }, (_, i) => i)
      indices.sort((a, b) => chroma[b]! - chroma[a]!)
      expect(indices[0]).toBe(expectedDominant)

      // IC range [0..5]: dominant > 0.9, all others < 0.
      for (let i = 0; i < 6; i++) {
        if (i === expectedDominant) {
          expect(chroma[i]).toBeGreaterThan(0.9)
        } else {
          expect(chroma[i]).toBeLessThan(0.0)
        }
      }
    })
  }
})

// ── test_end_result_edge_cases ────────────────────────────────────────────────

describe('test_end_result_edge_cases', () => {
  const cases: [file: string, expectedFirstTen: number[]][] = [
    // Silence → all IC values near the same small negative number; triads zero.
    [
      'silence.ogg',
      [
        -0.18350339, -0.18350339, -0.18350339, -0.18350339, -0.18350339,
        -0.18350339, 0.0, 0.0, 0.0, 0.0,
      ],
    ],
    // White noise → all bins ~equal energy, so IC values are small and similar.
    [
      'white_noise.mp3',
      [
        -0.17531848, -0.1804418, -0.18354797, -0.18585062, -0.1875512,
        -0.18838519, -0.00026643276, -0.0002770424, 0.0016055107, -0.0010639429,
      ],
    ],
  ]

  for (const [file, expectedValues] of cases) {
    test(`${file}: first 10 chroma features match expected values`, () => {
      const result = analyzeSong(p(file))
      if (isBlissError(result)) throw new Error(result.message)
      const chroma = chromaFeats(result.analysis.features)
      for (const [i, exp] of expectedValues.entries()) {
        expect(Math.abs(chroma[i]! - exp)).toBeLessThan(1e-7)
      }
    })
  }
})
