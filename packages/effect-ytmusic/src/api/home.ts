import * as Chunk from 'effect/Chunk'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ContinuationToken } from '../brands.ts'
import { constructRequest } from '../client.ts'
import { FE_MUSIC_HOME } from '../constants.ts'
import * as Parser from '../parsers/Parser.ts'
import { traverseList, traverseString } from '../utils/traverse.ts'

export const getHomeSections = () =>
  Stream.paginateChunkEffect(
    Option.none<ContinuationToken>(),
    Effect.fn('effect-ytmusic/getHomeSections.page')(function* (continuation) {
      const data = yield* Option.match(continuation, {
        onNone: () => constructRequest('browse', { browseId: FE_MUSIC_HOME }),
        onSome: token =>
          constructRequest('browse', {}, { continuation: token }),
      })

      const rawSections = Option.isNone(continuation)
        ? (traverseList(data, 'sectionListRenderer', 'contents') as unknown[])
        : (traverseList(
            data,
            'sectionListContinuation',
            'contents',
          ) as unknown[])

      const sections = rawSections.flatMap(item => {
        const r = Parser.parseHomeSection(item)
        return Option.isNone(Option.fromNullable(r)) ? [] : [r]
      })

      const validSections = sections.flatMap(r =>
        Either.isRight(r) ? [r.right] : [],
      )

      const nextToken = traverseString(data, 'continuation')
      const next = nextToken
        ? Option.some(Option.some(ContinuationToken(nextToken)))
        : Option.none<Option.Option<ContinuationToken>>()

      yield* Effect.annotateCurrentSpan(
        'effect-ytmusic/page.sectionCount',
        validSections.length,
      )
      return [Chunk.fromIterable(validSections), next] as const
    }),
  )
