import * as HttpClient from '@effect/platform/HttpClient'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { ConfigExtractionError, NetworkError } from './errors.ts'

export interface YTMusicConfig {
  readonly GL: string
  readonly HL: string
  readonly INNERTUBE_API_KEY: string
  readonly INNERTUBE_API_VERSION: string
  readonly INNERTUBE_CLIENT_NAME: string
  readonly INNERTUBE_CLIENT_VERSION: string
  readonly INNERTUBE_CONTEXT_CLIENT_NAME: string
  readonly VISITOR_DATA: string
  readonly PAGE_CL: string
  readonly PAGE_BUILD_LABEL: string
  readonly DEVICE: string
}

export class YTMusicConfigService extends Context.Tag('YTMusic/Config')<
  YTMusicConfigService,
  YTMusicConfig
>() {}

export const makeLayer = (options?: { GL?: string; HL?: string }) =>
  Layer.effect(
    YTMusicConfigService,
    Effect.gen(function* () {
      const client = yield* HttpClient.HttpClient

      const res = yield* client
        .get('https://music.youtube.com/')
        .pipe(
          Effect.mapError(
            e => new NetworkError({ message: e.message, cause: e }),
          ),
        )

      const html = yield* res.text.pipe(
        Effect.mapError(e => new ConfigExtractionError({ message: e.message })),
      )

      const blobs = [...html.matchAll(/ytcfg\.set\((\{.*?\})\);/g)].map(
        ([, json]) =>
          Effect.try({
            try: () => JSON.parse(json!) as Record<string, unknown>,
            catch: e =>
              new ConfigExtractionError({
                message: `Failed to parse ytcfg blob`,
                cause: e,
              }),
          }),
      )

      const configs = yield* Effect.all(blobs, { concurrency: 'unbounded' })
      const merged = Object.assign({}, ...configs) as YTMusicConfig

      const final: YTMusicConfig = {
        ...merged,
        ...(options?.GL ? { GL: options.GL } : {}),
        ...(options?.HL ? { HL: options.HL } : {}),
      }

      yield* Effect.annotateCurrentSpan(
        'effect-ytmusic/clientVersion',
        final.INNERTUBE_CLIENT_VERSION,
      )
      yield* Effect.annotateCurrentSpan('effect-ytmusic/gl', final.GL)
      yield* Effect.annotateCurrentSpan('effect-ytmusic/hl', final.HL)

      return final
    }),
  )
