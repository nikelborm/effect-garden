import * as Schema from 'effect/Schema'

export const TracksFromGoogleExportSchema = Schema.Array(
  Schema.Struct({
    videoId: Schema.NonEmptyTrimmedString,
    songTitle: Schema.NonEmptyTrimmedString,
    albumTitle: Schema.NonEmptyTrimmedString,
    artists: Schema.NonEmptyArray(Schema.NonEmptyTrimmedString).pipe(
      Schema.Data,
    ),
  }).pipe(Schema.Data),
)
