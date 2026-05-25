import * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { UpNextsDetails } from '../schema/home.ts'
import { UpNextsDetails as UpNextsDetailsSchema } from '../schema/home.ts'
import { checkType } from '../utils/checkType.ts'
import { extractList, extractString } from '../utils/extract.ts'
import { parseDuration } from './Parser.ts'

export const parseItem = (
  item: unknown,
): Either.Either<UpNextsDetails, ParseError> =>
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
    UpNextsDetailsSchema,
  )

export const parse = (
  data: unknown,
): Either.Either<UpNextsDetails[], ParseError> => {
  const items = extractList(data, 'playlistPanelVideoRenderer') as unknown[]

  const results = items.slice(1).map(parseItem)
  const firstError = results.find(Either.isLeft)
  if (firstError && Either.isLeft(firstError)) {
    return Either.left(firstError.left)
  }

  return Either.right(
    results.map(r => (r as Either.Right<ParseError, UpNextsDetails>).right),
  )
}
