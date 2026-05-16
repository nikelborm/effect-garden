import { resolve } from 'node:path'

import { beforeAll, describe, expect, test } from 'vitest'

import {
  analyzeCue,
  analyzeCueWithOptions,
  type BlissError,
  FeaturesVersion,
  isBlissError,
  type Song,
} from '../index.ts'

// Tests mirrored from bliss-audio/src/cue.rs § #[cfg(test)]:
//   test_empty_cue, test_cue_analysis, test_cue_analysis_with_options, test_cue_minimal
//
// Tests skipped — require private Rust internals with no bindings:
//   (none; all four public-facing CUE tests are expressible via analyzeCue /
//    analyzeCueWithOptions)

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (f: string) => resolve(DATA, f)

// Compare every element of a Float32Array against expected f32 literals with
// the same tolerance used in the chroma tests (1 ULP at f32 precision ≈ 1e-7).
function expectFeaturesClose(
  actual: Float32Array,
  expected: readonly number[],
) {
  for (const [i, exp] of expected.entries()) {
    expect(Math.abs(actual[i]! - exp)).toBeLessThan(1e-7)
  }
}

// ── test_empty_cue ────────────────────────────────────────────────────────────

// Mirrors test_empty_cue: the CUE file itself parses fine, but empty.wav
// produces no audio samples, so songs[0] must be a DecodingError with the
// "empty audio file associated to CUE sheet" message.
test("test_empty_cue: songs[0] is DecodingError 'empty audio file associated to CUE sheet'", () => {
  const result = analyzeCue(p('empty.cue'))
  if (isBlissError(result)) throw new Error(result.message)
  const s0 = result.songs[0]
  if (!isBlissError(s0)) throw new Error('expected BlissError for songs[0]')
  expect(s0._tag).toBe('DecodingError')
  expect(s0.message).toBe('empty audio file associated to CUE sheet')
})

// ── test_cue_analysis ─────────────────────────────────────────────────────────

// Mirrors test_cue_analysis: full analysis of testcue.cue, checking all
// metadata and pinned feature vectors for each of the 3 tracks extracted from
// testcue.flac, plus the DecodingError produced for not-existing.wav.
describe('test_cue_analysis: testcue.cue', () => {
  let songs: ReadonlyArray<Song | BlissError>

  beforeAll(() => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    songs = result.songs
  })

  test('returns 4 track results (3 from testcue.flac + 1 error for not-existing.wav)', () => {
    expect(songs).toHaveLength(4)
  })

  // ── Track 1 ──────────────────────────────────────────────────────────────

  test('track 1: is a Song (not a BlissError)', () => {
    expect(isBlissError(songs[0])).toBe(false)
  })

  test('track 1: path', () => {
    const s = songs[0] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK001`)
  })

  test('track 1: metadata', () => {
    const s = songs[0] as Song
    expect(s.album).toBe('Album for CUE test')
    expect(s.artist).toBe('David TMX')
    expect(s.albumArtist).toBe('Polochon_street')
    expect(s.title).toBe('Renaissance')
    expect(s.genre).toBe('Random')
    expect(s.trackNumber).toBe(1)
    expect(s.discNumber).toBe(1)
  })

  test('track 1: featuresVersion is LATEST', () => {
    const s = songs[0] as Song
    expect(s.featuresVersion).toBe(FeaturesVersion.LATEST)
    expect(s.analysis.featuresVersion).toBe(FeaturesVersion.LATEST)
  })

  test('track 1: duration ≈ 11.0667 s', () => {
    const s = songs[0] as Song
    expect(Math.abs(s.durationSecs - 11.066666603)).toBeLessThan(1e-4)
  })

  test('track 1: cueInfo', () => {
    const s = songs[0] as Song
    expect(s.cueInfo).not.toBeUndefined()
    expect(s.cueInfo?.cuePath).toBe(p('testcue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 1: all 23 features match pinned values', () => {
    const s = songs[0] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.38463724, -0.85219246, -0.761946, -0.8904667, -0.63892543,
        -0.73945934, -0.8004017, -0.8237293, 0.33865356, 0.32481194, -0.3433048,
        -0.6278722, -0.2809375, 0.08685577, 0.24455929, -0.5721703, 0.23292911,
        0.19979906, -0.5859135, -0.06785172, -0.05990714, -0.58482605,
        -0.078823924,
      ],
    )
  })

  // ── Track 2 ──────────────────────────────────────────────────────────────

  test('track 2: is a Song (not a BlissError)', () => {
    expect(isBlissError(songs[1])).toBe(false)
  })

  test('track 2: path', () => {
    const s = songs[1] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK002`)
  })

  test('track 2: metadata', () => {
    const s = songs[1] as Song
    expect(s.album).toBe('Album for CUE test')
    expect(s.artist).toBe('Polochon_street')
    expect(s.albumArtist).toBe('Polochon_street')
    expect(s.title).toBe('Piano')
    expect(s.genre).toBe('Random')
    expect(s.trackNumber).toBe(2)
    expect(s.discNumber).toBe(1)
  })

  test('track 2: duration ≈ 5.8533 s', () => {
    const s = songs[1] as Song
    expect(Math.abs(s.durationSecs - 5.853333473)).toBeLessThan(1e-4)
  })

  test('track 2: cueInfo', () => {
    const s = songs[1] as Song
    expect(s.cueInfo?.cuePath).toBe(p('testcue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 2: all 23 features match pinned values', () => {
    const s = songs[1] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.18622077, -0.5989029, -0.5554645, -0.6343865, -0.24163479,
        -0.25766593, -0.40616858, -0.23334873, 0.76875293, 0.7785741,
        -0.10609609, -0.14194643, -0.21418405, -0.21676934, -0.20846015,
        -0.22077763, -0.0002696514, -0.00034928322, 0.0003143549, 0.00030446053,
        -0.47109652, -0.66400576, 0.15099311,
      ],
    )
  })

  // ── Track 3 ──────────────────────────────────────────────────────────────

  test('track 3: is a Song (not a BlissError)', () => {
    expect(isBlissError(songs[2])).toBe(false)
  })

  test('track 3: path', () => {
    const s = songs[2] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK003`)
  })

  test('track 3: metadata', () => {
    const s = songs[2] as Song
    expect(s.album).toBe('Album for CUE test')
    expect(s.artist).toBe('Polochon_street')
    expect(s.albumArtist).toBe('Polochon_street')
    expect(s.title).toBe('Tone')
    expect(s.genre).toBe('Random')
    expect(s.trackNumber).toBe(3)
    expect(s.discNumber).toBe(1)
  })

  test('track 3: duration ≈ 5.5867 s', () => {
    const s = songs[2] as Song
    expect(Math.abs(s.durationSecs - 5.586666584)).toBeLessThan(1e-4)
  })

  test('track 3: cueInfo', () => {
    const s = songs[2] as Song
    expect(s.cueInfo?.cuePath).toBe(p('testcue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 3: all 23 features match pinned values', () => {
    const s = songs[2] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.0024261475, 0.9874661, 0.97330654, -0.9724426, 0.99678576, -0.9961549,
        -0.9840142, -0.9269961, 0.7498772, 0.22429907, 0.9990841, -0.9723601,
        -0.973079, -0.97307926, -0.97308147, -0.9730794, -2.783537e-5,
        -2.7775764e-5, 3.1113625e-5, 2.4557114e-5, -0.9210111, -0.99999785,
        -0.99993163,
      ],
    )
  })

  // ── Track 4 (error) ───────────────────────────────────────────────────────

  test('track 4: is a DecodingError (not-existing.wav missing)', () => {
    const s4 = songs[3]
    if (!isBlissError(s4)) throw new Error('expected BlissError for track 4')
    expect(s4._tag).toBe('DecodingError')
  })
})

// ── test_cue_analysis_with_options ────────────────────────────────────────────

// Mirrors test_cue_analysis_with_options: same CUE file analyzed with
// FeaturesVersion.Version1 — checks path, all 20 pinned features, and
// featuresVersion on each of the 3 successful tracks.
describe('test_cue_analysis_with_options: testcue.cue with Version1', () => {
  let songs: ReadonlyArray<Song | BlissError>

  beforeAll(() => {
    const result = analyzeCueWithOptions(p('testcue.cue'), {
      featuresVersion: FeaturesVersion.Version1,
    })
    if (isBlissError(result)) throw new Error(result.message)
    songs = result.songs
  })

  test('track 1: path', () => {
    const s = songs[0] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK001`)
  })

  test('track 1: featuresVersion is Version1', () => {
    const s = songs[0] as Song
    expect(s.featuresVersion).toBe(FeaturesVersion.Version1)
    expect(s.analysis.featuresVersion).toBe(FeaturesVersion.Version1)
  })

  test('track 1: all 20 Version1 features match pinned values', () => {
    const s = songs[0] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.38463724, -0.85219246, -0.761946, -0.8904667, -0.63892543,
        -0.73945934, -0.8004017, -0.8237293, 0.33865356, 0.32481194,
        -0.35692245, -0.6355889, -0.29584837, 0.06431806, 0.21875131,
        -0.58104205, -0.9466792, -0.94811195, -0.9820919, -0.9596871,
      ],
    )
  })

  test('track 2: path', () => {
    const s = songs[1] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK002`)
  })

  test('track 2: featuresVersion is Version1', () => {
    const s = songs[1] as Song
    expect(s.featuresVersion).toBe(FeaturesVersion.Version1)
  })

  test('track 2: all 20 Version1 features match pinned values', () => {
    const s = songs[1] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.18622077, -0.5989029, -0.5554645, -0.6343865, -0.24163479,
        -0.25766593, -0.40616858, -0.23334873, 0.76875293, 0.7785741,
        -0.5075115, -0.5272629, -0.56706166, -0.568486, -0.5639081, -0.5706943,
        -0.96501005, -0.96501285, -0.9649896, -0.96498996,
      ],
    )
  })

  test('track 3: path', () => {
    const s = songs[2] as Song
    expect(s.path).toBe(`${p('testcue.cue')}/CUE_TRACK003`)
  })

  test('track 3: featuresVersion is Version1', () => {
    const s = songs[2] as Song
    expect(s.featuresVersion).toBe(FeaturesVersion.Version1)
  })

  test('track 3: all 20 Version1 features match pinned values', () => {
    const s = songs[2] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.0024261475, 0.9874661, 0.97330654, -0.9724426, 0.99678576, -0.9961549,
        -0.9840142, -0.9269961, 0.7498772, 0.22429907, -0.8355152, -0.9977258,
        -0.9977849, -0.997785, -0.99778515, -0.997785, -0.99999976, -0.99999976,
        -0.99999976, -0.99999976,
      ],
    )
  })
})

// ── test_cue_minimal ──────────────────────────────────────────────────────────

// Mirrors test_cue_minimal: no-tags-cue.cue has no album, genre, albumArtist,
// or discNumber tags. The same testcue.flac audio is used, so feature values
// are identical to those in test_cue_analysis.
describe('test_cue_minimal: no-tags-cue.cue', () => {
  let songs: ReadonlyArray<Song | BlissError>

  beforeAll(() => {
    const result = analyzeCue(p('no-tags-cue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    songs = result.songs
  })

  test('returns 4 track results', () => {
    expect(songs).toHaveLength(4)
  })

  // ── Track 1 ──────────────────────────────────────────────────────────────

  test('track 1: is a Song', () => {
    expect(isBlissError(songs[0])).toBe(false)
  })

  test('track 1: path', () => {
    const s = songs[0] as Song
    expect(s.path).toBe(`${p('no-tags-cue.cue')}/CUE_TRACK001`)
  })

  test('track 1: null tag fields (no album/genre/albumArtist/discNumber in CUE)', () => {
    const s = songs[0] as Song
    expect(s.album).toBeUndefined()
    expect(s.genre).toBeUndefined()
    expect(s.albumArtist).toBeUndefined()
    expect(s.discNumber).toBeUndefined()
  })

  test('track 1: present tag fields', () => {
    const s = songs[0] as Song
    expect(s.artist).toBe('David TMX')
    expect(s.title).toBe('Renaissance')
    expect(s.trackNumber).toBe(1)
  })

  test('track 1: duration ≈ 11.0667 s', () => {
    const s = songs[0] as Song
    expect(Math.abs(s.durationSecs - 11.066666603)).toBeLessThan(1e-4)
  })

  test('track 1: cueInfo', () => {
    const s = songs[0] as Song
    expect(s.cueInfo?.cuePath).toBe(p('no-tags-cue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 1: all 23 features match pinned values (same audio as testcue track 1)', () => {
    const s = songs[0] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.38463724, -0.85219246, -0.761946, -0.8904667, -0.63892543,
        -0.73945934, -0.8004017, -0.8237293, 0.33865356, 0.32481194, -0.3433048,
        -0.6278722, -0.2809375, 0.08685577, 0.24455929, -0.5721703, 0.23292911,
        0.19979906, -0.5859135, -0.06785172, -0.05990714, -0.58482605,
        -0.078823924,
      ],
    )
  })

  // ── Track 2 ──────────────────────────────────────────────────────────────

  test('track 2: is a Song', () => {
    expect(isBlissError(songs[1])).toBe(false)
  })

  test('track 2: path', () => {
    const s = songs[1] as Song
    expect(s.path).toBe(`${p('no-tags-cue.cue')}/CUE_TRACK002`)
  })

  test('track 2: null tag fields', () => {
    const s = songs[1] as Song
    expect(s.album).toBeUndefined()
    expect(s.genre).toBeUndefined()
    expect(s.albumArtist).toBeUndefined()
    expect(s.discNumber).toBeUndefined()
  })

  test('track 2: present tag fields', () => {
    const s = songs[1] as Song
    expect(s.artist).toBe('Polochon_street')
    expect(s.title).toBe('Piano')
    expect(s.trackNumber).toBe(2)
  })

  test('track 2: duration ≈ 5.8533 s', () => {
    const s = songs[1] as Song
    expect(Math.abs(s.durationSecs - 5.853333473)).toBeLessThan(1e-4)
  })

  test('track 2: cueInfo', () => {
    const s = songs[1] as Song
    expect(s.cueInfo?.cuePath).toBe(p('no-tags-cue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 2: all 23 features match pinned values', () => {
    const s = songs[1] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.18622077, -0.5989029, -0.5554645, -0.6343865, -0.24163479,
        -0.25766593, -0.40616858, -0.23334873, 0.76875293, 0.7785741,
        -0.10609609, -0.14194643, -0.21418405, -0.21676934, -0.20846015,
        -0.22077763, -0.0002696514, -0.00034928322, 0.0003143549, 0.00030446053,
        -0.47109652, -0.66400576, 0.15099311,
      ],
    )
  })

  // ── Track 3 ──────────────────────────────────────────────────────────────

  test('track 3: is a Song', () => {
    expect(isBlissError(songs[2])).toBe(false)
  })

  test('track 3: path', () => {
    const s = songs[2] as Song
    expect(s.path).toBe(`${p('no-tags-cue.cue')}/CUE_TRACK003`)
  })

  test('track 3: null tag fields', () => {
    const s = songs[2] as Song
    expect(s.album).toBeUndefined()
    expect(s.genre).toBeUndefined()
    expect(s.albumArtist).toBeUndefined()
    expect(s.discNumber).toBeUndefined()
  })

  test('track 3: present tag fields', () => {
    const s = songs[2] as Song
    expect(s.artist).toBe('Polochon_street')
    expect(s.title).toBe('Tone')
    expect(s.trackNumber).toBe(3)
  })

  test('track 3: duration ≈ 5.5867 s', () => {
    const s = songs[2] as Song
    expect(Math.abs(s.durationSecs - 5.586666584)).toBeLessThan(1e-4)
  })

  test('track 3: cueInfo', () => {
    const s = songs[2] as Song
    expect(s.cueInfo?.cuePath).toBe(p('no-tags-cue.cue'))
    expect(s.cueInfo?.audioFilePath).toBe(p('testcue.flac'))
  })

  test('track 3: all 23 features match pinned values', () => {
    const s = songs[2] as Song
    expectFeaturesClose(
      s.analysis.features,
      [
        0.0024261475, 0.9874661, 0.97330654, -0.9724426, 0.99678576, -0.9961549,
        -0.9840142, -0.9269961, 0.7498772, 0.22429907, 0.9990841, -0.9723601,
        -0.973079, -0.97307926, -0.97308147, -0.9730794, -2.783537e-5,
        -2.7775764e-5, 3.1113625e-5, 2.4557114e-5, -0.9210111, -0.99999785,
        -0.99993163,
      ],
    )
  })

  // ── Track 4 (error) ───────────────────────────────────────────────────────

  test('track 4: is a DecodingError (not-existing.wav missing)', () => {
    const s4 = songs[3]
    if (!isBlissError(s4)) throw new Error('expected BlissError for track 4')
    expect(s4._tag).toBe('DecodingError')
  })
})
