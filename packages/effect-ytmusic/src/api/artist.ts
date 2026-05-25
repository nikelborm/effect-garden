import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import type { ArtistId } from '../brands.ts'
import { ContinuationToken } from '../brands.ts'
import { constructRequest } from '../client.ts'
import { MissingBrowseTokenError } from '../errors.ts'
import * as AlbumParser from '../parsers/AlbumParser.ts'
import * as ArtistParser from '../parsers/ArtistParser.ts'
import * as SongParser from '../parsers/SongParser.ts'
import { extract, extractList, extractString } from '../utils/extract.ts'

export const getArtist = Effect.fn('effect-ytmusic/getArtist')(function* (
  artistId: ArtistId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/artistId', artistId)
  const data = yield* constructRequest('browse', { browseId: artistId })
  const artist = yield* ArtistParser.parse(data, artistId)
  yield* Effect.annotateCurrentSpan('effect-ytmusic/artist.name', artist.name)
  return artist
})

export const getArtistSongs = (artistId: ArtistId) =>
  Stream.unwrap(
    Effect.fn('effect-ytmusic/getArtistSongs')(function* () {
      yield* Effect.annotateCurrentSpan('effect-ytmusic/artistId', artistId)

      const artistData = yield* constructRequest('browse', {
        browseId: artistId,
      })
      const artistName = extractString(artistData, 'header', 'title', 'text')
      const browseToken = extract(
        artistData,
        'musicShelfRenderer',
        'title',
        'browseId',
      ) as string | string[]

      if (Array.isArray(browseToken) || !browseToken) {
        return yield* new MissingBrowseTokenError({ context: 'getArtistSongs' })
      }

      const artistBasic = { artistId, name: artistName }

      return Stream.paginateChunkEffect(
        Option.none<ContinuationToken>(),
        Effect.fn('effect-ytmusic/getArtistSongs.page')(
          function* (continuation) {
            yield* Effect.annotateCurrentSpan(
              'effect-ytmusic/artistId',
              artistId,
            )

            const data = yield* Option.match(continuation, {
              onNone: () =>
                constructRequest('browse', { browseId: browseToken }),
              onSome: token =>
                constructRequest('browse', {}, { continuation: token }),
            })

            const items = extractList(
              data,
              'musicResponsiveListItemRenderer',
            ) as unknown[]
            const songs = yield* Effect.forEach(items, item =>
              SongParser.parseArtistSong(item, artistBasic),
            )

            const rawNext = extract(data, 'continuation')
            const next =
              typeof rawNext === 'string'
                ? Option.some(Option.some(ContinuationToken(rawNext)))
                : Option.none<Option.Option<ContinuationToken>>()

            yield* Effect.annotateCurrentSpan(
              'effect-ytmusic/page.songCount',
              songs.length,
            )
            return [Chunk.fromIterable(songs), next] as const
          },
        ),
      )
    })(),
  )

export const getArtistAlbums = Effect.fn('effect-ytmusic/getArtistAlbums')(
  function* (artistId: ArtistId) {
    yield* Effect.annotateCurrentSpan('effect-ytmusic/artistId', artistId)

    const artistData = yield* constructRequest('browse', { browseId: artistId })
    const artistAlbumsData = (
      extractList(artistData, 'musicCarouselShelfRenderer') as unknown[]
    )[0]
    const browseBody = extract(
      artistAlbumsData,
      'moreContentButton',
      'browseEndpoint',
    ) as Record<string, unknown>

    const albumsData = yield* constructRequest('browse', browseBody)
    const artistName = extractString(albumsData, 'header', 'runs', 'text')
    const artistBasic = { artistId, name: artistName }

    const results = yield* Effect.forEach(
      extractList(albumsData, 'musicTwoRowItemRenderer') as unknown[],
      item => AlbumParser.parseArtistAlbum(item, artistBasic),
    )

    yield* Effect.annotateCurrentSpan(
      'effect-ytmusic/albumCount',
      results.length,
    )
    return results
  },
)
