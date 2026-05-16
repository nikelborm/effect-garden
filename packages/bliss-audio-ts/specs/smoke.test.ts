import { test } from 'vitest'

import {
  analyzeSong,
  type BlissError,
  closestSongs,
  cosineDistance,
  euclideanDistance,
  isBlissError,
  NUMBER_FEATURES,
  type Song,
} from '../index.ts'

test('smoke', () => {
  console.log('NUMBER_FEATURES =', NUMBER_FEATURES)

  function assertSong(result: Song | BlissError, label: string): Song {
    if (isBlissError(result))
      throw new Error(`${label}: ${result._tag}: ${result.message}`)
    return result
  }

  const song1 = assertSong(
    analyzeSong('./bliss-audio/data/s16_mono_22_5kHz.flac'),
    'song1',
  )
  const song2 = assertSong(
    analyzeSong('./bliss-audio/data/s32_stereo_44_1_kHz.flac'),
    'song2',
  )
  const song3 = assertSong(
    analyzeSong('./bliss-audio/data/piano.flac'),
    'song3',
  )

  console.log('song1:', {
    path: song1.path,
    title: song1.title,
    durationSecs: song1.durationSecs.toFixed(2),
  })

  console.log('song2:', {
    path: song2.path,
    durationSecs: song2.durationSecs.toFixed(2),
  })

  console.log('song3:', {
    path: song3.path,
    durationSecs: song3.durationSecs.toFixed(2),
  })

  const features1Preview = Array.from(song1.analysis.features.slice(0, 5)).map(
    x => x.toFixed(4),
  )
  console.log('song1 features (first 5):', features1Preview)
  console.log('featuresVersion:', song1.analysis.featuresVersion)

  const euc = euclideanDistance(
    song1.analysis.features,
    song2.analysis.features,
  )
  const cos = cosineDistance(song1.analysis.features, song2.analysis.features)
  console.log('euclidean(song1, song2):', euc.toFixed(6))
  console.log('cosine(song1, song2):', cos.toFixed(6))

  const playlist = closestSongs(song1, [song1, song2, song3])
  console.log('Playlist (closest to song1):')
  for (const s of playlist) {
    const d = euclideanDistance(song1.analysis.features, s.analysis.features)
    console.log(' ', d.toFixed(4), s.path)
  }
})
