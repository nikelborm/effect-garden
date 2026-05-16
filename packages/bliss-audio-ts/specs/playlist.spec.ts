// Tests mirrored from bliss-audio/src/playlist.rs § #[cfg(test)]:
//   test_euclidean_distance, test_cosine_distance, test_mahalanobis_distance,
//   test_mahalanobis_distance_with_songs, test_dedup_playlist_custom_distance,
//   test_song_to_song, test_sort_closest_to_songs, test_closest_to_group
//
// Tests skipped — require ForestOptions (extended isolation forest), not in TS bindings:
//   test_forest_options

import { describe, expect, test } from 'vitest'

import {
  closestAlbumToGroup,
  closestSongs,
  cosineDistance,
  dedupPlaylist,
  euclideanDistance,
  FeaturesVersion,
  mahalanobisDistanceBuilder,
  NUMBER_FEATURES,
  NUMBER_FEATURES_V1,
  type Song,
  songToSong,
} from '../index.ts'

// ── Song factory ──────────────────────────────────────────────────────────────

function makeSong(
  path: string,
  features: number[],
  opts: {
    title?: string
    artist?: string
    album?: string
    trackNumber?: number
    discNumber?: number
    featuresVersion?: FeaturesVersion
  } = {},
): Song {
  const fv = opts.featuresVersion ?? FeaturesVersion.LATEST
  return {
    path,
    ...(opts.artist !== undefined ? { artist: opts.artist } : {}),
    ...(opts.title !== undefined ? { title: opts.title } : {}),
    ...(opts.album !== undefined ? { album: opts.album } : {}),
    ...(opts.trackNumber !== undefined
      ? { trackNumber: opts.trackNumber }
      : {}),
    ...(opts.discNumber !== undefined ? { discNumber: opts.discNumber } : {}),
    durationSecs: 0,
    analysis: {
      features: new Float32Array(features),
      featuresVersion: fv,
    },
    featuresVersion: fv,
  }
}

// ── test_euclidean_distance ───────────────────────────────────────────────────

test('test_euclidean_distance: known 20-element vectors', () => {
  const a = new Float32Array([
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  ])
  const b = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ])
  expect(Math.abs(euclideanDistance(a, b) - 4.242640687119285)).toBeLessThan(
    1e-5,
  )

  const c = new Float32Array(20).fill(0.5)
  expect(euclideanDistance(c, c)).toBe(0)
})

// ── test_cosine_distance ──────────────────────────────────────────────────────

test('test_cosine_distance: known 20-element vectors', () => {
  const a = new Float32Array([
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  ])
  const b = new Float32Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ])
  expect(Math.abs(cosineDistance(a, b) - 0.7705842661294382)).toBeLessThan(1e-5)

  const c = new Float32Array(20).fill(0.5)
  expect(cosineDistance(c, c)).toBe(0)
})

// ── test_mahalanobis_distance ─────────────────────────────────────────────────

// Mirrors test_mahalanobis_distance: diagonal M with entries [1,1,0,...] over
// 20-element V1 vectors. Only the first two features contribute; result = 1.
test('test_mahalanobis_distance: diagonal M [1,1,0,...], two active features → 1', () => {
  const a = new Float32Array([
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
  ])
  const b = new Float32Array([
    1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
  ])
  // 20×20 diagonal matrix with M[0,0]=1, M[1,1]=1, rest=0
  const N = NUMBER_FEATURES_V1
  const m = new Float32Array(N * N)
  m[0 * N + 0] = 1
  m[1 * N + 1] = 1

  const dist = mahalanobisDistanceBuilder(m)
  expect(dist(a, b)).toBe(1)
})

// ── test_mahalanobis_distance_with_songs ──────────────────────────────────────

// Mirrors test_mahalanobis_distance_with_songs: a 23×23 matrix that only
// weighs feature[0]. With firstSong.features[0]=1, secondSong.features[0]=1.5,
// thirdSong.features[0]=5, secondSong is closer → [second, third].
test('test_mahalanobis_distance_with_songs: closest_to_songs with single-feature M', () => {
  const firstSong = makeSong(
    'path-to-first',
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const secondSong = makeSong(
    'path-to-second',
    [1.5, 5, 6, 5, 6, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const thirdSong = makeSong(
    'path-to-third',
    [5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )

  // 23×23 diagonal matrix with only M[0,0]=1
  const N = NUMBER_FEATURES
  const m = new Float32Array(N * N)
  m[0 * N + 0] = 1
  const dist = mahalanobisDistanceBuilder(m)

  const playlist = closestSongs(firstSong, [thirdSong, secondSong], dist)
  expect(playlist.map(s => s.path)).toEqual(['path-to-second', 'path-to-third'])
})

// ── test_dedup_playlist_custom_distance ───────────────────────────────────────

// Mirrors test_dedup_playlist_custom_distance.
// Songs (all 23 features, FeaturesVersion.LATEST):
//   first     = [1.]*23
//   firstDupe = [1.]*23  (same features → duplicate by distance)
//   second    = [2*16, 1.9, 1*6], title="dupe-title", artist="dupe-artist"
//   third     = [2*16, 2.5, 1*6], title="dupe-title", artist="dupe-artist"
//   fourth    = [2*16, 0., 1*6],  title="dupe-title", artist="no-dupe-artist"
//   fifth     = [2*16, 0.001, 1*6]   (same path as fourth)
describe('test_dedup_playlist_custom_distance', () => {
  const firstSong = makeSong('path-to-first', Array(23).fill(1))
  const firstSongDupe = makeSong('path-to-dupe', Array(23).fill(1))
  const secondSong = makeSong(
    'path-to-second',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1.9, 1, 1, 1, 1, 1, 1],
    { title: 'dupe-title', artist: 'dupe-artist' },
  )
  const thirdSong = makeSong(
    'path-to-third',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2.5, 1, 1, 1, 1, 1, 1],
    { title: 'dupe-title', artist: 'dupe-artist' },
  )
  const fourthSong = makeSong(
    'path-to-fourth',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1],
    { title: 'dupe-title', artist: 'no-dupe-artist' },
  )
  const fifthSong = makeSong(
    'path-to-fourth',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0.001, 1, 1, 1, 1, 1, 1],
  )
  const playlist = [
    firstSong,
    firstSongDupe,
    secondSong,
    thirdSong,
    fourthSong,
    fifthSong,
  ]

  // dedupPlaylist with euclidean, default threshold (0.05)
  test('euclidean distance, default threshold → [first, second, fourth]', () => {
    const result = dedupPlaylist(playlist, 0.05, euclideanDistance)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe(firstSong)
    expect(result[1]).toBe(secondSong)
    expect(result[2]).toBe(fourthSong)
  })

  // dedupPlaylist with euclidean, threshold=20 (everything is "too close")
  test('euclidean distance, threshold=20 → [first]', () => {
    const result = dedupPlaylist(playlist, 20, euclideanDistance)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(firstSong)
  })

  // dedupPlaylist with default (euclidean), threshold=20
  test('default (euclidean) distance, threshold=20 → [first]', () => {
    const result = dedupPlaylist(playlist, 20)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(firstSong)
  })

  // dedupPlaylist with default (euclidean), default threshold (0.05)
  test('default (euclidean) distance, default threshold → [first, second, fourth]', () => {
    const result = dedupPlaylist(playlist)
    expect(result).toHaveLength(3)
    expect(result[0]).toBe(firstSong)
    expect(result[1]).toBe(secondSong)
    expect(result[2]).toBe(fourthSong)
  })

  // dedupPlaylist with cosine distance, threshold=20
  // (all cosine distances < 20, so only first kept)
  test('cosine distance, threshold=20 → [first]', () => {
    const result = dedupPlaylist(playlist, 20, cosineDistance)
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(firstSong)
  })
})

// ── test_song_to_song ─────────────────────────────────────────────────────────

// Mirrors test_song_to_song: greedy nearest-neighbour chaining starting from
// firstSong as the initial context. Both pool orderings give the same result.
describe('test_song_to_song', () => {
  const firstSong = makeSong(
    'path-to-first',
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const firstSongDupe = makeSong(
    'path-to-dupe',
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const secondSong = makeSong(
    'path-to-second',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1.9, 1, 1, 1, 1, 1, 1],
  )
  const thirdSong = makeSong(
    'path-to-third',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2.5, 1, 1, 1, 1, 1, 1],
  )
  const fourthSong = makeSong(
    'path-to-fourth',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1],
  )

  // Pool order: [first, third, firstDupe, second, fourth]
  test('pool [first, third, firstDupe, second, fourth] → [first, firstDupe, second, third, fourth]', () => {
    const pool = [firstSong, thirdSong, firstSongDupe, secondSong, fourthSong]
    const result = songToSong([firstSong], pool, euclideanDistance)
    expect(result.map(s => s.path)).toEqual([
      'path-to-first',
      'path-to-dupe',
      'path-to-second',
      'path-to-third',
      'path-to-fourth',
    ])
  })

  // Pool order: [first, firstDupe, third, fourth, second]
  test('pool [first, firstDupe, third, fourth, second] → [first, firstDupe, second, third, fourth]', () => {
    const pool = [firstSong, firstSongDupe, thirdSong, fourthSong, secondSong]
    const result = songToSong([firstSong], pool, euclideanDistance)
    expect(result.map(s => s.path)).toEqual([
      'path-to-first',
      'path-to-dupe',
      'path-to-second',
      'path-to-third',
      'path-to-fourth',
    ])
  })
})

// ── test_sort_closest_to_songs ────────────────────────────────────────────────

// Mirrors test_sort_closest_to_songs: sort a pool by distance from firstSong.
// The stable sort preserves relative input order for ties (first/firstDupe and
// fourth/fifth have the same distance).
describe('test_sort_closest_to_songs', () => {
  const firstSong = makeSong(
    'path-to-first',
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const firstSongDupe = makeSong(
    'path-to-dupe',
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  )
  const secondSong = makeSong(
    'path-to-second',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1.9, 1, 1, 1, 1, 1, 1],
  )
  const thirdSong = makeSong(
    'path-to-third',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2.5, 1, 1, 1, 1, 1, 1],
  )
  const fourthSong = makeSong(
    'path-to-fourth',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1],
  )
  const fifthSong = makeSong(
    'path-to-fifth',
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 1, 1, 1, 1, 1, 1],
  )

  // Pool order [fifth, fourth, first, firstDupe, second, third]:
  // fifth and fourth have identical features (same dist to first), but fifth
  // appears first in input so it sorts first (stable sort).
  test('pool [fifth,fourth,first,firstDupe,second,third] → [first,firstDupe,second,fifth,fourth,third]', () => {
    const songs = [
      fifthSong,
      fourthSong,
      firstSong,
      firstSongDupe,
      secondSong,
      thirdSong,
    ]
    const playlist = closestSongs(firstSong, songs, euclideanDistance)
    expect(playlist.map(s => s.path)).toEqual([
      'path-to-first',
      'path-to-dupe',
      'path-to-second',
      'path-to-fifth',
      'path-to-fourth',
      'path-to-third',
    ])
  })

  // Pool order [second, first, fourth, firstDupe, third, fifth]:
  // fourth appears before fifth → fourth sorts before fifth.
  test('pool [second,first,fourth,firstDupe,third,fifth] → [first,firstDupe,second,fourth,fifth,third]', () => {
    const songs = [
      secondSong,
      firstSong,
      fourthSong,
      firstSongDupe,
      thirdSong,
      fifthSong,
    ]
    const playlist = closestSongs(firstSong, songs, euclideanDistance)
    expect(playlist.map(s => s.path)).toEqual([
      'path-to-first',
      'path-to-dupe',
      'path-to-second',
      'path-to-fourth',
      'path-to-fifth',
      'path-to-third',
    ])
  })
})

// ── test_closest_to_group ─────────────────────────────────────────────────────

// Mirrors test_closest_to_group: album-aware playlist from a pool, for both
// FeaturesVersion.Version1 (20 features) and FeaturesVersion.Version2 (23 features).
// Songs with no album are excluded; group songs are excluded by path.
// Within each album, tracks are sorted by (discNumber, trackNumber).
describe('test_closest_to_group', () => {
  for (const version of [
    FeaturesVersion.Version1,
    FeaturesVersion.Version2,
  ] as const) {
    const N =
      version === FeaturesVersion.Version1
        ? NUMBER_FEATURES_V1
        : NUMBER_FEATURES
    const label = version === FeaturesVersion.Version1 ? 'Version1' : 'Version2'

    describe(`FeaturesVersion.${label} (${N} features)`, () => {
      const song = (path: string, fill: number, opts = {}) =>
        makeSong(path, Array(N).fill(fill), {
          ...opts,
          featuresVersion: version,
        })

      // group
      const firstSong = song('path-to-first', 0, {
        album: 'Album',
        artist: 'Artist',
        trackNumber: 1,
        discNumber: 1,
      })
      const secondSong = song('path-to-third', 10, {
        album: 'Album',
        artist: 'Another Artist',
        trackNumber: 2,
        discNumber: 1,
      })

      // "Another Album" disc 1
      const firstOtherAlbumDisc1 = song('path-to-second-2', 0.15, {
        album: 'Another Album',
        artist: 'Artist',
        trackNumber: 1,
        discNumber: 1,
      })
      const secondOtherAlbumDisc1 = song('path-to-second', 0.1, {
        album: 'Another Album',
        artist: 'Artist',
        trackNumber: 2,
        discNumber: 1,
      })

      // "Another Album" disc 2
      const firstOtherAlbumDisc2 = song('path-to-fourth', 20, {
        album: 'Another Album',
        artist: 'Another Artist',
        trackNumber: 1,
        discNumber: 2,
      })
      const secondOtherAlbumDisc2 = song('path-to-fourth', 20, {
        album: 'Another Album',
        artist: 'Another Artist',
        trackNumber: 4,
        discNumber: 2,
      })

      // no album → excluded from output
      const songNoAlbum = song('path-to-fifth', 40, {
        artist: 'Third Artist',
      })

      const pool = [
        firstSong,
        secondOtherAlbumDisc1,
        secondOtherAlbumDisc2,
        secondSong,
        firstOtherAlbumDisc2,
        firstOtherAlbumDisc1,
        songNoAlbum,
      ]
      const group = [firstSong, secondSong]

      test("returns group + 'Another Album' sorted by disc/track, song_no_album excluded", () => {
        const result = closestAlbumToGroup(group, pool)
        expect(result.map(s => s.path)).toEqual([
          'path-to-first', // group[0]
          'path-to-third', // group[1]
          'path-to-second-2', // Another Album disc1 track1
          'path-to-second', // Another Album disc1 track2
          'path-to-fourth', // Another Album disc2 track1
          'path-to-fourth', // Another Album disc2 track4
        ])
      })

      // Second pool ordering (matches the CustomSong variant in the Rust test)
      const pool2 = [
        firstSong,
        secondOtherAlbumDisc2,
        secondOtherAlbumDisc1,
        secondSong,
        firstOtherAlbumDisc2,
        firstOtherAlbumDisc1,
        songNoAlbum,
      ]

      test('alternate pool ordering → same result', () => {
        const result = closestAlbumToGroup(group, pool2)
        expect(result.map(s => s.path)).toEqual([
          'path-to-first',
          'path-to-third',
          'path-to-second-2',
          'path-to-second',
          'path-to-fourth',
          'path-to-fourth',
        ])
      })
    })
  }
})

// ── multi-album ordering (exercises meanFeatures) ─────────────────────────────

describe('closestAlbumToGroup: album ordering by mean distance', () => {
  for (const version of [
    FeaturesVersion.Version1,
    FeaturesVersion.Version2,
  ] as const) {
    const N =
      version === FeaturesVersion.Version1
        ? NUMBER_FEATURES_V1
        : NUMBER_FEATURES
    const label = version === FeaturesVersion.Version1 ? 'Version1' : 'Version2'

    describe(`FeaturesVersion.${label} (${N} features)`, () => {
      const song = (path: string, fill: number, opts = {}) =>
        makeSong(path, Array(N).fill(fill), {
          ...opts,
          featuresVersion: version,
        })

      // group centroid ≈ 0
      const groupA = song('group-1', 0, { album: 'Seed', trackNumber: 1 })
      const groupB = song('group-2', 0, { album: 'Seed', trackNumber: 2 })
      const group = [groupA, groupB]

      // Near album: mean ≈ 1 → small distance from group centroid
      const near1 = song('near-1', 1, { album: 'Near', trackNumber: 1 })
      const near2 = song('near-2', 1, { album: 'Near', trackNumber: 2 })

      // Far album: mean ≈ 100 → large distance from group centroid
      // Listed first in pool to ensure result order comes from distance, not insertion order
      const far1 = song('far-1', 100, { album: 'Far', trackNumber: 1 })
      const far2 = song('far-2', 100, { album: 'Far', trackNumber: 2 })

      const pool = [far1, far2, near1, near2]

      test('near album sorts before far album regardless of pool order', () => {
        const result = closestAlbumToGroup(group, pool)
        const paths = result.map(s => s.path)

        // Group songs come first
        expect(paths.slice(0, 2)).toEqual(['group-1', 'group-2'])

        // Near album tracks precede far album tracks
        expect(paths.indexOf('near-1')).toBeLessThan(paths.indexOf('far-1'))
        expect(paths.indexOf('near-2')).toBeLessThan(paths.indexOf('far-1'))

        // All four pool songs are present
        expect(paths).toContain('near-1')
        expect(paths).toContain('near-2')
        expect(paths).toContain('far-1')
        expect(paths).toContain('far-2')
      })
    })
  }
})
