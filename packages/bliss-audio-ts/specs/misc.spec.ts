import { resolve } from 'node:path'

import { expect, test } from 'vitest'

import { AnalysisIndex, analyzeSong, isBlissError } from '../index.ts'

// Tests that can be rewritten using existing bindings:
//   test_loudness
//
// Tests skipped — require direct access to LoudnessDesc internals (no binding):
//   test_loudness_boundaries (feeds raw PCM chunks to LoudnessDesc.do_() directly)

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

// ── test_loudness ─────────────────────────────────────────────────────────────

// Mirrors test_loudness: analyzes s16_mono_22_5kHz.flac and checks the two
// loudness features (MeanLoudness, StdDeviationLoudness) against pinned values.
// Rust tolerance: 0.01.
test('test_loudness: s16_mono_22_5kHz.flac MeanLoudness and StdDeviationLoudness match expected values', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  const features = result.analysis.features

  const expected = [0.271263, 0.2577181]
  const indices = [
    AnalysisIndex.MeanLoudness,
    AnalysisIndex.StdDeviationLoudness,
  ]

  for (const [i, idx] of indices.entries()) {
    expect(Math.abs(features[idx]! - expected[i]!)).toBeLessThan(0.01)
  }
})
