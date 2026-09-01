/**
 * Model Studio bill retrieval and the domain model it decodes into.
 *
 * The interesting field is `InstanceID`, which is where Alibaba hides the model
 * name. Two products bill for inference, and they write it differently.
 *
 * Model Studio (`sfm`) leaves the model in the segment ahead of the token type:
 *
 *     1110389;ws-9h4296dos6ll46s2;glm-5.2-fast-preview;input_token;0
 *     ^owner  ^workspace          ^model               ^token type ^
 *
 * Marketplace (`mpintl-*`), which resells third-party models, names the model
 * outright and qualifies it by vendor, then pluralises the token type:
 *
 *     6000000200348;ZHIPU/GLM-5.3;1110389;ws-9h4296dos6ll46s2;ap-southeast-1;international;output_tokens;intlcmgjllm10006104-KTokens-5
 *     ^order        ^vendor/model ^owner  ^workspace          ^region        ^channel      ^token type   ^commodity
 *
 * Neither segment count is stable - some Model Studio models emit a sixth,
 * empty segment - so nothing is read by fixed index. The token type is found
 * by pattern, and the model is either the vendor-qualified segment or the one
 * before the token type.
 */
import * as BigDecimal from 'effect/BigDecimal'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import * as Schema from 'effect/Schema'

import * as Aliyun from './Aliyun.ts'

export class Bill extends Context.Service<
  Bill,
  {
    instanceBill(
      options: InstanceBillOptions,
    ): Effect.Effect<ReadonlyArray<LineItem>, BillError>
  }
>()('ali_summary/Bill') {}

export const layer = Effect.gen(function* () {
  const api = yield* Aliyun.AliyunApi

  const page = Effect.fn('Bill.page')(function* (
    options: InstanceBillOptions,
    nextToken: Option.Option<string>,
  ) {
    const payload = yield* Effect.mapError(
      api.call('DescribeInstanceBill', {
        BillingCycle: options.cycle,
        Granularity: 'MONTHLY',
        IsBillingItem: 'true',
        // MaxResults: '300',
        ...(options.productCode === undefined
          ? {}
          : { ProductCode: options.productCode }),
        ...(Option.isSome(nextToken) ? { NextToken: nextToken.value } : {}),
      }),
      (cause: Aliyun.AliyunError) =>
        new BillError({ message: cause.message, cause }),
    )

    const response = yield* Effect.mapError(
      decodeResponse(payload),
      cause =>
        new BillError({
          message: 'DescribeInstanceBill returned an unexpected shape',
          cause,
        }),
    )

    if (response.Success === false)
      return yield* new BillError({
        message: `DescribeInstanceBill refused the request: ${
          response.Message ?? response.Code ?? 'no reason given'
        }`,
      })

    // An absent or empty token both mean "no further pages".
    const token = response.Data?.NextToken
    return {
      items: (response.Data?.Items ?? []).map(toLineItem),
      nextToken:
        token === undefined || token === ''
          ? Option.none<string>()
          : Option.some(token),
    }
  })

  const instanceBill = Effect.fn('Bill.instanceBill')(function* (
    options: InstanceBillOptions,
  ) {
    const collected: Array<LineItem> = []
    let cursor = Option.none<string>()

    // DescribeInstanceBill might cap a page at some number of items and
    // paginates by token.
    while (true) {
      const result = yield* page(options, cursor)
      collected.push(...result.items)
      if (Option.isNone(result.nextToken)) break
      cursor = result.nextToken
    }

    return collected
  })

  return Bill.of({ instanceBill })
}).pipe(Layer.effect(Bill))

const RawItem = Schema.Struct({
  InstanceID: Schema.String,
  BillingItem: Schema.optionalKey(Schema.String),
  ProductCode: Schema.String,
  ProductName: Schema.optionalKey(Schema.String),
  Currency: Schema.optionalKey(Schema.String),
  Usage: Schema.optionalKey(Schema.String),
  UsageUnit: Schema.optionalKey(Schema.String),
  ListPrice: Schema.optionalKey(Schema.String),
  // What the usage is actually worth, before Alibaba rounds sub-cent totals
  // down and discounts the remainder away. This is the number worth tracking.
  PretaxGrossAmount: Schema.Number,
  // What ends up on the invoice after that round-down.
  PretaxAmount: Schema.optionalKey(Schema.Number),
})

const InstanceBillResponse = Schema.Struct({
  Code: Schema.optionalKey(Schema.String),
  Message: Schema.optionalKey(Schema.String),
  Success: Schema.optionalKey(Schema.Boolean),
  Data: Schema.optionalKey(
    Schema.Struct({
      BillingCycle: Schema.optionalKey(Schema.String),
      TotalCount: Schema.optionalKey(Schema.Number),
      NextToken: Schema.optionalKey(Schema.String),
      Items: Schema.optionalKey(Schema.Array(RawItem)),
    }),
  ),
})

const decodeResponse = Schema.decodeUnknownEffect(InstanceBillResponse)

const toLineItem = (raw: (typeof RawItem)['Type']): LineItem => {
  const { kind, model } = attribute(
    raw.InstanceID,
    raw.ProductName ?? raw.ProductCode,
  )
  const usage = decimalFromString(raw.Usage ?? '')
  // Both inference products meter in units of 1K tokens; any other unit is
  // passed through unscaled rather than silently misreported.
  const tokens = KILO_TOKENS.test(raw.UsageUnit ?? '')
    ? BigDecimal.multiply(usage, THOUSAND)
    : usage

  return {
    model,
    kind,
    productCode: raw.ProductCode,
    productName: raw.ProductName ?? raw.ProductCode,
    billingItem: raw.BillingItem ?? '',
    gross: decimalFromNumber(raw.PretaxGrossAmount),
    charged: decimalFromNumber(raw.PretaxAmount ?? 0),
    tokens,
    listPrice: decimalFromString(raw.ListPrice ?? ''),
  }
}

export class BillError extends Schema.TaggedError<BillError>()('BillError', {
  message: Schema.String,
  cause: Schema.optional(Schema.ErrorInstance()),
}) {}

export const ZERO = BigDecimal.fromBigInt(0n)

/** Bill amounts arrive as JSON numbers, often in exponent form (`3.92E-5`). */
const decimalFromNumber = (value: number): BigDecimal.BigDecimal =>
  Option.getOrElse(BigDecimal.fromNumber(value), () => ZERO)

/** Usage and unit prices arrive as strings, and may be empty. */
const decimalFromString = (value: string): BigDecimal.BigDecimal =>
  Option.getOrElse(BigDecimal.fromString(value), () => ZERO)

export type TokenKind = 'input' | 'output' | 'cache' | 'other'

/** The token type, in both spellings: `input_token`, `output_tokens`. */
const TOKEN_SEGMENT = /^(input|output)_tokens?(_cache)?$/

/** `ZHIPU/GLM-5.3` - only Marketplace qualifies a model by its vendor. */
const VENDOR_QUALIFIED = /^[^/]+\/[^/]+$/

const classify = (segment: string): TokenKind =>
  segment.endsWith('_cache')
    ? 'cache'
    : segment.startsWith('output')
      ? 'output'
      : 'input'

export interface Attribution {
  readonly model: string
  readonly kind: TokenKind
}

/**
 * Recovers the model name and token type from an `InstanceID`.
 *
 * Products that do not bill for inference at all use an unrelated shape, so
 * anything unrecognised keeps its raw identifier - or a caller-supplied label
 * when even that is empty - instead of being silently dropped from the report.
 */
export const attribute = (
  instanceId: string,
  fallback: string,
): Attribution => {
  const segments = instanceId.split(';')
  const index = segments.findIndex(segment => TOKEN_SEGMENT.test(segment))
  const tokenSegment = index === -1 ? undefined : segments[index]
  // Marketplace states the model; Model Studio puts it ahead of the token
  // type. The index read is checked rather than asserted so an unexpected
  // shape falls through to the same fallback as an unrecognised id.
  const model =
    segments.find(segment => VENDOR_QUALIFIED.test(segment)) ??
    (index > 0 ? segments[index - 1] : undefined)

  if (model !== undefined && model !== '' && tokenSegment !== undefined) {
    // Model ids are canonically lower case; only the Marketplace catalogue
    // shouts, and one row in caps among the rest just reads as noise.
    return { model: model.toLowerCase(), kind: classify(tokenSegment) }
  }
  return { model: instanceId === '' ? fallback : instanceId, kind: 'other' }
}

/** One bill line, with the model attribution already resolved. */
export interface LineItem {
  readonly model: string
  readonly kind: TokenKind
  readonly productCode: string
  readonly productName: string
  readonly billingItem: string
  /** Gross cost in USD, before the sub-cent round-down. */
  readonly gross: BigDecimal.BigDecimal
  /** Cost actually charged, after the round-down. */
  readonly charged: BigDecimal.BigDecimal
  /** Usage expressed in whole tokens. */
  readonly tokens: BigDecimal.BigDecimal
  /** Unit list price, in USD per 1K tokens. */
  readonly listPrice: BigDecimal.BigDecimal
}

const THOUSAND = BigDecimal.fromBigInt(1000n)

/** Both products meter in thousands: `1K tokens` here, `KTokens` there. */
const KILO_TOKENS = /^1?k\s*tokens$/i

export interface InstanceBillOptions {
  /** Billing cycle in `YYYY-MM` form. */
  readonly cycle: string
  /** Restrict to a single product code; omit to cover every product. */
  readonly productCode?: string | undefined
}
