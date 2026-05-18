import * as Schema from 'effect/Schema'

export const HtmlTracksSchema = Schema.Struct({
  title: Schema.NonEmptyTrimmedString,
  artists: Schema.Struct({
    name: Schema.NonEmptyTrimmedString,
    channelId: Schema.NonEmptyTrimmedString,
  }).pipe(Schema.Data, Schema.Array, Schema.Data),
  artistsRaw: Schema.NonEmptyTrimmedString,
  album: Schema.NonEmptyTrimmedString,
  albumId: Schema.NonEmptyTrimmedString,
  coverUrl: Schema.NonEmptyTrimmedString,
  duration: Schema.NonEmptyTrimmedString,
  durationLabel: Schema.NonEmptyTrimmedString,
}).pipe(Schema.Data, value =>
  Schema.Record({ key: Schema.NonEmptyTrimmedString, value }),
)

export const HtmlTracksFromString = Schema.parseJson(HtmlTracksSchema)
