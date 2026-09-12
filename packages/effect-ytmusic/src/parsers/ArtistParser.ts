import type * as Result from 'effect/Result'

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
): Result.Result<ArtistFull, ParseError> => {
  const artistBasic = {
    artistId,
    name: extractString(data, 'header', 'title', 'text'),
  }

  const carousels = extractList(data, 'musicCarouselShelfRenderer')

  const mapCarousel = <T>(
    index: number,
    mapFn: (item: unknown) => Result.Result<T, ParseError>,
  ): T[] =>
    ((carousels[index]?.contents as unknown[] | undefined) ?? []).flatMap(
      item => {
        const r = mapFn(item)
        return Result.isRight(r) ? [r.right] : []
      },
    )

  return checkType(
    'ArtistFull',
    {
      type: 'ARTIST',
      ...artistBasic,
      thumbnails: extractList(data, 'header', 'thumbnails'),
      topSongs: (
        extractList(data, 'musicShelfRenderer', 'contents') as unknown[]
      ).flatMap(item => {
        const r = SongParser.parseArtistTopSong(item, artistBasic)
        return Result.isRight(r) ? [r.right] : []
      }),
      topAlbums: mapCarousel(0, item =>
        AlbumParser.parseArtistTopAlbum(item, artistBasic),
      ),
      topSingles: mapCarousel(1, item =>
        AlbumParser.parseArtistTopAlbum(item, artistBasic),
      ),
      topVideos: mapCarousel(2, item =>
        VideoParser.parseArtistTopVideo(item, artistBasic),
      ),
      featuredOn: mapCarousel(3, item =>
        PlaylistParser.parseArtistFeaturedOn(item, artistBasic),
      ),
      similarArtists: mapCarousel(4, item => parseSimilarArtists(item)),
    },
    ArtistFull,
  )
}

export const parseSearchResult = (
  item: unknown,
): Result.Result<ArtistDetailed, ParseError> => {
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
): Result.Result<ArtistDetailed, ParseError> =>
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
