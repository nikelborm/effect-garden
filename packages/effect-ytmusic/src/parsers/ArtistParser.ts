import * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import { ArtistDetailed, ArtistFull } from '../schema/artist.ts'
import { checkType } from '../utils/checkType.ts'
import { traverseList, traverseString } from '../utils/traverse.ts'
import * as AlbumParser from './AlbumParser.ts'
import * as PlaylistParser from './PlaylistParser.ts'
import * as SongParser from './SongParser.ts'
import * as VideoParser from './VideoParser.ts'

export const parse = (
  data: unknown,
  artistId: string,
): Either.Either<ArtistFull, ParseError> => {
  const artistBasic = {
    artistId,
    name: traverseString(data, 'header', 'title', 'text'),
  }

  const carousels = traverseList(data, 'musicCarouselShelfRenderer')

  const mapCarousel = <T>(
    index: number,
    mapFn: (item: unknown) => Either.Either<T, ParseError>,
  ): T[] =>
    ((carousels[index]?.contents as unknown[] | undefined) ?? []).flatMap(
      item => {
        const r = mapFn(item)
        return Either.isRight(r) ? [r.right] : []
      },
    )

  return checkType(
    'ArtistFull',
    {
      type: 'ARTIST',
      ...artistBasic,
      thumbnails: traverseList(data, 'header', 'thumbnails'),
      topSongs: (
        traverseList(data, 'musicShelfRenderer', 'contents') as unknown[]
      ).flatMap(item => {
        const r = SongParser.parseArtistTopSong(item, artistBasic)
        return Either.isRight(r) ? [r.right] : []
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
): Either.Either<ArtistDetailed, ParseError> => {
  const columns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const title = columns[0]

  return checkType(
    'ArtistDetailed',
    {
      type: 'ARTIST',
      artistId: traverseString(item, 'browseId'),
      name: traverseString(title, 'text'),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    ArtistDetailed,
  )
}

export const parseSimilarArtists = (
  item: unknown,
): Either.Either<ArtistDetailed, ParseError> =>
  checkType(
    'ArtistDetailed',
    {
      type: 'ARTIST',
      artistId: traverseString(item, 'browseId'),
      name: traverseString(item, 'runs', 'text'),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    ArtistDetailed,
  )
