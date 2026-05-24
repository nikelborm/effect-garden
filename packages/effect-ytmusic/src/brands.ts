import * as Brand from 'effect/Brand'
import * as Schema from 'effect/Schema'

export type VideoId = string & Brand.Brand<'VideoId'>
export const VideoId = Brand.refined<VideoId>(
  s => /^[a-zA-Z0-9-_]{11}$/.test(s),
  s => Brand.error(`Invalid YouTube video ID: "${s}"`),
)

export const VideoIdSchema = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9-_]{11}$/),
  Schema.brand('VideoId'),
)

export type ArtistId = string & Brand.Brand<'ArtistId'>
export const ArtistId = Brand.nominal<ArtistId>()

export type AlbumId = string & Brand.Brand<'AlbumId'>
export const AlbumId = Brand.nominal<AlbumId>()

export type PlaylistId = string & Brand.Brand<'PlaylistId'>
export const PlaylistId = Brand.nominal<PlaylistId>()

export type BrowseId = string & Brand.Brand<'BrowseId'>
export const BrowseId = Brand.nominal<BrowseId>()

export type ContinuationToken = string & Brand.Brand<'ContinuationToken'>
export const ContinuationToken = Brand.nominal<ContinuationToken>()
