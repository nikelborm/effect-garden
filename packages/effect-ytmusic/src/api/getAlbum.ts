import * as Effect from 'effect/Effect'

import type { AlbumId } from '../brands.ts'
import { constructRequest } from '../client.ts'
import * as AlbumParser from '../parsers/AlbumParser.ts'

export const getAlbum = Effect.fn('effect-ytmusic/getAlbum')(function* (
  albumId: AlbumId,
) {
  yield* Effect.annotateCurrentSpan('effect-ytmusic/album.id', albumId)
  const data = yield* constructRequest('browse', { browseId: albumId })
  const album = yield* AlbumParser.parse(data, albumId)
  yield* Effect.annotateCurrentSpan('effect-ytmusic/album.name', album.name)
  return album
})
