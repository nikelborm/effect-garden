import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'

import { constructRequest } from '../client.ts'
import * as AlbumParser from '../parsers/AlbumParser.ts'
import * as ArtistParser from '../parsers/ArtistParser.ts'
import * as PlaylistParser from '../parsers/PlaylistParser.ts'
import * as SearchParser from '../parsers/SearchParser.ts'
import * as SongParser from '../parsers/SongParser.ts'
import * as VideoParser from '../parsers/VideoParser.ts'
import { extractList } from '../utils/extract.ts'

export const getSearchSuggestions = Effect.fn(
  'effect-ytmusic/getSearchSuggestions',
)(function* (query: string) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
  const data = yield* constructRequest('music/get_search_suggestions', {
    input: query,
  })
  return extractList(data, 'query') as string[]
})

export const search = Effect.fn('effect-ytmusic/search')(function* (
  query: string,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
  const data = yield* constructRequest('search', { query, params: null })

  const results = (
    extractList(data, 'musicResponsiveListItemRenderer') as unknown[]
  ).flatMap(item => {
    const r = SearchParser.parse(item)
    if (!r || Either.isLeft(r)) return []
    return [r.right]
  })

  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/resultCount',
    results.length,
  )
  return results
})

export const searchSongs = Effect.fn('effect-ytmusic/searchSongs')(function* (
  query: string,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
  const data = yield* constructRequest('search', {
    query,
    params: 'Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D',
  })

  const results = yield* Effect.forEach(
    extractList(data, 'musicResponsiveListItemRenderer') as unknown[],
    item => SongParser.parseSearchResult(item),
  )
  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/resultCount',
    results.length,
  )
  return results
})

export const searchVideos = Effect.fn('effect-ytmusic/searchVideos')(function* (
  query: string,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
  const data = yield* constructRequest('search', {
    query,
    params: 'Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D',
  })

  const results = yield* Effect.forEach(
    extractList(data, 'musicResponsiveListItemRenderer') as unknown[],
    item => VideoParser.parseSearchResult(item),
  )
  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/resultCount',
    results.length,
  )
  return results
})

export const searchArtists = Effect.fn('effect-ytmusic/searchArtists')(
  function* (query: string) {
    yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
    const data = yield* constructRequest('search', {
      query,
      params: 'Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D',
    })

    const results = yield* Effect.forEach(
      extractList(data, 'musicResponsiveListItemRenderer') as unknown[],
      item => ArtistParser.parseSearchResult(item),
    )
    yield* Effect.annotateCurrentSpan(
      'effect-ytmusic/resultCount',
      results.length,
    )
    return results
  },
)

export const searchAlbums = Effect.fn('effect-ytmusic/searchAlbums')(function* (
  query: string,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
  const data = yield* constructRequest('search', {
    query,
    params: 'Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D',
  })

  const results = yield* Effect.forEach(
    extractList(data, 'musicResponsiveListItemRenderer') as unknown[],
    item => AlbumParser.parseSearchResult(item),
  )
  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/resultCount',
    results.length,
  )
  return results
})

export const searchPlaylists = Effect.fn('effect-ytmusic/searchPlaylists')(
  function* (query: string) {
    yield* Effect.annotateCurrentSpan('effect-ytmusic/query', query)
    const data = yield* constructRequest('search', {
      query,
      params: 'Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D',
    })

    const results = yield* Effect.forEach(
      extractList(data, 'musicResponsiveListItemRenderer') as unknown[],
      item => PlaylistParser.parseSearchResult(item),
    )
    yield* Effect.annotateCurrentSpan(
      'effect-ytmusic/resultCount',
      results.length,
    )
    return results
  },
)
