import * as Data from 'effect/Data'
import * as Schema from 'effect/Schema'

const image = Schema.Struct({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
}).pipe(Schema.Data)

export const MetadataSchema = Schema.Struct({
  snippet: Schema.Struct({
    title: Schema.String,
    description: Schema.String,
    channelId: Schema.String,
    channelTitle: Schema.String,
    tags: Schema.optional(Schema.Array(Schema.String).pipe(Schema.Data)),
    publishedAt: Schema.String,
    categoryId: Schema.String,
    liveBroadcastContent: Schema.String,
    defaultLanguage: Schema.String,
    localized: Schema.Struct({
      title: Schema.String,
      description: Schema.String,
    }).pipe(Schema.Data),
    defaultAudioLanguage: Schema.optional(Schema.String),
    thumbnails: Schema.Struct({
      standard: Schema.optional(image),
      default: image,
      medium: image,
      high: image,
      maxres: Schema.optional(image),
    }).pipe(Schema.Data),
  }),
  contentDetails: Schema.Struct({
    duration: Schema.transform(Schema.String, Schema.Number, {
      decode: str => {
        const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (!match) throw new Error(`Invalid duration format: ${str}`)
        const [, hours, minutes, seconds] = match
        return (
          Number(hours ?? 0) * 3600 +
          Number(minutes ?? 0) * 60 +
          Number(seconds ?? 0)
        )
      },
      encode: num =>
        `PT${Math.floor(num / 3600) > 0 ? `${Math.floor(num / 3600)}H` : ''}${
          Math.floor((num % 3600) / 60) > 0
            ? `${Math.floor((num % 3600) / 60)}M`
            : ''
        }${num % 60 > 0 ? `${num % 60}S` : ''}`,
    }),
    dimension: Schema.String,
    definition: Schema.String,
    caption: Schema.BooleanFromString,
    licensedContent: Schema.Boolean,
    projection: Schema.String,
    contentRating: Schema.Struct({
      ytRating: Schema.optional(Schema.String),
    }).pipe(Schema.Data),
    regionRestriction: Schema.optional(
      Schema.Struct({
        allowed: Schema.optional(Schema.Array(Schema.String).pipe(Schema.Data)),
        blocked: Schema.optional(Schema.Array(Schema.String).pipe(Schema.Data)),
      }).pipe(Schema.Data),
    ),
  }),
  topicDetails: Schema.optionalWith(
    Schema.transform(
      Schema.Struct({ topicCategories: Schema.Array(Schema.String) }),
      Schema.Array(Schema.String).pipe(Schema.Data),
      {
        decode: ({ topicCategories }) =>
          Data.unsafeArray(
            topicCategories
              .map(e => e.split('/').at(-1))
              .filter((e): e is string => !!e),
          ),
        encode: topicCategories => ({ topicCategories }),
        strict: true,
      },
    ),
    { default: () => Data.unsafeArray([]) },
  ),
}).pipe(Schema.Data, value =>
  Schema.Record({ key: Schema.NonEmptyTrimmedString, value }),
)

export const MetadataFromString = Schema.parseJson(MetadataSchema)
