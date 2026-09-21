import * as Effect from 'effect/Effect'

import { PageType } from '../constants.ts'
import { ParseError } from '../errors.ts'
import { HomeSection } from '../schema/HomeSection.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import * as AlbumParser from './AlbumParser.ts'
import * as PlaylistParser from './PlaylistParser.ts'
import * as SongParser from './SongParser.ts'

export const parseDuration = (time: string | undefined): number | null => {
  if (!time) return null
  const parts = time.split(':').reverse().map(Number) as (number | undefined)[]
  const [seconds = 0, minutes = 0, hours = 0] = parts
  return seconds + minutes * 60 + hours * 60 * 60
}

export const parseNumber = (string: string): number => {
  const last = string.at(-1)!
  if (/^[A-Z]$/.test(last)) {
    const number = +string.slice(0, -1)
    return (
      {
        K: number * 1_000,
        M: number * 1_000_000,
        B: number * 1_000_000_000,
        T: number * 1_000_000_000_000,
      }[last] ?? NaN
    )
  }
  return +string
}

export const parseHomeSection = (
  data: unknown,
): Effect.Effect<HomeSection, ParseError> =>
  Effect.gen(function* () {
    const pageType = extractString(
      data,
      'contents',
      'title',
      'browseEndpoint',
      'pageType',
    )
    const playlistId = extractString(
      data,
      'navigationEndpoint',
      'watchPlaylistEndpoint',
      'playlistId',
    )
    const title = extractString(data, 'header', 'title', 'text')

    const items = extractList(data, 'contents') as unknown[]

    const parseItem = (
      item: unknown,
    ): Effect.Effect<unknown, ParseError> | null => {
      switch (pageType) {
        case PageType.MUSIC_PAGE_TYPE_ALBUM:
          return AlbumParser.parseHomeSection(item)
        case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
          return PlaylistParser.parseHomeSection(item)
        case '':
          return playlistId
            ? PlaylistParser.parseHomeSection(item)
            : SongParser.parseHomeSection(item)
        default:
          return null
      }
    }

    // Run every applicable parse in parallel, then keep only the successes.
    const [, contents] = yield* Effect.partition(
      items,
      item => parseItem(item) ?? Effect.fail(new ParseError({} as never)),
      { concurrency: 'unbounded' },
    )

    return yield* checkType('HomeSection', { title, contents }, HomeSection)
  })
