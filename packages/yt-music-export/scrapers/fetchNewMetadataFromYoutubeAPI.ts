import { readFile, writeFile } from 'node:fs/promises'

import { google } from 'googleapis'

import * as EArray from 'effect/Array'
import { flow } from 'effect/Function'
import * as Record from 'effect/Record'

const youtube = google.youtube({
  version: 'v3',
  auth: await readFile('./rawData/googleApiKey.txt', 'ascii'),
})

export const fetchNewMetadataFromYoutubeAPI = flow(
  EArray.chunksOf(50)<string[]>,
  EArray.map(chunk =>
    youtube.videos.list({
      id: chunk,
      part: ['snippet', 'contentDetails', 'topicDetails'],
    }),
  ),
  responsePromise => Promise.all(responsePromise),
  promise =>
    promise.then(
      flow(
        EArray.flatMap(response => response.data.items ?? []),
        EArray.map(
          video =>
            [
              video.id!,
              {
                snippet: video.snippet!,
                contentDetails: video.contentDetails!,
                topicDetails: video.topicDetails!,
              },
            ] as const,
        ),
        Record.fromEntries,
        content => writeFile('./tmp.json', JSON.stringify(content, null, 2)),
      ),
    ),
)
