import { readFile, writeFile } from 'node:fs/promises'

import * as EArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { HtmlTracksSchema } from '../schemas/HtmlTracksSchema.ts'

const reformatted = pipe(
  await readFile('./rawData/tracksFromHtmlDeduped.json', 'utf-8'),
  e => JSON.parse(e) as any[],
  Schema.decodeUnknownSync(HtmlTracksSchema),
  EArray.map(({ videoId, ...rest }) => [videoId, rest] as const),
  Record.fromEntries,
)

console.log(Record.size(reformatted))

await writeFile(
  './rawData/tracksFromHtmlDedupedReformatted.json',
  JSON.stringify(reformatted, null, 2) + '\n',
)
