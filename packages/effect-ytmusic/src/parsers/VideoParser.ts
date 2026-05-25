import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { ArtistBasic } from '../schema/ArtistBasic.ts'
import { VideoDetailed } from '../schema/VideoDetailed.ts'
import { VideoFull } from '../schema/VideoFull.ts'
import { checkType } from '../utils/checkType.ts'
import { extract, extractList, extractString } from '../utils/extract.ts'
import { isArtist, isDuration, isTitle } from '../utils/filters.ts'
import { parseDuration } from './Parser.ts'

export const parse = (data: unknown): Either.Either<VideoFull, ParseError> =>
  checkType(
    'VideoFull',
    {
      type: 'VIDEO',
      videoId: extractString(data, 'videoDetails', 'videoId'),
      name: extractString(data, 'videoDetails', 'title'),
      artist: {
        artistId: extractString(data, 'videoDetails', 'channelId') || null,
        name: extractString(data, 'author'),
      },
      duration: +extractString(data, 'videoDetails', 'lengthSeconds'),
      thumbnails: extractList(data, 'videoDetails', 'thumbnails'),
      unlisted: extract(data, 'unlisted') as boolean,
      familySafe: extract(data, 'familySafe') as boolean,
      paid: extract(data, 'paid') as boolean,
      tags: extractList(data, 'tags'),
    },
    VideoFull,
  )

export const parseSearchResult = (
  item: unknown,
): Either.Either<VideoDetailed, ParseError> => {
  const columns = (extractList(item, 'flexColumns', 'runs') as unknown[]).flat()
  const title = columns.find(isTitle)
  const artist = columns.find(isArtist) ?? columns[1]
  const duration = columns.find(isDuration)

  return checkType(
    'VideoDetailed',
    {
      type: 'VIDEO',
      videoId: extractString(item, 'playNavigationEndpoint', 'videoId'),
      name: extractString(title, 'text'),
      artist: {
        artistId: extractString(artist, 'browseId') || null,
        name: extractString(artist, 'text'),
      },
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: extractList(item, 'thumbnails'),
    },
    VideoDetailed,
  )
}

export const parseArtistTopVideo = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<VideoDetailed, ParseError> =>
  checkType(
    'VideoDetailed',
    {
      type: 'VIDEO',
      videoId: extractString(item, 'videoId'),
      name: extractString(item, 'runs', 'text'),
      artist: artistBasic,
      duration: null,
      thumbnails: extractList(item, 'thumbnails'),
    },
    VideoDetailed,
  )

export const parsePlaylistVideo = (
  item: unknown,
): Either.Either<VideoDetailed, ParseError> | null => {
  const flexColumns = (
    extractList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const fixedColumns = (
    extractList(item, 'fixedColumns', 'runs') as unknown[]
  ).flat()

  const title = flexColumns.find(isTitle) ?? flexColumns[0]
  const artist = flexColumns.find(isArtist) ?? flexColumns[1]
  const duration = fixedColumns.find(isDuration)

  const videoId1 = extractString(item, 'playNavigationEndpoint', 'videoId')
  const thumbnailUrl =
    (extractList(item, 'thumbnails')[0] as { url?: string } | undefined)?.url ??
    ''
  const videoId2Match = thumbnailUrl.match(
    /https:\/\/i\.ytimg\.com\/vi\/(.+)\//,
  )

  if (!videoId1 && !videoId2Match) return null

  return checkType(
    'VideoDetailed',
    {
      type: 'VIDEO',
      videoId: videoId1 || videoId2Match![1],
      name: extractString(title, 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: extractList(item, 'thumbnails'),
    },
    VideoDetailed,
  )
}
