import * as Cookies from '@effect/platform/Cookies'
import * as HttpClient from '@effect/platform/HttpClient'
import * as HttpClientError from '@effect/platform/HttpClientError'
import * as HttpClientRequest from '@effect/platform/HttpClientRequest'
import * as Effect from 'effect/Effect'
import * as Either from 'effect/Either'
import * as Layer from 'effect/Layer'
import * as Ref from 'effect/Ref'

import { type YTMusicConfig, YTMusicConfigService } from './config.ts'
import {
  HttpStatusError,
  InvalidResponseShapeError,
  NetworkError,
} from './errors.ts'

// --------------------------------------------------------------------------
// Cookie seeding helpers
// --------------------------------------------------------------------------

const parseUserCookies = (cookieString: string): Cookies.Cookies => {
  let cookies = Cookies.empty
  for (const pair of cookieString.split('; ')) {
    const eqIdx = pair.indexOf('=')
    if (eqIdx <= 0) continue
    const name = pair.slice(0, eqIdx).trim()
    const value = pair.slice(eqIdx + 1).trim()
    if (!name) continue
    const result = Cookies.set(cookies, name, value)
    if (Either.isRight(result)) cookies = result.right
  }
  return cookies
}

// --------------------------------------------------------------------------
// Cookie-aware HttpClient layer
// --------------------------------------------------------------------------

export const makeCookieAwareLayer = (
  initialCookies?: string,
): Layer.Layer<HttpClient.HttpClient, never, HttpClient.HttpClient> =>
  Layer.effect(
    HttpClient.HttpClient,
    Effect.gen(function* () {
      const base = yield* HttpClient.HttpClient
      const initial = initialCookies
        ? parseUserCookies(initialCookies)
        : Cookies.empty
      const ref = yield* Ref.make(initial)
      return HttpClient.withCookiesRef(base, ref)
    }),
  )

// --------------------------------------------------------------------------
// Context builder (sent with every API request)
// --------------------------------------------------------------------------

const buildContext = (config: YTMusicConfig) => ({
  capabilities: {},
  client: {
    clientName: config.INNERTUBE_CLIENT_NAME,
    clientVersion: config.INNERTUBE_CLIENT_VERSION,
    experimentIds: [],
    experimentsToken: '',
    gl: config.GL,
    hl: config.HL,
    locationInfo: {
      locationPermissionAuthorizationStatus:
        'LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED',
    },
    musicAppInfo: {
      musicActivityMasterSwitch: 'MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE',
      musicLocationMasterSwitch: 'MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE',
      pwaInstallabilityStatus: 'PWA_INSTALLABILITY_STATUS_UNKNOWN',
    },
    utcOffsetMinutes: -new Date().getTimezoneOffset(),
  },
  request: {
    internalExperimentFlags: [
      {
        key: 'force_music_enable_outertube_tastebuilder_browse',
        value: 'true',
      },
      {
        key: 'force_music_enable_outertube_playlist_detail_browse',
        value: 'true',
      },
      { key: 'force_music_enable_outertube_search_suggestions', value: 'true' },
    ],
    sessionIndex: {},
  },
  user: { enableSafetyMode: false },
})

// --------------------------------------------------------------------------
// Core request function
// --------------------------------------------------------------------------

export const constructRequest = Effect.fn('effect-ytmusic/constructRequest')(
  function* (
    endpoint: string,
    body: Record<string, unknown> = {},
    query: Record<string, string> = {},
  ) {
    const config = yield* YTMusicConfigService
    const client = yield* HttpClient.HttpClient

    yield* Effect.annotateCurrentSpan('effect-ytmusic/endpoint', endpoint)

    const url = `https://music.youtube.com/youtubei/${config.INNERTUBE_API_VERSION}/${endpoint}`

    const req = HttpClientRequest.post(url).pipe(
      HttpClientRequest.acceptJson,
      HttpClientRequest.setUrlParams({
        alt: 'json',
        key: config.INNERTUBE_API_KEY,
        ...query,
      }),
      HttpClientRequest.setHeaders({
        'Accept-Encoding': 'gzip',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.5',
        'x-origin': 'https://music.youtube.com',
        'X-Goog-Visitor-Id': config.VISITOR_DATA,
        'X-YouTube-Client-Name': config.INNERTUBE_CONTEXT_CLIENT_NAME,
        'X-YouTube-Client-Version': config.INNERTUBE_CLIENT_VERSION,
        'X-YouTube-Device': config.DEVICE,
        'X-YouTube-Page-CL': config.PAGE_CL,
        'X-YouTube-Page-Label': config.PAGE_BUILD_LABEL,
        'X-YouTube-Utc-Offset': String(-new Date().getTimezoneOffset()),
        'X-YouTube-Time-Zone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
      HttpClientRequest.bodyUnsafeJson({
        context: buildContext(config),
        ...body,
      }),
    )

    const response = yield* client
      .execute(req)
      .pipe(
        Effect.mapError(
          (e): NetworkError =>
            new NetworkError({ message: e.message, cause: e }),
        ),
      )

    if (response.status >= 400) {
      return yield* new HttpStatusError({
        status: response.status,
        endpoint,
        cause: new HttpClientError.ResponseError({
          request: req,
          response,
          reason: 'StatusCode',
        }),
      })
    }

    const data = yield* response.json.pipe(
      Effect.mapError(
        (e): HttpStatusError =>
          new HttpStatusError({
            status: e.response.status,
            endpoint,
            cause: e,
          }),
      ),
    )

    if (
      typeof data !== 'object' ||
      data === null ||
      !('responseContext' in data)
    ) {
      return yield* new InvalidResponseShapeError({ endpoint })
    }

    return data as Record<string, unknown>
  },
)
