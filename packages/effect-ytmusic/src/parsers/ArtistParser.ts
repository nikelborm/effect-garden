import * as Effect from 'effect/Effect'

import type { ParseError } from '../errors.ts'
import { ArtistDetailed } from '../schema/ArtistDetailed.ts'
import { ArtistFull } from '../schema/ArtistFull.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import * as AlbumParser from './AlbumParser.ts'
import * as PlaylistParser from './PlaylistParser.ts'
import * as SongParser from './SongParser.ts'
import * as VideoParser from './VideoParser.ts'

export const parse = (
  data: unknown,
  artistId: string,
): Effect.Effect<ArtistFull, ParseError> =>
  Effect.gen(function* () {
    const artistBasic = {
      artistId,
      name: extractString(data, 'header', 'title', 'text'),
    }

    const carousels = extractList(data, 'musicCarouselShelfRenderer')

    // Helper: parse a list of items with an effectful mapper, returning only
    // the successes (mirroring the prior `Result.isSuccess` filter).
    const partitionSuccesses = <A, T>(
      elements: Iterable<A>,
      f: (a: A) => Effect.Effect<T, ParseError>,
    ): Effect.Effect<T[], never> =>
      Effect.map(
        Effect.partition(elements, f, { concurrency: 'unbounded' }),
        ([, satisfying]) => satisfying,
      )

    const carouselItems = (index: number): unknown[] =>
      (carousels[index]?.contents as unknown[] | undefined) ?? []

    const topAlbums = yield* partitionSuccesses(carouselItems(0), item =>
      AlbumParser.parseArtistTopAlbum(item, artistBasic),
    )

    const topSingles = yield* partitionSuccesses(carouselItems(1), item =>
      AlbumParser.parseArtistTopAlbum(item, artistBasic),
    )

    const topVideos = yield* partitionSuccesses(carouselItems(2), item =>
      VideoParser.parseArtistTopVideo(item, artistBasic),
    )

    const featuredOn = yield* partitionSuccesses(carouselItems(3), item =>
      PlaylistParser.parseArtistFeaturedOn(item, artistBasic),
    )

    const similarArtists = yield* partitionSuccesses(
      carouselItems(4),
      parseSimilarArtists,
    )

    const topSongs = yield* partitionSuccesses(
      extractList(data, 'musicShelfRenderer', 'contents') as unknown[],
      item => SongParser.parseArtistTopSong(item, artistBasic),
    )

    return yield* checkType(
      'ArtistFull',
      {
        type: 'ARTIST',
        ...artistBasic,
        thumbnails: extractList(data, 'header', 'thumbnails'),
        topSongs,
        topAlbums,
        topSingles,
        topVideos,
        featuredOn,
        similarArtists,
      },
      ArtistFull,
    )
  })

export const parseSearchResult = (
  item: unknown,
): Effect.Effect<ArtistDetailed, ParseError> => {
  const columns = (extractList(item, 'flexColumns', 'runs') as unknown[]).flat()
  const title = columns[0]

  return checkType(
    'ArtistDetailed',
    {
      type: 'ARTIST',
      artistId: extractString(item, 'browseId'),
      name: extractString(title, 'text'),
      thumbnails: extractList(item, 'thumbnails'),
    },
    ArtistDetailed,
  )
}

export const parseSimilarArtists = (
  item: unknown,
): Effect.Effect<ArtistDetailed, ParseError> =>
  checkType(
    'ArtistDetailed',
    {
      type: 'ARTIST',
      artistId: extractString(item, 'browseId'),
      name: extractString(item, 'runs', 'text'),
      thumbnails: extractList(item, 'thumbnails'),
    },
    ArtistDetailed,
  )
