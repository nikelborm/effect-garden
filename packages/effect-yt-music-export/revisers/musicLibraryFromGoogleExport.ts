import { readFile, writeFile } from 'node:fs/promises'

import { parse } from 'csv-parse/sync'

import * as EArray from 'effect/Array'
import { pipe } from 'effect/Function'
import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { TracksFromGoogleExportSchema } from '../schemas/TracksFromGoogleExportSchema.ts'

const parsed = pipe(
  await readFile('./rawData/musicLibraryFromGoogleExport.csv', 'utf-8'),
  str =>
    parse(str, {
      columns: [
        'videoId',
        'songTitle',
        'albumTitle',
        'artistName_1',
        'artistName_2',
        'artistName_3',
        'artistName_4',
        'artistName_5',
        'artistName_6',
      ],
      trim: true,
      delimiter: ',',
      skip_empty_lines: true,
      from: 2,
    }),
  e => e as any[],
  EArray.map(({ albumTitle, songTitle, videoId, ...artists }) => ({
    albumTitle,
    songTitle,
    videoId,
    artists: Record.values(artists).filter(Boolean),
  })),
  Schema.decodeUnknownSync(TracksFromGoogleExportSchema),
  EArray.map(({ videoId, ...rest }) => [videoId, rest] as const),
  Record.fromEntries,
)

await writeFile(
  './rawData/musicLibraryFromGoogleExport.json',
  JSON.stringify(parsed, null, 2) + '\n',
)
console.log(Record.size(parsed))
