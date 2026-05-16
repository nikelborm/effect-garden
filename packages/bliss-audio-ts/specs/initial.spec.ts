import { resolve } from 'node:path'

import { beforeAll, describe, expect, test } from 'vitest'

import {
  AnalysisIndex,
  AnalysisIndexV1,
  analyzeCue,
  analyzeCueWithOptions,
  analyzeSong,
  analyzeSongs,
  analyzeSongsSafe,
  analyzeSongWithOptions,
  buildPlaylist,
  closestAlbumToGroup,
  closestSongs,
  cosineDistance,
  decodeAnalysis,
  decodeCueResult,
  decodeSong,
  decodeSongResult,
  dedupPlaylist,
  distanceMatrix,
  encodeAnalysisOptions,
  euclideanDistance,
  FeaturesVersion,
  isBlissError,
  mahalanobisDistance,
  mahalanobisDistanceBuilder,
  NUMBER_FEATURES,
  NUMBER_FEATURES_V1,
  type RawCueResult,
  type RawSongResult,
  type Song,
  songToSong,
} from '../index.ts'

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')
const p = (file: string) => resolve(DATA, file)

// ── Analyzed songs (shared across tests) ─────────────────────────────────────

let songPiano: Song
let songMono: Song
let songStereo: Song
let songNoTags: Song

beforeAll(() => {
  const r1 = analyzeSong(p('piano.flac'))
  const r2 = analyzeSong(p('s16_mono_22_5kHz.flac'))
  const r3 = analyzeSong(p('s32_stereo_44_1_kHz.flac'))
  const r4 = analyzeSong(p('no_tags.flac'))
  if (isBlissError(r1)) throw new Error(`piano: ${r1.message}`)
  if (isBlissError(r2)) throw new Error(`mono: ${r2.message}`)
  if (isBlissError(r3)) throw new Error(`stereo: ${r3.message}`)
  if (isBlissError(r4)) throw new Error(`no_tags: ${r4.message}`)
  songPiano = r1
  songMono = r2
  songStereo = r3
  songNoTags = r4
})

// ── Constants ─────────────────────────────────────────────────────────────────

describe('constants', () => {
  test('NUMBER_FEATURES', () => {
    expect(NUMBER_FEATURES).toMatchSnapshot()
  })

  test('NUMBER_FEATURES_V1', () => {
    expect(NUMBER_FEATURES_V1).toMatchSnapshot()
  })

  test('FeaturesVersion', () => {
    expect(FeaturesVersion).toMatchSnapshot()
  })

  test('AnalysisIndex', () => {
    expect(AnalysisIndex).toMatchSnapshot()
  })

  test('AnalysisIndexV1', () => {
    expect(AnalysisIndexV1).toMatchSnapshot()
  })
})

// ── isBlissError ──────────────────────────────────────────────────────────────

describe('isBlissError', () => {
  test('DecodingError is a BlissError', () => {
    expect(isBlissError({ _tag: 'DecodingError', message: 'x' })).toBe(true)
  })

  test('AnalysisError is a BlissError', () => {
    expect(isBlissError({ _tag: 'AnalysisError', message: 'x' })).toBe(true)
  })

  test('ProviderError is a BlissError', () => {
    expect(isBlissError({ _tag: 'ProviderError', message: 'x' })).toBe(true)
  })

  test('plain object is not a BlissError', () => {
    expect(isBlissError({ foo: 'bar' })).toBe(false)
  })

  test('null is not a BlissError', () => {
    expect(isBlissError(null)).toBe(false)
  })

  test('string is not a BlissError', () => {
    expect(isBlissError('error')).toBe(false)
  })

  test('unknown _tag is not a BlissError', () => {
    expect(isBlissError({ _tag: 'SomeOtherError', message: 'x' })).toBe(false)
  })
})

// ── encodeAnalysisOptions ─────────────────────────────────────────────────────

describe('encodeAnalysisOptions', () => {
  test('V2 with explicit cores', () => {
    expect(
      encodeAnalysisOptions({
        featuresVersion: FeaturesVersion.Version2,
        numberCores: 4,
      }),
    ).toEqual([2, 4])
  })

  test('V1 with no cores defaults to 0', () => {
    expect(
      encodeAnalysisOptions({ featuresVersion: FeaturesVersion.Version1 }),
    ).toEqual([1, 0])
  })

  test('LATEST with undefined cores defaults to 0', () => {
    expect(
      encodeAnalysisOptions({
        featuresVersion: FeaturesVersion.LATEST,
        numberCores: undefined,
      }),
    ).toEqual([FeaturesVersion.LATEST, 0])
  })
})

// ── decodeAnalysis ────────────────────────────────────────────────────────────

describe('decodeAnalysis', () => {
  test('produces Float32Array with correct length and version', () => {
    const features = Array.from({ length: 5 }, (_, i) => i * 0.1)
    const result = decodeAnalysis(features, 2)
    expect(result.featuresVersion).toBe(2)
    expect(result.features).toBeInstanceOf(Float32Array)
    expect(result.features.length).toBe(5)
  })

  test('values round-trip through Float32Array precision', () => {
    const features = [0.5, 0.25, 0.125]
    const result = decodeAnalysis(features, 1)
    expect(Array.from(result.features)).toMatchSnapshot()
  })
})

// ── decodeSong ────────────────────────────────────────────────────────────────

describe('decodeSong', () => {
  const rawSong: RawSongResult = {
    path: '/music/test.flac',
    artist: 'Artist',
    title: 'Title',
    album: 'Album',
    album_artist: 'AlbumArtist',
    track_number: 3,
    disc_number: 1,
    genre: 'Jazz',
    duration_secs: 123.456,
    features: [0.1, 0.2, 0.3],
    features_version: 2,
  }

  test('maps all fields from snake_case to camelCase', () => {
    const song = decodeSong(rawSong)
    expect(song.path).toBe('/music/test.flac')
    expect(song.albumArtist).toBe('AlbumArtist')
    expect(song.trackNumber).toBe(3)
    expect(song.discNumber).toBe(1)
    expect(song.durationSecs).toBe(123.456)
    expect(song.featuresVersion).toBe(2)
    expect(song.cueInfo).toBeUndefined()
  })

  test('maps cueInfo when present', () => {
    const withCue: RawSongResult = {
      ...rawSong,
      cue_info: { cue_path: '/a.cue', audio_file_path: '/a.flac' },
    }
    const song = decodeSong(withCue)
    expect(song.cueInfo).toEqual({
      cuePath: '/a.cue',
      audioFilePath: '/a.flac',
    })
  })

  test('absent optional fields are undefined', () => {
    const minimal: RawSongResult = {
      path: rawSong.path,
      duration_secs: rawSong.duration_secs,
      features: rawSong.features,
      features_version: rawSong.features_version,
    }
    const song = decodeSong(minimal)
    expect(song.artist).toBeUndefined()
    expect(song.albumArtist).toBeUndefined()
    expect(song.trackNumber).toBeUndefined()
  })
})

// ── decodeSongResult ──────────────────────────────────────────────────────────

describe('decodeSongResult', () => {
  test('returns Song when no error', () => {
    const raw: RawSongResult = {
      path: '/x.flac',
      duration_secs: 1,
      features: [0],
      features_version: 2,
    }
    const result = decodeSongResult(raw)
    expect(isBlissError(result)).toBe(false)
  })

  test('returns DecodingError when error_tag is DecodingError', () => {
    const raw: RawSongResult = {
      path: '/bad.flac',
      duration_secs: 0,
      features: [],
      features_version: 2,
      error: 'file not found',
      error_tag: 'DecodingError',
    }
    const result = decodeSongResult(raw)
    if (!isBlissError(result)) throw new Error('expected BlissError')
    expect(result._tag).toBe('DecodingError')
    expect(result.message).toBe('file not found')
  })

  test('returns AnalysisError when error_tag is AnalysisError', () => {
    const raw: RawSongResult = {
      path: '/bad.flac',
      duration_secs: 0,
      features: [],
      features_version: 2,
      error: 'too short',
      error_tag: 'AnalysisError',
    }
    const result = decodeSongResult(raw)
    if (!isBlissError(result)) throw new Error('expected BlissError')
    expect(result._tag).toBe('AnalysisError')
  })
})

// ── decodeCueResult ───────────────────────────────────────────────────────────

describe('decodeCueResult', () => {
  test('returns BlissError when top-level cue error', () => {
    const raw: RawCueResult = {
      error: 'cannot parse cue',
      error_tag: 'DecodingError',
    }
    const result = decodeCueResult(raw)
    expect(isBlissError(result)).toBe(true)
  })

  test('returns CueSongsResult with empty songs when songs absent', () => {
    const raw: RawCueResult = {}
    const result = decodeCueResult(raw)
    if (isBlissError(result)) throw new Error(result.message)
    expect(result.songs).toHaveLength(0)
  })

  test('embeds per-track BlissError inside CueSongsResult.songs', () => {
    const raw: RawCueResult = {
      songs: [
        {
          path: '/ok.flac',
          duration_secs: 1,
          features: [0],
          features_version: 2,
        },
        {
          path: '/bad.flac',
          duration_secs: 0,
          features: [],
          features_version: 2,
          error: 'missing file',
          error_tag: 'DecodingError',
        },
      ],
    }
    const result = decodeCueResult(raw)
    if (isBlissError(result)) throw new Error(result.message)
    expect(result.songs).toHaveLength(2)
    expect(isBlissError(result.songs[0])).toBe(false)
    expect(isBlissError(result.songs[1])).toBe(true)
  })
})

// ── analyzeSong ───────────────────────────────────────────────────────────────

describe('analyzeSong', () => {
  test('piano.flac: returns Song with expected metadata', () => {
    expect(songPiano.path).toBe(p('piano.flac'))
    expect(songPiano.featuresVersion).toBe(FeaturesVersion.LATEST)
    expect(songPiano.analysis.features.length).toBe(NUMBER_FEATURES)
    expect(songPiano.cueInfo).toBeUndefined()
  })

  test('piano.flac: durationSecs snapshot', () => {
    expect(songPiano.durationSecs).toMatchSnapshot()
  })

  test('piano.flac: features snapshot', () => {
    expect(Array.from(songPiano.analysis.features)).toMatchSnapshot()
  })

  test('s16_mono_22_5kHz.flac: features snapshot', () => {
    expect(Array.from(songMono.analysis.features)).toMatchSnapshot()
  })

  test('s32_stereo_44_1_kHz.flac: features snapshot', () => {
    expect(Array.from(songStereo.analysis.features)).toMatchSnapshot()
  })

  test('no_tags.flac: features snapshot', () => {
    expect(Array.from(songNoTags.analysis.features)).toMatchSnapshot()
  })

  test('no_tags.flac: all tag fields are null', () => {
    expect(songNoTags.artist).toBeUndefined()
    expect(songNoTags.title).toBeUndefined()
    expect(songNoTags.album).toBeUndefined()
    expect(songNoTags.albumArtist).toBeUndefined()
    expect(songNoTags.genre).toBeUndefined()
    expect(songNoTags.trackNumber).toBeUndefined()
    expect(songNoTags.discNumber).toBeUndefined()
  })

  test('non-existent file returns DecodingError', () => {
    const result = analyzeSong('/definitely/does/not/exist.flac')
    if (!isBlissError(result)) throw new Error('expected BlissError')
    expect(result._tag).toBe('DecodingError')
  })

  test('unsupported file type returns DecodingError', () => {
    const result = analyzeSong(p('picture.png'))
    if (!isBlissError(result)) throw new Error('expected BlissError')
    expect(result._tag).toBe('DecodingError')
  })

  test('empty.wav returns an error (too short for analysis)', () => {
    const result = analyzeSong(p('empty.wav'))
    expect(isBlissError(result)).toBe(true)
  })
})

// ── analyzeSongWithOptions ────────────────────────────────────────────────────

describe('analyzeSongWithOptions', () => {
  test('Version1 produces features of length NUMBER_FEATURES_V1', () => {
    const result = analyzeSongWithOptions(p('piano.flac'), {
      featuresVersion: FeaturesVersion.Version1,
    })
    if (isBlissError(result)) throw new Error(result.message)
    expect(result.analysis.features.length).toBe(NUMBER_FEATURES_V1)
    expect(result.analysis.featuresVersion).toBe(FeaturesVersion.Version1)
  })

  test('Version2 produces features of length NUMBER_FEATURES', () => {
    const result = analyzeSongWithOptions(p('piano.flac'), {
      featuresVersion: FeaturesVersion.Version2,
    })
    if (isBlissError(result)) throw new Error(result.message)
    expect(result.analysis.features.length).toBe(NUMBER_FEATURES)
    expect(result.analysis.featuresVersion).toBe(FeaturesVersion.Version2)
  })

  test('Version1 features snapshot', () => {
    const result = analyzeSongWithOptions(p('piano.flac'), {
      featuresVersion: FeaturesVersion.Version1,
    })
    if (isBlissError(result)) throw new Error(result.message)
    expect(Array.from(result.analysis.features)).toMatchSnapshot()
  })

  test('missing file returns DecodingError', () => {
    const result = analyzeSongWithOptions('/no/file.flac', {
      featuresVersion: FeaturesVersion.LATEST,
    })
    expect(isBlissError(result)).toBe(true)
  })
})

// ── analyzeCue ────────────────────────────────────────────────────────────────

describe('analyzeCue', () => {
  test('testcue.cue: returns CueSongsResult (not a BlissError)', () => {
    const result = analyzeCue(p('testcue.cue'))
    expect(isBlissError(result)).toBe(false)
  })

  test('testcue.cue: has 4 total track slots (3 from testcue.flac + 1 error for not-existing.wav)', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    expect(result.songs).toHaveLength(4)
  })

  test('testcue.cue: first 3 tracks succeed (testcue.flac exists)', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    const [t1, t2, t3] = result.songs
    expect(isBlissError(t1)).toBe(false)
    expect(isBlissError(t2)).toBe(false)
    expect(isBlissError(t3)).toBe(false)
  })

  test('testcue.cue: track[3] is a DecodingError (not-existing.wav missing)', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    const t4 = result.songs[3]
    if (!isBlissError(t4)) throw new Error('expected BlissError for track 4')
    expect(t4._tag).toBe('DecodingError')
  })

  test('testcue.cue: successful tracks have cueInfo populated', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    const t1 = result.songs[0]!
    if (isBlissError(t1)) throw new Error(t1.message)
    expect(t1.cueInfo).not.toBeUndefined()
    expect(t1.cueInfo?.cuePath).toBe(p('testcue.cue'))
  })

  test('testcue.cue: track 1 metadata snapshot', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    const t1 = result.songs[0]!
    if (isBlissError(t1)) throw new Error(t1.message)
    expect({
      title: t1.title,
      artist: t1.artist,
      album: t1.album,
    }).toMatchSnapshot()
  })

  test('testcue.cue: track 1 features snapshot', () => {
    const result = analyzeCue(p('testcue.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    const t1 = result.songs[0]!
    if (isBlissError(t1)) throw new Error(t1.message)
    expect(Array.from(t1.analysis.features)).toMatchSnapshot()
  })

  test('non-existent .cue file returns BlissError', () => {
    const result = analyzeCue('/no/such.cue')
    expect(isBlissError(result)).toBe(true)
  })

  test('empty.cue: all tracks fail (empty.wav too short)', () => {
    const result = analyzeCue(p('empty.cue'))
    if (isBlissError(result)) throw new Error(result.message)
    for (const song of result.songs) {
      expect(isBlissError(song)).toBe(true)
    }

    // top-level BlissError is also acceptable — empty.wav too short for analysis
  })
})

// ── analyzeCueWithOptions ─────────────────────────────────────────────────────

describe('analyzeCueWithOptions', () => {
  test('Version1 produces VERSION1 features on successful tracks', () => {
    const result = analyzeCueWithOptions(p('testcue.cue'), {
      featuresVersion: FeaturesVersion.Version1,
    })
    if (isBlissError(result)) throw new Error(result.message)
    const t1 = result.songs[0]!
    if (isBlissError(t1)) throw new Error(t1.message)
    expect(t1.analysis.featuresVersion).toBe(FeaturesVersion.Version1)
    expect(t1.analysis.features.length).toBe(NUMBER_FEATURES_V1)
  })

  test('no-tags-cue.cue: tag fields are null but features are present', () => {
    const result = analyzeCueWithOptions(p('no-tags-cue.cue'), {
      featuresVersion: FeaturesVersion.LATEST,
    })
    if (isBlissError(result)) throw new Error(result.message)
    const t1 = result.songs[0]!
    if (isBlissError(t1)) throw new Error(t1.message)
    expect(t1.album).toBeUndefined()
    expect(t1.analysis.features.length).toBe(NUMBER_FEATURES)
  })
})

// ── analyzeSongs ──────────────────────────────────────────────────────────────

describe('analyzeSongs', () => {
  test('returns one result per path', () => {
    const results = analyzeSongs([p('piano.flac'), p('no_tags.flac')])
    expect(results).toHaveLength(2)
  })

  test('mixes Songs and BlissErrors correctly', () => {
    const results = analyzeSongs([p('piano.flac'), '/missing.flac'])
    expect(isBlissError(results[0])).toBe(false)
    expect(isBlissError(results[1])).toBe(true)
  })

  test('empty array returns empty array', () => {
    expect(analyzeSongs([])).toEqual([])
  })
})

// ── analyzeSongsSafe ──────────────────────────────────────────────────────────

describe('analyzeSongsSafe', () => {
  test('splits successes and failures', () => {
    const { songs, errors } = analyzeSongsSafe([
      p('piano.flac'),
      '/missing.flac',
      p('no_tags.flac'),
    ])
    expect(songs).toHaveLength(2)
    expect(errors).toHaveLength(1)
    expect(errors[0]?.path).toBe('/missing.flac')
    expect(isBlissError(errors[0]?.error)).toBe(true)
  })

  test('all-success case has no errors', () => {
    const { songs, errors } = analyzeSongsSafe([p('piano.flac')])
    expect(songs).toHaveLength(1)
    expect(errors).toHaveLength(0)
  })

  test('all-fail case has no songs', () => {
    const { songs, errors } = analyzeSongsSafe(['/a.flac', '/b.flac'])
    expect(songs).toHaveLength(0)
    expect(errors).toHaveLength(2)
  })
})

// ── euclideanDistance ─────────────────────────────────────────────────────────

describe('euclideanDistance', () => {
  test('distance from a vector to itself is 0', () => {
    const f = songPiano.analysis.features
    expect(euclideanDistance(f, f)).toBeCloseTo(0, 5)
  })

  test('snapshot distance between piano and mono', () => {
    expect(
      euclideanDistance(
        songPiano.analysis.features,
        songMono.analysis.features,
      ),
    ).toMatchSnapshot()
  })

  test('snapshot distance between mono and stereo', () => {
    expect(
      euclideanDistance(
        songMono.analysis.features,
        songStereo.analysis.features,
      ),
    ).toMatchSnapshot()
  })

  test('throws on length mismatch', () => {
    expect(() =>
      euclideanDistance(new Float32Array(3), new Float32Array(5)),
    ).toThrow('bliss: feature length mismatch (3 vs 5)')
  })

  test('symmetric: dist(a,b) === dist(b,a)', () => {
    const a = songPiano.analysis.features
    const b = songMono.analysis.features
    expect(euclideanDistance(a, b)).toBeCloseTo(euclideanDistance(b, a), 5)
  })
})

// ── cosineDistance ────────────────────────────────────────────────────────────

describe('cosineDistance', () => {
  test('distance from a vector to itself is near 0', () => {
    const f = songPiano.analysis.features
    expect(cosineDistance(f, f)).toBeCloseTo(0, 4)
  })

  test('snapshot cosine distance piano/mono', () => {
    expect(
      cosineDistance(songPiano.analysis.features, songMono.analysis.features),
    ).toMatchSnapshot()
  })

  test('throws on length mismatch', () => {
    expect(() =>
      cosineDistance(new Float32Array(2), new Float32Array(4)),
    ).toThrow('bliss: feature length mismatch (2 vs 4)')
  })
})

// ── mahalanobisDistance ───────────────────────────────────────────────────────

describe('mahalanobisDistance', () => {
  const n = 4
  // identity matrix: mahalanobis == euclidean
  const identity = Float32Array.from({ length: n * n }, (_, k) =>
    k % (n + 1) === 0 ? 1 : 0,
  )

  test('identity matrix gives same result as euclidean distance', () => {
    const a = new Float32Array([1, 2, 3, 4])
    const b = new Float32Array([4, 3, 2, 1])
    const maha = mahalanobisDistance(a, b, identity)
    // manual euclidean: sqrt((1-4)^2+(2-3)^2+(3-2)^2+(4-1)^2) = sqrt(9+1+1+9)=sqrt(20)
    expect(maha).toBeCloseTo(Math.sqrt(20), 4)
  })

  test('distance from vector to itself is 0', () => {
    const a = new Float32Array([1, 2, 3, 4])
    expect(mahalanobisDistance(a, a, identity)).toBeCloseTo(0, 5)
  })

  test('snapshot with known vectors', () => {
    const a = new Float32Array([0.1, 0.5, 0.3, 0.7])
    const b = new Float32Array([0.9, 0.2, 0.6, 0.1])
    expect(mahalanobisDistance(a, b, identity)).toMatchSnapshot()
  })
})

// ── mahalanobisDistanceBuilder ────────────────────────────────────────────────

describe('mahalanobisDistanceBuilder', () => {
  test('returns a DistanceFunction', () => {
    const n = 3
    const identity = Float32Array.from({ length: n * n }, (_, k) =>
      k % (n + 1) === 0 ? 1 : 0,
    )
    const fn = mahalanobisDistanceBuilder(identity)
    expect(typeof fn).toBe('function')
  })

  test('built function matches mahalanobisDistance directly', () => {
    const n = 4
    const m = Float32Array.from({ length: n * n }, (_, k) =>
      k % (n + 1) === 0 ? 1 : 0,
    )
    const fn = mahalanobisDistanceBuilder(m)
    const a = new Float32Array([1, 0, 0, 0])
    const b = new Float32Array([0, 1, 0, 0])
    expect(fn(a, b)).toBeCloseTo(mahalanobisDistance(a, b, m), 5)
  })
})

// ── closestSongs ──────────────────────────────────────────────────────────────

describe('closestSongs', () => {
  test('target included in songs sorts to position 0 (distance 0)', () => {
    const sorted = closestSongs(songPiano, [songPiano, songMono, songStereo])
    expect(sorted[0]?.path).toBe(songPiano.path)
  })

  test('returns all songs', () => {
    const sorted = closestSongs(songMono, [songPiano, songMono, songStereo])
    expect(sorted).toHaveLength(3)
  })

  test('does not mutate input array', () => {
    const pool = [songPiano, songMono, songStereo]
    const orig = [...pool]
    closestSongs(songPiano, pool)
    expect(pool.map(s => s.path)).toEqual(orig.map(s => s.path))
  })

  test('accepts raw Float32Array as target', () => {
    const sorted = closestSongs(songPiano.analysis.features, [
      songPiano,
      songMono,
    ])
    expect(sorted).toHaveLength(2)
  })

  test('order snapshot (paths)', () => {
    const sorted = closestSongs(songPiano, [songPiano, songMono, songStereo])
    expect(sorted[0]!.path.endsWith('piano.flac')).toBe(true)
    expect(sorted[1]!.path.endsWith('s32_stereo_44_1_kHz.flac')).toBe(true)
    expect(sorted[2]!.path.endsWith('s16_mono_22_5kHz.flac')).toBe(true)
  })
})

// ── closestAlbumToGroup ───────────────────────────────────────────────────────

describe('closestAlbumToGroup', () => {
  test('returns result containing all group songs plus album songs', () => {
    const albumSongA = { ...songMono, album: 'TestAlbum', trackNumber: 1 }
    const albumSongB = { ...songStereo, album: 'TestAlbum', trackNumber: 2 }
    const result = closestAlbumToGroup([songPiano], [albumSongA, albumSongB])
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  test('songs without album are excluded', () => {
    const { album: _album, ...noAlbum } = songMono
    const result = closestAlbumToGroup([songPiano], [noAlbum])
    // noAlbum has no album → filtered; result is just [songPiano]
    expect(result.map(s => s.path)).toContain(songPiano.path)
    expect(result.map(s => s.path)).not.toContain(noAlbum.path)
  })

  test('group songs are not in pool when paths match', () => {
    const pool = [songMono, songStereo]
    const result = closestAlbumToGroup([songMono], pool)
    // songMono is excluded from pool since it's in group
    expect(result.filter(s => s.path === songMono.path)).toHaveLength(1)
  })
})

// ── songToSong ────────────────────────────────────────────────────────────────

describe('songToSong', () => {
  test('returns all candidate songs', () => {
    const result = songToSong([songPiano], [songMono, songStereo, songNoTags])
    expect(result).toHaveLength(3)
  })

  test('empty candidates returns empty array', () => {
    expect(songToSong([songPiano], [])).toEqual([])
  })

  test('path order snapshot', () => {
    const result = songToSong([songPiano], [songMono, songStereo, songNoTags])
    expect(result[0]!.path.endsWith('s32_stereo_44_1_kHz.flac')).toBe(true)
    expect(result[1]!.path.endsWith('s16_mono_22_5kHz.flac')).toBe(true)
    expect(result[2]!.path.endsWith('no_tags.flac')).toBe(true)
  })
})

// ── buildPlaylist ─────────────────────────────────────────────────────────────

describe('buildPlaylist', () => {
  test('limits to count', () => {
    const result = buildPlaylist(
      songPiano,
      [songPiano, songMono, songStereo],
      2,
    )
    expect(result).toHaveLength(2)
  })

  test('count greater than pool returns all songs sorted', () => {
    const result = buildPlaylist(songPiano, [songMono, songStereo], 100)
    expect(result).toHaveLength(2)
  })

  test('count 0 returns empty', () => {
    const result = buildPlaylist(songPiano, [songMono, songStereo], 0)
    expect(result).toHaveLength(0)
  })
})

// ── distanceMatrix ────────────────────────────────────────────────────────────

describe('distanceMatrix', () => {
  test('returns n² length Float32Array', () => {
    const songs = [songPiano, songMono, songStereo]
    const matrix = distanceMatrix(songs)
    expect(matrix).toBeInstanceOf(Float32Array)
    expect(matrix.length).toBe(9)
  })

  test('diagonal is 0 (self-distance)', () => {
    const songs = [songPiano, songMono]
    const matrix = distanceMatrix(songs)
    expect(matrix[0]).toBeCloseTo(0, 5) // [0,0]
    expect(matrix[3]).toBeCloseTo(0, 5) // [1,1]
  })

  test('matrix is symmetric', () => {
    const songs = [songPiano, songMono, songStereo]
    const m = distanceMatrix(songs)
    // m[0*3+1] === m[1*3+0]
    expect(m[1]).toBeCloseTo(m[3] ?? 0, 5)
    expect(m[2]).toBeCloseTo(m[6] ?? 0, 5)
  })

  test('snapshot 3-song matrix', () => {
    expect(
      Array.from(distanceMatrix([songPiano, songMono, songStereo])),
    ).toMatchSnapshot()
  })
})

// ── dedupPlaylist ─────────────────────────────────────────────────────────────

describe('dedupPlaylist', () => {
  test('empty playlist returns empty array', () => {
    expect(dedupPlaylist([])).toEqual([])
  })

  test('single song is always kept', () => {
    expect(dedupPlaylist([songPiano])).toHaveLength(1)
  })

  test('identical-path duplicate with same title/artist is removed', () => {
    const clone = { ...songPiano }
    const result = dedupPlaylist([songPiano, clone])
    expect(result).toHaveLength(1)
  })

  test('songs with large distance both survive threshold=0', () => {
    const result = dedupPlaylist([songPiano, songStereo], 0)
    expect(result).toHaveLength(2)
  })

  test('songs with very small distance are deduped at high threshold', () => {
    const nearClone = {
      ...songPiano,
      // give different title/artist so title-dedup doesn't trigger
      title: 'Different',
      artist: 'Other',
    }
    const result = dedupPlaylist([songPiano, nearClone], 999)
    expect(result).toHaveLength(1)
  })
})
