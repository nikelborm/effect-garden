import * as Effect from 'effect/Effect'

import type { VideoId } from '../brands.ts'
import { constructRequest } from '../client.ts'
import {
  LyricsNotFoundError,
  MissingBrowseTokenError,
  VideoIdMismatchError,
} from '../errors.ts'
import * as SongParser from '../parsers/SongParser.ts'
import * as UpNextsParser from '../parsers/UpNextsParser.ts'
import { extractList, extractString } from '../utils/extract.ts'

export const getSong = Effect.fn('effect-ytmusic/getSong')(function* (
  videoId: VideoId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/videoId', videoId)
  const data = yield* constructRequest('player', { videoId })
  const song = yield* SongParser.parse(data)

  if (song.videoId !== videoId) {
    return yield* new VideoIdMismatchError({
      requested: videoId,
      received: song.videoId,
    })
  }

  yield* Effect.annotateCurrentSpan('effect-ytmusic/song.name', song.name)
  return song
})

export const getUpNexts = Effect.fn('effect-ytmusic/getUpNexts')(function* (
  videoId: VideoId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/videoId', videoId)

  const data = yield* constructRequest('next', {
    videoId,
    playlistId: `RDAMVM${videoId}`,
    isAudioOnly: true,
  })

  const items = yield* UpNextsParser.parse(data)
  yield* Effect.annotateCurrentSpan(
    'effect-ytmusic/upnexts.count',
    items.length,
  )
  return items
})

export const getLyrics = Effect.fn('effect-ytmusic/getLyrics')(function* (
  videoId: VideoId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/videoId', videoId)

  const data = yield* constructRequest('next', { videoId })
  const tabs = extractList(data, 'tabs', 'tabRenderer') as unknown[]
  const browseId = extractString(tabs[1], 'browseId')

  if (!browseId) {
    return yield* new MissingBrowseTokenError({ context: 'getLyrics' })
  }

  yield* Effect.annotateCurrentSpan('effect-ytmusic/lyrics.browseId', browseId)

  const lyricsData = yield* constructRequest('browse', { browseId })
  const lyrics = extractString(lyricsData, 'description', 'runs', 'text')

  if (!lyrics) return yield* new LyricsNotFoundError()

  return lyrics
    .replaceAll('\r', '')
    .split('\n')
    .filter(v => !!v)
})
