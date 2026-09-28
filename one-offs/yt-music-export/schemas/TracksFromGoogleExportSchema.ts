import * as Schema from 'effect/Schema'

const TracksFromGoogleExportValue = Schema.Struct({
  songTitle: Schema.Trimmed.check(Schema.isNonEmpty()),
  albumTitle: Schema.Trimmed.check(Schema.isNonEmpty()),
  artists: Schema.NonEmptyArray(Schema.Trimmed.check(Schema.isNonEmpty())),
})

export const TracksFromGoogleExportSchema = Schema.Record(
  Schema.Trimmed.check(Schema.isNonEmpty()),
  TracksFromGoogleExportValue,
)
export const TracksFromGoogleExportFromString = Schema.fromJsonString(
  TracksFromGoogleExportSchema,
)
