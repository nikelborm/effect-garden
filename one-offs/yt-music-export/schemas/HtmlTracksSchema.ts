import * as Schema from 'effect/Schema'

const HtmlTrackValue = Schema.Struct({
  title: Schema.Trimmed.check(Schema.isNonEmpty()),
  artists: Schema.Array(
    Schema.Struct({
      name: Schema.Trimmed.check(Schema.isNonEmpty()),
      channelId: Schema.Trimmed.check(Schema.isNonEmpty()),
    }),
  ),
  artistsRaw: Schema.Trimmed.check(Schema.isNonEmpty()),
  album: Schema.Trimmed.check(Schema.isNonEmpty()),
  albumId: Schema.Trimmed.check(Schema.isNonEmpty()),
  coverUrl: Schema.Trimmed.check(Schema.isNonEmpty()),
  duration: Schema.Trimmed.check(Schema.isNonEmpty()),
  durationLabel: Schema.Trimmed.check(Schema.isNonEmpty()),
})

export const HtmlTracksSchema = Schema.Record(
  Schema.Trimmed.check(Schema.isNonEmpty()),
  HtmlTrackValue,
)

export const HtmlTracksFromString = Schema.fromJsonString(HtmlTracksSchema)
