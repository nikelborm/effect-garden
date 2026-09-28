import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'
import * as SchemaTransformation from 'effect/SchemaTransformation'

const image = Schema.Struct({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
})

const BooleanFromString = Schema.Literals(['true', 'false']).pipe(
  Schema.decodeTo(
    Schema.Boolean,
    SchemaTransformation.transform({
      decode: (literal: 'true' | 'false') => literal === 'true',
      encode: (value: boolean): 'true' | 'false' => (value ? 'true' : 'false'),
    }),
  ),
)

const MetadataValue = Schema.Struct({
  snippet: Schema.Struct({
    title: Schema.String,
    description: Schema.String,
    channelId: Schema.String,
    channelTitle: Schema.String,
    tags: Schema.optional(Schema.Array(Schema.String)),
    publishedAt: Schema.String,
    categoryId: Schema.String,
    liveBroadcastContent: Schema.String,
    defaultLanguage: Schema.String,
    localized: Schema.Struct({
      title: Schema.String,
      description: Schema.String,
    }),
    defaultAudioLanguage: Schema.optional(Schema.String),
    thumbnails: Schema.Struct({
      standard: Schema.optional(image),
      default: image,
      medium: image,
      high: image,
      maxres: Schema.optional(image),
    }),
  }),
  contentDetails: Schema.Struct({
    duration: Schema.String.pipe(
      Schema.decodeTo(
        Schema.Number,
        SchemaTransformation.transform({
          decode: (str: string) => {
            // TODO: turns out this is some RFC standard, which already has
            // ready parsers probably, so I better use those here
            const match = str.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
            if (!match) throw new Error(`Invalid duration format: ${str}`)
            const [, hours, minutes, seconds] = match
            return (
              Number(hours ?? 0) * 3600 +
              Number(minutes ?? 0) * 60 +
              Number(seconds ?? 0)
            )
          },
          encode: (num: number) =>
            `PT${Math.floor(num / 3600) > 0 ? `${Math.floor(num / 3600)}H` : ''}${
              Math.floor((num % 3600) / 60) > 0
                ? `${Math.floor((num % 3600) / 60)}M`
                : ''
            }${num % 60 > 0 ? `${num % 60}S` : ''}`,
        }),
      ),
    ),
    dimension: Schema.String,
    definition: Schema.String,
    caption: BooleanFromString,
    licensedContent: Schema.Boolean,
    projection: Schema.String,
    contentRating: Schema.Struct({
      ytRating: Schema.optional(Schema.String),
    }),
    regionRestriction: Schema.optional(
      Schema.Struct({
        allowed: Schema.optional(Schema.Array(Schema.String)),
        blocked: Schema.optional(Schema.Array(Schema.String)),
      }),
    ),
  }),
  topicDetails: Schema.Struct({
    topicCategories: Schema.Array(Schema.String),
  }).pipe(
    Schema.decodeTo(
      Schema.Array(Schema.String),
      SchemaTransformation.transform<
        ReadonlyArray<string>,
        { readonly topicCategories: ReadonlyArray<string> }
      >({
        decode: ({ topicCategories }) =>
          topicCategories
            .map(e => e.split('/').at(-1))
            .filter((e): e is string => !!e),
        encode: topicCategories => ({ topicCategories }),
      }),
    ),
    Schema.withDecodingDefaultType(Effect.succeed([] as ReadonlyArray<string>)),
  ),
})

export const MetadataSchema = Schema.Record(
  Schema.Trimmed.check(Schema.isNonEmpty()),
  MetadataValue,
)

export const MetadataFromString = Schema.fromJsonString(MetadataSchema)
