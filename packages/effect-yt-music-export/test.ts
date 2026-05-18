import { readFile } from 'node:fs/promises'

import * as Record from 'effect/Record'
import * as Schema from 'effect/Schema'

import { MetadataSchemaFromString } from './revisers/MetadataSchema.ts'
import { tracksFromBigMediaFolder } from './tracksFromBigMediaFolder.ts'

const videoMetadataFetchedFromYoutubeDataApi = Schema.decodeSync(
  MetadataSchemaFromString,
)(
  await readFile(
    './rawData/videoMetadataFetchedFromYoutubeDataApi.json',
    'utf-8',
  ),
  { exact: true, onExcessProperty: 'error' },
)

const youtubeDataApiIds = Record.keys(videoMetadataFetchedFromYoutubeDataApi)

const bigMediaFolderIds = tracksFromBigMediaFolder.map(e => e.youtubeId)

const bigMediaFolderIdsSet = new Set(bigMediaFolderIds)
const youtubeDataApiIdsSet = new Set(youtubeDataApiIds)

// prints true for some reason. Why some of them were not fetched?
console.log(youtubeDataApiIdsSet.isSubsetOf(bigMediaFolderIdsSet))
