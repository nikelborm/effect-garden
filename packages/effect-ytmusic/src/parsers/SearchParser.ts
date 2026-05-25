import type * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { SearchResult } from '../schema/home.ts'
import { extractList } from '../utils/extract.ts'
import * as AlbumParser from './AlbumParser.ts'
import * as ArtistParser from './ArtistParser.ts'
import * as PlaylistParser from './PlaylistParser.ts'
import * as SongParser from './SongParser.ts'
import * as VideoParser from './VideoParser.ts'

export const parse = (
  item: unknown,
): Either.Either<SearchResult, ParseError> | null => {
  const flexColumns = extractList(item, 'flexColumns')
  const type = (extractList(flexColumns[1], 'runs', 'text') as unknown[]).at(
    0,
  ) as string | undefined

  switch (type) {
    case 'Song':
      return SongParser.parseSearchResult(item)
    case 'Video':
      return VideoParser.parseSearchResult(item)
    case 'Artist':
      return ArtistParser.parseSearchResult(item)
    case 'EP':
    case 'Single':
    case 'Album':
      return AlbumParser.parseSearchResult(item)
    case 'Playlist':
      return PlaylistParser.parseSearchResult(item)
    default:
      return null
  }
}
