import * as Either from 'effect/Either'

import { PageType } from '../constants.ts'
import type { ParseError } from '../errors.ts'
import type { HomeSection } from '../schema/home.ts'
import { HomeSection as HomeSectionSchema } from '../schema/home.ts'
import { checkType } from '../utils/checkType.ts'
import { traverseList, traverseString } from '../utils/traverse.ts'
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
): Either.Either<HomeSection, ParseError> => {
  const pageType = traverseString(
    data,
    'contents',
    'title',
    'browseEndpoint',
    'pageType',
  )
  const playlistId = traverseString(
    data,
    'navigationEndpoint',
    'watchPlaylistEndpoint',
    'playlistId',
  )
  const title = traverseString(data, 'header', 'title', 'text')

  const contents = (traverseList(data, 'contents') as unknown[]).flatMap(
    item => {
      let result: Either.Either<unknown, ParseError>
      switch (pageType) {
        case PageType.MUSIC_PAGE_TYPE_ALBUM:
          result = AlbumParser.parseHomeSection(item)
          break
        case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
          result = PlaylistParser.parseHomeSection(item)
          break
        case '':
          result = playlistId
            ? PlaylistParser.parseHomeSection(item)
            : SongParser.parseHomeSection(item)
          break
        default:
          return []
      }
      return Either.isRight(result) ? [result.right] : []
    },
  )

  return checkType('HomeSection', { title, contents }, HomeSectionSchema)
}
