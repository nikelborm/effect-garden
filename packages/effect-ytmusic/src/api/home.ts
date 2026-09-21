import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import * as Stream from 'effect/Stream'

import { ContinuationToken } from '../brands.ts'
import { constructRequest } from '../client.ts'
import { FE_MUSIC_HOME } from '../constants.ts'
import * as Parser from '../parsers/Parser.ts'
import { extractList, extractString } from '../utils/extract.ts'

export const getHomeSections = () =>
  Stream.paginate(
    Option.none<ContinuationToken>(),
    Effect.fn('effect-ytmusic/getHomeSections.page')(function* (continuation) {
      const data = yield* Option.match(continuation, {
        onNone: () => constructRequest('browse', { browseId: FE_MUSIC_HOME }),
        onSome: token =>
          constructRequest('browse', {}, { continuation: token }),
      })

      const rawSections = Option.isNone(continuation)
        ? (extractList(data, 'sectionListRenderer', 'contents') as unknown[])
        : (extractList(
            data,
            'sectionListContinuation',
            'contents',
          ) as unknown[])

      // Parse each section; failures are dropped by `Effect.partition`, which
      // mirrors the previous `Result.isSuccess` filter that skipped bad items.
      const [, validSections] = yield* Effect.partition(
        rawSections,
        item => Parser.parseHomeSection(item),
        { concurrency: 'unbounded' },
      )

      const nextToken = extractString(data, 'continuation')
      const next =
        nextToken.length > 0
          ? Option.some(Option.some(ContinuationToken(nextToken)))
          : Option.none<Option.Option<ContinuationToken>>()

      yield* Effect.annotateCurrentSpan(
        'effect-ytmusic/page.sectionCount',
        validSections.length,
      )
      return [validSections, next] as const
    }),
  )
