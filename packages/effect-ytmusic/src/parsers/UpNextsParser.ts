import type * as Result from 'effect/Result'

import type { ParseError } from '../errors.ts'
import { UpNextsDetails } from '../schema/UpNextsDetails.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import { parseDuration } from './Parser.ts'

export const parseItem = (
  item: unknown,
): Result.Result<UpNextsDetails, ParseError> =>
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
): Result.Result<UpNextsDetails[], ParseError> => {
  const items = extractList(data, 'playlistPanelVideoRenderer') as unknown[]

  const results = items.slice(1).map(parseItem)
  const firstError = results.find(Result.isLeft)
  if (firstError && Result.isLeft(firstError)) {
    return Result.fail(firstError.left)
  }

  return Result.succeed(
    results.map(r => (r as Result.succeed<ParseError, UpNextsDetails>).right),
  )
}
