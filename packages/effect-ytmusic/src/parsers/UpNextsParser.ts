import * as Either from 'effect/Either'

import type { ParseError } from '../errors.ts'
import type { UpNextsDetails } from '../schema/home.ts'
import { UpNextsDetails as UpNextsDetailsSchema } from '../schema/home.ts'
import { checkType } from '../utils/checkType.ts'
import { traverseList, traverseString } from '../utils/traverse.ts'
import { parseDuration } from './Parser.ts'

export const parseItem = (
  item: unknown,
): Either.Either<UpNextsDetails, ParseError> =>
  checkType(
    'UpNextsDetails',
    {
      type: 'SONG',
      videoId: traverseString(item, 'videoId'),
      title: traverseString(item, 'title', 'runs', 'text'),
      artist: {
        name: traverseString(item, 'shortBylineText', 'runs', 'text'),
        artistId:
          traverseString(item, 'shortBylineText', 'runs', 'browseId') || null,
      },
      duration: parseDuration(
        traverseString(item, 'lengthText', 'runs', 'text'),
      ),
      thumbnails: traverseList(item, 'thumbnail', 'thumbnails'),
    },
    UpNextsDetailsSchema,
  )

export const parse = (
  data: unknown,
): Either.Either<UpNextsDetails[], ParseError> => {
  const items = traverseList(data, 'playlistPanelVideoRenderer') as unknown[]

  const results = items.slice(1).map(parseItem)
  const firstError = results.find(Either.isLeft)
  if (firstError && Either.isLeft(firstError)) {
    return Either.left(firstError.left)
  }

  return Either.right(
    results.map(r => (r as Either.Right<ParseError, UpNextsDetails>).right),
  )
}
