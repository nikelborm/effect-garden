import * as Effect from 'effect/Effect'

import type { ParseError } from '../errors.ts'
import { AlbumDetailed } from '../schema/AlbumDetailed.ts'
import { AlbumFull } from '../schema/AlbumFull.ts'
import type { ArtistBasic } from '../schema/ArtistBasic.ts'
import { checkType } from '../utils/checkType.ts'
import { extract, extractList, extractString } from '../utils/extract.ts'
import * as SongParser from './SongParser.ts'

const processYear = (year: string | undefined): number | null =>
  year?.match(/^\d{4}$/) ? +year : null

export const parse = (
  data: unknown,
  albumId: string,
): Effect.Effect<AlbumFull, ParseError> =>
  Effect.gen(function* () {
    const albumBasic = {
      albumId,
      name: extractString(data, 'tabs', 'title', 'text'),
    }

    const artistData = extract(data, 'tabs', 'straplineTextOne', 'runs')
    const artistBasic: ArtistBasic = {
      artistId: extractString(artistData, 'browseId') || null,
      name: extractString(artistData, 'text'),
    }

    const thumbnails = extractList(data, 'background', 'thumbnails')

    const items = extractList(
      data,
      'musicResponsiveListItemRenderer',
    ) as unknown[]

    // `Effect.partition` runs every parse, never fails, and splits results
    // into `[failures, successes]`. We want only the successes to feed the
    // AlbumFull schema, mirroring the previous `Result.isSuccess` filter.
    const [, songs] = yield* Effect.partition(
      items,
      item =>
        SongParser.parseAlbumSong(item, artistBasic, albumBasic, thumbnails),
      { concurrency: 'unbounded' },
    )

    return yield* checkType(
      'AlbumFull',
      {
        type: 'ALBUM',
        ...albumBasic,
        playlistId: extractString(
          data,
          'musicPlayButtonRenderer',
          'playlistId',
        ),
        artist: artistBasic,
        year: processYear(
          extractList(data, 'tabs', 'subtitle', 'text').at(-1) as
            | string
            | undefined,
        ),
        thumbnails,
        songs,
      },
      AlbumFull,
    )
  })

export const parseSearchResult = (
  item: unknown,
): Effect.Effect<AlbumDetailed, ParseError> => {
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
  const playlistId =
    extractString(item, 'overlay', 'playlistId') ||
    extractString(item, 'thumbnailOverlay', 'playlistId')

  return checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: extractList(item, 'browseId').at(-1) as string,
      playlistId,
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      year: processYear((columns.at(-1) as any)?.text as string | undefined),
      name: extractString(title, 'text'),
      thumbnails: extractList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )
}

export const parseArtistAlbum = (
  item: unknown,
  artistBasic: ArtistBasic,
): Effect.Effect<AlbumDetailed, ParseError> =>
  checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: extractList(item, 'browseId').at(-1) as string,
      playlistId: extractString(item, 'thumbnailOverlay', 'playlistId'),
      name: extractString(item, 'title', 'text'),
      artist: artistBasic,
      year: processYear(
        extractList(item, 'subtitle', 'text').at(-1) as string | undefined,
      ),
      thumbnails: extractList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )

export const parseArtistTopAlbum = (
  item: unknown,
  artistBasic: ArtistBasic,
): Effect.Effect<AlbumDetailed, ParseError> =>
  checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: extractList(item, 'browseId').at(-1) as string,
      playlistId: extractString(item, 'musicPlayButtonRenderer', 'playlistId'),
      name: extractString(item, 'title', 'text'),
      artist: artistBasic,
      year: processYear(
        extractList(item, 'subtitle', 'text').at(-1) as string | undefined,
      ),
      thumbnails: extractList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )

export const parseHomeSection = (
  item: unknown,
): Effect.Effect<AlbumDetailed, ParseError> => {
  const artist = (extractList(item, 'subtitle', 'runs') as unknown[]).at(-1)

  return checkType(
    'AlbumDetailed',
    {
      type: 'ALBUM',
      albumId: extractString(item, 'title', 'browseId'),
      playlistId: extractString(item, 'thumbnailOverlay', 'playlistId'),
      name: extractString(item, 'title', 'text'),
      artist: {
        name: extractString(artist, 'text'),
        artistId: extractString(artist, 'browseId') || null,
      },
      year: null,
      thumbnails: extractList(item, 'thumbnails'),
    },
    AlbumDetailed,
  )
}
