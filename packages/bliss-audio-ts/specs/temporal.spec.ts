import { resolve } from 'node:path'

import { expect, test } from 'vitest'

import { AnalysisIndex, analyzeSong, isBlissError } from '../index.ts'

// Tests that can be rewritten using existing bindings:
//   test_tempo_real
//
// Tests skipped — require direct access to BPMDesc internals (no binding):
//   test_tempo_error_creating_aubio_tempo (calls BPMDesc::new(0) directly)
//   test_tempo_artificial (feeds raw PCM chunks to BPMDesc.do_() directly)
//   test_tempo_boundaries (feeds raw PCM chunks to BPMDesc.do_() directly)

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

// ── test_tempo_real ───────────────────────────────────────────────────────────

// Mirrors test_tempo_real: analyzes s16_mono_22_5kHz.flac and checks the Tempo
// feature against the pinned value. Rust tolerance: 0.01.
test('test_tempo_real: s16_mono_22_5kHz.flac Tempo feature matches expected value', () => {
  const result = analyzeSong(p('s16_mono_22_5kHz.flac'))
  if (isBlissError(result)) throw new Error(result.message)
  expect(
    Math.abs(result.analysis.features[AnalysisIndex.Tempo]! - 0.378605),
  ).toBeLessThan(0.01)
})
