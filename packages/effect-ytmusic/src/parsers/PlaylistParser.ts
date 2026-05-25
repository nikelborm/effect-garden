import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { ArtistBasic } from '../schema/common.ts'
import { PlaylistDetailed, PlaylistFull } from '../schema/playlist.ts'
import { checkType } from '../utils/checkType.ts'
import { extract, extractList, extractString } from '../utils/extract.ts'

export const parse = (
  data: unknown,
  playlistId: string,
): Either.Either<PlaylistFull, ParseError> => {
  const artist = extract(data, 'tabs', 'straplineTextOne')

  return checkType(
    'PlaylistFull',
    {
      type: 'PLAYLIST',
      playlistId,
      name: extractString(data, 'tabs', 'title', 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      videoCount: +(
        (
          extractList(data, 'tabs', 'secondSubtitle', 'text').at(2) as
            | string
            | undefined
        )
          ?.split(' ')
          .at(0)
          ?.replaceAll(',', '') ?? '0'
      ),
      thumbnails: extractList(data, 'tabs', 'thumbnails'),
    },
    PlaylistFull,
  )
}

export const parseSearchResult = (
  item: unknown,
): Either.Either<PlaylistDetailed, ParseError> => {
  const columns = (extractList(item, 'flexColumns', 'runs') as unknown[]).flat()
  const title = columns[0]
  const artist =
    columns.find((c: unknown) => {
      const pageType = extractString(c, 'pageType')
      return [
        'MUSIC_PAGE_TYPE_ARTIST',
        'MUSIC_PAGE_TYPE_USER_CHANNEL',
      ].includes(pageType)
    }) ?? columns[3]

  return checkType(
    'PlaylistDetailed',
    {
      type: 'PLAYLIST',
      playlistId: extractString(item, 'overlay', 'playlistId'),
      name: extractString(title, 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      thumbnails: extractList(item, 'thumbnails'),
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
      playlistId: extractString(item, 'navigationEndpoint', 'browseId'),
      name: extractString(item, 'runs', 'text'),
      artist: artistBasic,
      thumbnails: extractList(item, 'thumbnails'),
    },
    PlaylistDetailed,
  )

export const parseHomeSection = (
  item: unknown,
): Either.Either<PlaylistDetailed, ParseError> => {
  const artist = extract(item, 'subtitle', 'runs')

  return checkType(
    'PlaylistDetailed',
    {
      type: 'PLAYLIST',
      playlistId: extractString(item, 'navigationEndpoint', 'playlistId'),
      name: extractString(item, 'runs', 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      thumbnails: extractList(item, 'thumbnails'),
    },
    PlaylistDetailed,
  )
}
