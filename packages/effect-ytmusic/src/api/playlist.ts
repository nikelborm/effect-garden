import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ContinuationToken, type PlaylistId } from '../brands.ts'
import { constructRequest } from '../client.ts'
import * as PlaylistParser from '../parsers/PlaylistParser.ts'
import * as VideoParser from '../parsers/VideoParser.ts'
import { extract, extractList } from '../utils/extract.ts'

const normalizePlaylistId = (playlistId: PlaylistId): string =>
  playlistId.startsWith('PL') ? `VL${playlistId}` : playlistId

export const getPlaylist = Effect.fn('effect-ytmusic/getPlaylist')(function* (
  playlistId: PlaylistId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/playlistId', playlistId)
  const id = normalizePlaylistId(playlistId)
  const data = yield* constructRequest('browse', { browseId: id })
  const playlist = yield* PlaylistParser.parse(data, playlistId)
  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/playlist.name',
    playlist.name,
  )
  return playlist
})

export const getPlaylistVideos = (playlistId: PlaylistId) =>
  Stream.paginateChunkEffect(
    Option.none<ContinuationToken>(),
    Effect.fn('effect-ytmusic/getPlaylistVideos.page')(
      function* (continuation) {
        yield* Effect.annotateCurrentSpan(
          'effect-ytmusic/playlistId',
          playlistId,
        )

        const id = normalizePlaylistId(playlistId)
        const data = yield* Option.match(continuation, {
          onNone: () => constructRequest('browse', { browseId: id }),
          onSome: token =>
            constructRequest('browse', {}, { continuation: token }),
        })

        const items = extractList(
          data,
          'musicPlaylistShelfRenderer',
          'musicResponsiveListItemRenderer',
        ) as unknown[]

        const allItems =
          items.length > 0
            ? items
            : (extractList(
                data,
                'musicResponsiveListItemRenderer',
              ) as unknown[])

        const videos = yield* Effect.forEach(allItems, item => {
          const r = VideoParser.parsePlaylistVideo(item)
          return r ? r : Effect.succeed(null)
        })

        const validVideos = videos.filter(
          (v): v is NonNullable<typeof v> => v !== null,
        )

        const rawNext = extract(data, 'continuation')
        const next =
          typeof rawNext === 'string'
            ? Option.some(Option.some(ContinuationToken(rawNext)))
            : Option.none<Option.Option<ContinuationToken>>()

        yield* Effect.annotateCurrentSpan(
          'effect-ytmusic/page.videoCount',
          validVideos.length,
        )
        return [Chunk.fromIterable(validVideos), next] as const
      },
    ),
  )
