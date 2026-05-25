import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type {
  AlbumBasic,
  ArtistBasic,
  ThumbnailFull,
} from '../schema/common.ts'
import { SongDetailed, SongFull } from '../schema/song.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import { isAlbum, isArtist, isDuration, isTitle } from '../utils/filters.ts'
import { parseDuration } from './Parser.ts'

export const parse = (data: unknown): Either.Either<SongFull, ParseError> =>
  checkType(
    'SongFull',
    {
      type: 'SONG',
      videoId: extractString(data, 'videoDetails', 'videoId'),
      name: extractString(data, 'videoDetails', 'title'),
      artist: {
        name: extractString(data, 'author'),
        artistId: extractString(data, 'videoDetails', 'channelId') || null,
      },
      duration: +extractString(data, 'videoDetails', 'lengthSeconds'),
      thumbnails: extractList(data, 'videoDetails', 'thumbnails'),
      formats: extractList(data, 'streamingData', 'formats'),
      adaptiveFormats: extractList(data, 'streamingData', 'adaptiveFormats'),
    },
    SongFull,
  )

export const parseSearchResult = (
  item: unknown,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = extractList(item, 'flexColumns', 'runs')
  const title = columns[0]
  const artist = columns.find(isArtist) ?? columns[3]
  const album = columns.find(isAlbum) ?? null
  const duration = columns.find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: extractString(item, 'playlistItemData', 'videoId'),
      name: extractString(title, 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      album: album
        ? {
            name: extractString(album, 'text'),
            albumId: extractString(album, 'browseId'),
          }
        : null,
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: extractList(item, 'thumbnails'),
    },
    SongDetailed,
  )
}

export const parseArtistSong = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = (extractList(item, 'flexColumns', 'runs') as unknown[]).flat()
  const title = columns.find(isTitle)
  const album = columns.find(isAlbum)
  const duration = columns.find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: extractString(item, 'playlistItemData', 'videoId'),
      name: extractString(title, 'text'),
      artist: artistBasic,
      album: album
        ? {
            name: extractString(album, 'text'),
            albumId: extractString(album, 'browseId'),
          }
        : null,
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: extractList(item, 'thumbnails'),
    },
    SongDetailed,
  )
}

export const parseArtistTopSong = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<import('../schema/song').SongDetailed, ParseError> => {
  const columns = (extractList(item, 'flexColumns', 'runs') as unknown[]).flat()
  const title = columns.find(isTitle)
  const album = columns.find(isAlbum)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: extractString(item, 'playlistItemData', 'videoId'),
      name: extractString(title, 'text'),
      artist: artistBasic,
      album: album
        ? {
            name: extractString(album, 'text'),
            albumId: extractString(album, 'browseId'),
          }
        : null,
      duration: null,
      thumbnails: extractList(item, 'thumbnails'),
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
  const title = (extractList(item, 'flexColumns', 'runs') as unknown[]).find(
    isTitle,
  )
  const duration = (
    extractList(item, 'fixedColumns', 'runs') as unknown[]
  ).find(isDuration)

  return checkType(
    'SongDetailed',
    {
      type: 'SONG',
      videoId: extractString(item, 'playlistItemData', 'videoId'),
      name: extractString(title, 'text'),
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
