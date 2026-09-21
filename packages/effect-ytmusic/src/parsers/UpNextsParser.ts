import * as Effect from 'effect/Effect'

import type { ParseError } from '../errors.ts'
import { UpNextsDetails } from '../schema/UpNextsDetails.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import { parseDuration } from './Parser.ts'

export const parseItem = (
  item: unknown,
): Effect.Effect<UpNextsDetails, ParseError> =>
  checkType(
    'UpNextsDetails',
    {
      type: 'SONG',
      videoId: extractString(item, 'videoId'),
      title: extractString(item, 'title', 'runs', 'text'),
      artist: {
        name: extractString(item, 'shortBylineText', 'runs', 'text'),
        artistId:
          extractString(item, 'shortBylineText', 'runs', 'browseId') || null,
      },
      duration: parseDuration(
        extractString(item, 'lengthText', 'runs', 'text'),
      ),
      thumbnails: extractList(item, 'thumbnail', 'thumbnails'),
    },
    UpNextsDetails,
  )

export const parse = (
  data: unknown,
): Effect.Effect<UpNextsDetails[], ParseError> => {
  const items = extractList(data, 'playlistPanelVideoRenderer') as unknown[]

  return Effect.all(items.slice(1).map(parseItem), {
    concurrency: 'unbounded',
  })
}
