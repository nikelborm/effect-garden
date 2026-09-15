import * as Schema from 'effect/Schema'

export const HtmlTracksSchema = Schema.Struct({
  title: Schema.Trimmed.check(Schema.isNonEmpty()),
  artists: Schema.Struct({
    name: Schema.Trimmed.check(Schema.isNonEmpty()),
    channelId: Schema.Trimmed.check(Schema.isNonEmpty()),
  }).pipe(Schema.Data, Schema.Array, Schema.Data),
  artistsRaw: Schema.Trimmed.check(Schema.isNonEmpty()),
  album: Schema.Trimmed.check(Schema.isNonEmpty()),
  albumId: Schema.Trimmed.check(Schema.isNonEmpty()),
  coverUrl: Schema.Trimmed.check(Schema.isNonEmpty()),
  duration: Schema.Trimmed.check(Schema.isNonEmpty()),
  durationLabel: Schema.Trimmed.check(Schema.isNonEmpty()),
}).pipe(Schema.Data, value =>
  Schema.Record({ key: Schema.Trimmed.check(Schema.isNonEmpty()), value }),
)

export const HtmlTracksFromString = Schema.parseJson(HtmlTracksSchema)
