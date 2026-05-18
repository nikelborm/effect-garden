import { readFile } from 'node:fs/promises'

import * as EArray from 'effect/Array'
import { flow, pipe } from 'effect/Function'
import * as HashSet from 'effect/HashSet'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { MetadataFromString } from './schemas/MetadataSchema.ts'

const metadata = await readFile(
  './rawData/videoMetadataFetchedFromYoutubeDataApi.json',
  'utf-8',
).then(Schema.decodeSync(MetadataFromString))

export const ReducedMetadataValueSchema = Schema.Struct({
  snippet: Schema.Struct({
    title: Schema.String,
    channelTitle: Schema.String,
    tags: Schema.optional(Schema.Array(Schema.String)),
    localized: Schema.Struct({
      title: Schema.String,
      description: Schema.String,
    }),
    defaultAudioLanguage: Schema.optional(Schema.String),
  }),

  topicDetails: Schema.optionalWith(Schema.Array(Schema.String), {
    default: () => [],
  }),
})

const interestingCandidates = new Set([
  'Christian_music',
  'Motorsport',
  'Pet',
  'Hobby',
  'Television_program',
  'Religion',
  'Country_music',
  'Film',
  'Military',
  'Lifestyle_(sociology)',
  'Reggae',
  'Vehicle',
  'Professional_wrestling',
])

pipe(
  metadata,
  //
  Record.get('n4XGCrnMwwc'),
  Option.getOrThrow,
  // Record.filter(e => e.topicDetails.some(a => interestingCandidates.has(a))),
  // Record.map(e => Schema.decodeUnknownSync(ReducedMetadataValueSchema)(e)),
  // Record.map(({ snippet: { title, channelTitle }, topicDetails }, id) => ({
  //   title: title.slice(0, 60),
  //   channelTitle,
  //   url: 'https://youtu.be/' + id,
  //   topicDetails: topicDetails
  //     // .filter(a => interestingCandidates.has(a))
  //     .join(', ')
  //     .slice(0, 40),
  // })),
  // Record.values,
  // EArray.sortWith(s => s.topicDetails, Order.string),
  //   EArray.map(
  //     s =>
  //       `Title: ${s.title}
  // Channel: ${s.channelTitle}
  // Link: ${s.url}
  // Genres: ${s.topicDetails}
  // `,
  //   ),
  //   EArray.join('\n'),

  // EArray.flatMap(e => e.topicDetails),
  // EArray.dedupe,
  // EArray.chunksOf(3),
  // EArray.map(EArray.join(', ')),
  // EArray.join('\n'),

  // EArray.length,
  // console.table,
  e => console.dir(e, { depth: null }),
)
