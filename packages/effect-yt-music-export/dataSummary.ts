import { readFile } from 'node:fs/promises'

import * as Schema from 'effect/Schema'

import { HtmlTracksFromString } from './schemas/HtmlTracksSchema.ts'
import { MetadataFromString } from './schemas/MetadataSchema.ts'
import { TracksFromGoogleExportFromString } from './schemas/TracksFromGoogleExportSchema.ts'
import { tracksFromBigMediaFolder } from './tracksFromBigMediaFolder.ts'

export { tracksFromBigMediaFolder }

export const [
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

export const fetchedMetadataForIds = new Set(
  Object.keys(videoMetadataFetchedFromYoutubeDataApi),
)

export const presentAudioFilesIds = new Set(
  tracksFromBigMediaFolder.map(e => e.youtubeId),
)

export const idsExtractedFromGoogleExport = new Set(
  Object.keys(musicLibraryFromGoogleExport),
)
export const idsExtractedByManualScrapingFromHtml = new Set(
  Object.keys(tracksFromHtmlDeduped),
)

export const currentYoutubeLibraryStateIds = idsExtractedFromGoogleExport.union(
  idsExtractedByManualScrapingFromHtml,
)

export const allIdsEverMentioned = currentYoutubeLibraryStateIds
  .union(presentAudioFilesIds)
  .union(fetchedMetadataForIds)

export const missingLocallyMetadataForIds = allIdsEverMentioned.difference(
  fetchedMetadataForIds,
)

export const missingLocallyAudioFilesIds =
  allIdsEverMentioned.difference(presentAudioFilesIds)

export const trackIdsMyRemoteLibraryIsMissingNow =
  allIdsEverMentioned.difference(currentYoutubeLibraryStateIds)

console.table({
  'All ids ever mentioned': allIdsEverMentioned.size,
  'Missing locally metadata for ids': missingLocallyMetadataForIds.size,
  'Missing locally audio files ids': missingLocallyAudioFilesIds.size,
  'Missing ids in youtube library': trackIdsMyRemoteLibraryIsMissingNow.size,
  'Fetched metadata for ids': fetchedMetadataForIds.size,
  'Present audio files ids': presentAudioFilesIds.size,
  'Current youtube library state ids': currentYoutubeLibraryStateIds.size,
})
