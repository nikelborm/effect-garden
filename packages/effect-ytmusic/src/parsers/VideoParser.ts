import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { ArtistBasic } from '../schema/common.ts'
import { VideoDetailed, VideoFull } from '../schema/video.ts'
import { checkType } from '../utils/checkType.ts'
import { isArtist, isDuration, isTitle } from '../utils/filters.ts'
import { traverse, traverseList, traverseString } from '../utils/traverse.ts'
import { parseDuration } from './Parser.ts'

export const parse = (data: unknown): Either.Either<VideoFull, ParseError> =>
  checkType(
    'VideoFull',
    {
      type: 'VIDEO',
      videoId: traverseString(data, 'videoDetails', 'videoId'),
      name: traverseString(data, 'videoDetails', 'title'),
      artist: {
        artistId: traverseString(data, 'videoDetails', 'channelId') || null,
        name: traverseString(data, 'author'),
      },
      duration: +traverseString(data, 'videoDetails', 'lengthSeconds'),
      thumbnails: traverseList(data, 'videoDetails', 'thumbnails'),
      unlisted: traverse(data, 'unlisted') as boolean,
      familySafe: traverse(data, 'familySafe') as boolean,
      paid: traverse(data, 'paid') as boolean,
      tags: traverseList(data, 'tags'),
    },
    VideoFull,
  )

export const parseSearchResult = (
  item: unknown,
): Either.Either<VideoDetailed, ParseError> => {
  const columns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const title = columns.find(isTitle)
  const artist = columns.find(isArtist) ?? columns[1]
  const duration = columns.find(isDuration)

  return checkType(
    'VideoDetailed',
    {
      type: 'VIDEO',
      videoId: traverseString(item, 'playNavigationEndpoint', 'videoId'),
      name: traverseString(title, 'text'),
      artist: {
        artistId: traverseString(artist, 'browseId') || null,
        name: traverseString(artist, 'text'),
      },
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: traverseList(item, 'thumbnails'),
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
      videoId: traverseString(item, 'videoId'),
      name: traverseString(item, 'runs', 'text'),
      artist: artistBasic,
      duration: null,
      thumbnails: traverseList(item, 'thumbnails'),
    },
    VideoDetailed,
  )

export const parsePlaylistVideo = (
  item: unknown,
): Either.Either<VideoDetailed, ParseError> | null => {
  const flexColumns = (
    traverseList(item, 'flexColumns', 'runs') as unknown[]
  ).flat()
  const fixedColumns = (
    traverseList(item, 'fixedColumns', 'runs') as unknown[]
  ).flat()

  const title = flexColumns.find(isTitle) ?? flexColumns[0]
  const artist = flexColumns.find(isArtist) ?? flexColumns[1]
  const duration = fixedColumns.find(isDuration)

  const videoId1 = traverseString(item, 'playNavigationEndpoint', 'videoId')
  const thumbnailUrl =
    (traverseList(item, 'thumbnails')[0] as { url?: string } | undefined)
      ?.url ?? ''
  const videoId2Match = thumbnailUrl.match(
    /https:\/\/i\.ytimg\.com\/vi\/(.+)\//,
  )

  if (!videoId1 && !videoId2Match) return null

  return checkType(
    'VideoDetailed',
    {
      type: 'VIDEO',
      videoId: videoId1 || videoId2Match![1],
      name: traverseString(title, 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      duration: parseDuration((duration as any)?.text as string | undefined),
      thumbnails: traverseList(item, 'thumbnails'),
    },
    VideoDetailed,
  )
}
