import { readFile, writeFile } from 'node:fs/promises'

import { pipe } from 'effect/Function'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { MetadataSchema } from '../schemas/MetadataSchema.ts'

const reformatted = pipe(
  await readFile(
    './rawData/videoMetadataFetchedFromYoutubeDataApi.json',
    'utf-8',
  ),
  e => JSON.parse(e) as any[],
  Schema.decodeUnknownSync(MetadataSchema),
)

console.log(Record.size(reformatted))

await writeFile(
  './rawData/videoMetadataFetchedFromYoutubeDataApiReformatted.json',
  JSON.stringify(reformatted, null, 2) + '\n',
)
