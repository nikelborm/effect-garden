import { readFile } from 'node:fs/promises'

import * as Schema from 'effect/Schema'

import { HtmlTracksFromString } from './schemas/HtmlTracksSchema.ts'
import { MetadataFromString } from './schemas/MetadataSchema.ts'
import { TracksFromGoogleExportFromString } from './schemas/TracksFromGoogleExportSchema.ts'
import { tracksFromBigMediaFolder } from './tracksFromBigMediaFolder.ts'

const [
  musicLibraryFromGoogleExport,
  tracksFromHtmlDeduped,
  videoMetadataFetchedFromYoutubeDataApi,
] = await Promise.all([
  readFile('./rawData/musicLibraryFromGoogleExport.json', 'utf-8').then(
    Schema.decodeSync(TracksFromGoogleExportFromString),
  ),
  readFile('./rawData/tracksFromHtmlDeduped.json', 'utf-8').then(
    Schema.decodeSync(HtmlTracksFromString),
  ),
  readFile(
    './rawData/videoMetadataFetchedFromYoutubeDataApi.json',
    'utf-8',
  ).then(Schema.decodeSync(MetadataFromString)),
])

const downloadedIds = new Set(
  Object.keys(videoMetadataFetchedFromYoutubeDataApi),
)

const allIds = new Set([
  ...tracksFromBigMediaFolder.map(e => e.youtubeId),
  ...Object.keys(musicLibraryFromGoogleExport),
  ...Object.keys(tracksFromHtmlDeduped),
])

const newTasks = allIds.difference(downloadedIds)

console.log(
  'downloadedIds.size',
  downloadedIds.size,
  'newTasks.size',
  newTasks.size,
)
