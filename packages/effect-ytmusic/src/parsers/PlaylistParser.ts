import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { ArtistBasic } from '../schema/common.ts'
import { PlaylistDetailed, PlaylistFull } from '../schema/playlist.ts'
import { checkType } from '../utils/checkType.ts'
import { traverse, traverseList, traverseString } from '../utils/traverse.ts'

export const parse = (
  data: unknown,
  playlistId: string,
): Either.Either<PlaylistFull, ParseError> => {
  const artist = traverse(data, 'tabs', 'straplineTextOne')

  return checkType(
    'PlaylistFull',
    {
      type: 'PLAYLIST',
      playlistId,
      name: traverseString(data, 'tabs', 'title', 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      videoCount: +(
        (
          traverseList(data, 'tabs', 'secondSubtitle', 'text').at(2) as
            | string
            | undefined
        )
          ?.split(' ')
          .at(0)
          ?.replaceAll(',', '') ?? '0'
      ),
      thumbnails: traverseList(data, 'tabs', 'thumbnails'),
    },
    PlaylistFull,
  )
}

export const parseSearchResult = (
  item: unknown,
): Either.Either<PlaylistDetailed, ParseError> => {
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

  return checkType(
    'PlaylistDetailed',
    {
      type: 'PLAYLIST',
      playlistId: traverseString(item, 'overlay', 'playlistId'),
      name: traverseString(title, 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      thumbnails: traverseList(item, 'thumbnails'),
    },
    PlaylistDetailed,
  )
}

export const parseArtistFeaturedOn = (
  item: unknown,
  artistBasic: ArtistBasic,
): Either.Either<PlaylistDetailed, ParseError> =>
  checkType(
    'PlaylistDetailed',
    {
      type: 'PLAYLIST',
      playlistId: traverseString(item, 'navigationEndpoint', 'browseId'),
      name: traverseString(item, 'runs', 'text'),
      artist: artistBasic,
      thumbnails: traverseList(item, 'thumbnails'),
    },
    PlaylistDetailed,
  )

export const parseHomeSection = (
  item: unknown,
): Either.Either<PlaylistDetailed, ParseError> => {
  const artist = traverse(item, 'subtitle', 'runs')

  return checkType(
    'PlaylistDetailed',
    {
      type: 'PLAYLIST',
      playlistId: traverseString(item, 'navigationEndpoint', 'playlistId'),
      name: traverseString(item, 'runs', 'text'),
      artist: {
        name: traverseString(artist, 'text'),
        artistId: traverseString(artist, 'browseId') || null,
      },
      thumbnails: traverseList(item, 'thumbnails'),
    },
    PlaylistDetailed,
  )
}
