/**
 * USD to RUB conversion.
 *
 * The Central Bank of Russia rate is the reference figure for anything
 * denominated in roubles, so it is preferred. It is published on business days
 * only, which means a Sunday run legitimately returns Friday's number. If CBR
 * is unreachable, a market aggregate stands in.
 */
import * as BigDecimal from 'effect/BigDecimal'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'
import * as HttpClient from 'effect/unstable/http/HttpClient'
import * as HttpClientRequest from 'effect/unstable/http/HttpClientRequest'
import * as HttpIncomingMessage from 'effect/unstable/http/HttpIncomingMessage'

export class CurrencyConverter extends Context.Service<
  CurrencyConverter,
  { readonly usdToRub: Effect.Effect<Rate, CurrencyConversionError> }
>()('ali_summary/CurrencyConverter') {}

export const layer = Effect.gen(function* () {
  const client = HttpClient.filterStatusOk(yield* HttpClient.HttpClient)

  const fetchJson = <S extends Schema.Constraint>(
    url: string,
    schema: S,
    label: string,
  ) =>
    HttpClientRequest.get(url).pipe(
      client.execute,
      Effect.mapError(
        CurrencyConversionError.passthroughCause(`${label} is unreachable`),
      ),
      Effect.flatMap(HttpIncomingMessage.schemaBodyJson(schema)),
      Effect.mapError(
        CurrencyConversionError.passthroughCause(
          `${label} returned an unexpected shape`,
        ),
      ),
    )

  const fromCbr = Effect.gen(function* () {
    const body = yield* fetchJson(CBR_URL, CbrResponse, 'CBR')
    const value = yield* decimalOf(body.Valute.USD.Value, 'CBR USD rate')
    const nominal = yield* decimalOf(body.Valute.USD.Nominal, 'CBR USD nominal')

    const rubPerUsd = yield* Option.match(BigDecimal.divide(value, nominal), {
      onNone: () =>
        Effect.fail(
          new CurrencyConversionError({ message: 'CBR quoted a zero nominal' }),
        ),
      onSome: Effect.succeed,
    })

    return {
      rubPerUsd,
      source: 'CBR',
      asOf: body.Date,
    } satisfies Rate
  })

  const fromErApi = Effect.gen(function* () {
    const body = yield* fetchJson(ER_API_URL, ErApiResponse, 'open.er-api.com')
    if (body.result !== 'success') {
      return yield* new CurrencyConversionError({
        message: `open.er-api.com reported "${body.result}"`,
      })
    }
    const rubPerUsd = yield* decimalOf(
      body.rates.RUB,
      'open.er-api.com RUB rate',
    )

    return {
      rubPerUsd,
      source: 'open.er-api.com',
      asOf: body.time_last_update_utc,
    } satisfies Rate
  })

  const usdToRub = fromCbr.pipe(
    Effect.tapError(error =>
      Effect.logWarning(
        `CBR lookup failed (${error.message}); falling back to open.er-api.com`,
      ),
    ),
    Effect.catch(() => fromErApi),
  )

  return CurrencyConverter.of({ usdToRub })
}).pipe(Layer.effect(CurrencyConverter))

export class CurrencyConversionError extends Schema.TaggedError<CurrencyConversionError>()(
  'CurrencyConversionError',
  {
    message: Schema.String,
    cause: Schema.optional(Schema.ErrorInstance()),
  },
) {
  static passthroughCause = (message: string) => (cause: Error) =>
    new CurrencyConversionError({ message, cause })
}

export interface Rate {
  readonly rubPerUsd: BigDecimal.BigDecimal
  readonly source: string
  readonly asOf: string
}

const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js'
const ER_API_URL = 'https://open.er-api.com/v6/latest/USD'

const CbrResponse = Schema.Struct({
  Date: Schema.String,
  Valute: Schema.Struct({
    USD: Schema.Struct({
      // The rate is quoted per `Nominal` units of the foreign currency.
      Nominal: Schema.Number,
      Value: Schema.Number,
    }),
  }),
})

const ErApiResponse = Schema.Struct({
  result: Schema.String,
  time_last_update_utc: Schema.String,
  rates: Schema.Struct({ RUB: Schema.Number }),
})

const decimalOf = (value: number, label: string) =>
  Option.match(BigDecimal.fromNumber(value), {
    onNone: () =>
      Effect.fail(
        new CurrencyConversionError({
          message: `${label} is not a usable number: ${value}`,
        }),
      ),
    onSome: Effect.succeed,
  })
