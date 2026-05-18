import * as Schema from 'effect/Schema'

export const HtmlTracksSchema = Schema.Struct({
  title: Schema.NonEmptyTrimmedString,
  videoId: Schema.NonEmptyTrimmedString,
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
  // liked: Schema.Boolean,
}).pipe(Schema.Data, Schema.Array)
