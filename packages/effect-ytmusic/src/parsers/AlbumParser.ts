import * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import { AlbumDetailed, AlbumFull } from '../schema/album.ts'
import type { ArtistBasic } from '../schema/common.ts'
import { checkType } from '../utils/checkType.ts'
import { traverse, traverseList, traverseString } from '../utils/traverse.ts'
import * as SongParser from './SongParser.ts'

const processYear = (year: string | undefined): number | null =>
  year?.match(/^\d{4}$/) ? +year : null

export const parse = (
  data: unknown,
  albumId: string,
): Either.Either<AlbumFull, ParseError> => {
  const albumBasic = {
    albumId,
    name: traverseString(data, 'tabs', 'title', 'text'),
  }

  const artistData = traverse(data, 'tabs', 'straplineTextOne', 'runs')
  const artistBasic: ArtistBasic = {
    artistId: traverseString(artistData, 'browseId') || null,
    name: traverseString(artistData, 'text'),
  }

  const thumbnails = traverseList(data, 'background', 'thumbnails')

  const songResults = (
    traverseList(data, 'musicResponsiveListItemRenderer') as unknown[]
  ).map(item =>
    SongParser.parseAlbumSong(item, artistBasic, albumBasic, thumbnails),
  )
  const songs = songResults.flatMap(r => (Either.isRight(r) ? [r.right] : []))

  return checkType(
    'AlbumFull',
    {
      type: 'ALBUM',
      ...albumBasic,
      playlistId: traverseString(data, 'musicPlayButtonRenderer', 'playlistId'),
      artist: artistBasic,
      year: processYear(
        traverseList(data, 'tabs', 'subtitle', 'text').at(-1) as
          | string
          | undefined,
      ),
      thumbnails,
      songs,
    },
    AlbumFull,
  )
}

export const parseSearchResult = (
  item: unknown,
): Either.Either<AlbumDetailed, ParseError> => {
  const columns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const title = columns[0]
  const artist =
    columns.find((c: unknown) => {
      const pageType = traverseString(c, 'pageType')
      return [
        'MUSIC_PAGE_TYPE_ARTIST',
        'MUSIC_PAGE_TYPE_USER_CHANNEL',
      ].includes(pageType)
    }) ?? columns[3]
  const playlistId =
    traverseString(item, 'overlay', 'playlistId') ||
    traverseString(item, 'thumbnailOverlay', 'playlistId')

  return checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: traverseList(item, 'browseId').at(-1) as string,
      playlistId,
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      year: processYear((columns.at(-1) as any)?.text as string | undefined),
      name: traverseString(title, 'text'),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )
}

export const parseArtistAlbum = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<AlbumDetailed, ParseError> =>
  checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: traverseList(item, 'browseId').at(-1) as string,
      playlistId: traverseString(item, 'thumbnailOverlay', 'playlistId'),
      name: traverseString(item, 'title', 'text'),
      artist: artistBasic,
      year: processYear(
        traverseList(item, 'subtitle', 'text').at(-1) as string | undefined,
      ),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )

export const parseArtistTopAlbum = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<AlbumDetailed, ParseError> =>
  checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: traverseList(item, 'browseId').at(-1) as string,
      playlistId: traverseString(item, 'musicPlayButtonRenderer', 'playlistId'),
      name: traverseString(item, 'title', 'text'),
      artist: artistBasic,
      year: processYear(
        traverseList(item, 'subtitle', 'text').at(-1) as string | undefined,
      ),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )

export const parseHomeSection = (
  item: unknown,
): Either.Either<AlbumDetailed, ParseError> => {
  const artist = (traverseList(item, 'subtitle', 'runs') as unknown[]).at(-1)

  return checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: traverseString(item, 'title', 'browseId'),
      playlistId: traverseString(item, 'thumbnailOverlay', 'playlistId'),
      name: traverseString(item, 'title', 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      year: null,
      thumbnails: traverseList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )
}
