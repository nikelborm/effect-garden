import * as Schema from 'effect/Schema'

export const TracksFromGoogleExportSchema = Schema.Struct({
  songTitle: Schema.Trimmed.check(Schema.isNonEmpty()),
  albumTitle: Schema.Trimmed.check(Schema.isNonEmpty()),
  artists: Schema.NonEmptyArray(Schema.Trimmed.check(Schema.isNonEmpty())).pipe(
    Schema.Data,
  ),
}).pipe(Schema.Data, value =>
  Schema.Record({ key: Schema.Trimmed.check(Schema.isNonEmpty()), value }),
)
export const TracksFromGoogleExportFromString = Schema.parseJson(
  TracksFromGoogleExportSchema,
)
