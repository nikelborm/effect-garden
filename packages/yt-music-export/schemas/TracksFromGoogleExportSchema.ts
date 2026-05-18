import * as Schema from 'effect/Schema'

export const TracksFromGoogleExportSchema = Schema.Struct({
  songTitle: Schema.NonEmptyTrimmedString,
  albumTitle: Schema.NonEmptyTrimmedString,
  artists: Schema.NonEmptyArray(Schema.NonEmptyTrimmedString).pipe(Schema.Data),
}).pipe(Schema.Data, value =>
  Schema.Record({ key: Schema.NonEmptyTrimmedString, value }),
)
export const TracksFromGoogleExportFromString = Schema.parseJson(
  TracksFromGoogleExportSchema,
)
