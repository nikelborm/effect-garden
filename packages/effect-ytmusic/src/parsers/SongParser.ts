import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type {
  AlbumBasic,
  ArtistBasic,
  ThumbnailFull,
} from '../schema/common.ts'
import { SongDetailed, SongFull } from '../schema/song.ts'
import { checkType } from '../utils/checkType.ts'
import { isAlbum, isArtist, isDuration, isTitle } from '../utils/filters.ts'
import { traverseList, traverseString } from '../utils/traverse.ts'
import { parseDuration } from './Parser.ts'

export const parse = (data: unknown): Either.Either<SongFull, ParseError> =>
  checkType(
    'SongFull',
    {
      type: 'SONG',
      videoId: traverseString(data, 'videoDetails', 'videoId'),
      name: traverseString(data, 'videoDetails', 'title'),
      artist: {
        name: traverseString(data, 'author'),
        artistId: traverseString(data, 'videoDetails', 'channelId') || null,
      },
      duration: +traverseString(data, 'videoDetails', 'lengthSeconds'),
      thumbnails: traverseList(data, 'videoDetails', 'thumbnails'),
      formats: traverseList(data, 'streamingData', 'formats'),
      adaptiveFormats: traverseList(data, 'streamingData', 'adaptiveFormats'),
    },
    SongFull,
  )

export const parseSearchResult = (
  item: unknown,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = traverseList(item, 'flexColumns', 'runs')
  const title = columns[0]
  const artist = columns.find(isArtist) ?? columns[3]
  const album = columns.find(isAlbum) ?? null
  const duration = columns.find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: traverseString(item, 'playlistItemData', 'videoId'),
      name: traverseString(title, 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      album: album
        ? {
            name: traverseString(album, 'text'),
            albumId: traverseString(album, 'browseId'),
          }
        : null,
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    SongDetailed,
  )
}

export const parseArtistSong = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const title = columns.find(isTitle)
  const album = columns.find(isAlbum)
  const duration = columns.find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: traverseString(item, 'playlistItemData', 'videoId'),
      name: traverseString(title, 'text'),
      artist: artistBasic,
      album: album
        ? {
            name: traverseString(album, 'text'),
            albumId: traverseString(album, 'browseId'),
          }
        : null,
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    SongDetailed,
  )
}

export const parseArtistTopSong = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const title = columns.find(isTitle)
  const album = columns.find(isAlbum)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: traverseString(item, 'playlistItemData', 'videoId'),
      name: traverseString(title, 'text'),
      artist: artistBasic,
      album: album
        ? {
            name: traverseString(album, 'text'),
            albumId: traverseString(album, 'browseId'),
          }
        : null,
      duration: null,
      thumbnails: traverseList(item, 'thumbnails'),
    },
    SongDetailed,
  )
}

export const parseAlbumSong = (
  item: unknown,
  artistBasic: ArtistBasic,
  albumBasic: AlbumBasic,
  thumbnails: ThumbnailFull[],
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const title = (traverseList(item, 'flexColumns', 'runs') as unknown[]).find(
    isTitle,
  )
  const duration = (
    traverseList(item, 'fixedColumns', 'runs') as unknown[]
  ).find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: traverseString(item, 'playlistItemData', 'videoId'),
      name: traverseString(title, 'text'),
      artist: artistBasic,
      album: albumBasic,
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails,
    },
    SongDetailed,
  )
}

export const parseHomeSection = (
  item: unknown,
): Either.Either<import('../schema/song').SongDetailed, ParseError> =>
  parseSearchResult(item)
