/**
 * Aggregation of bill lines into a per-model report, and its rendering.
 */
import * as Arr from 'effect/Array'
import * as BigDecimal from 'effect/BigDecimal'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'

import * as Bill from './Bill.ts'
import type * as CurrencyConverter from './CurrencyConverter.ts'
import * as Format from './Format.ts'

export type Currency = 'usd' | 'rub' | 'both'

export interface ModelTotals {
  readonly model: string
  readonly products: ReadonlyArray<string>
  readonly gross: BigDecimal.BigDecimal
  readonly charged: BigDecimal.BigDecimal
  readonly inputTokens: BigDecimal.BigDecimal
  readonly outputTokens: BigDecimal.BigDecimal
  readonly cacheTokens: BigDecimal.BigDecimal
  /** Usage that carried no recognisable token type, kept so it is not lost. */
  readonly otherTokens: BigDecimal.BigDecimal
  readonly totalTokens: BigDecimal.BigDecimal
}

const MILLION = BigDecimal.fromBigInt(1_000_000n)

/**
 * Digits kept for the figures this tool derives rather than reads off the bill.
 * A division carries BigDecimal's full working precision - the blended price of
 * 119 tokens came out a hundred digits long - and none of it past the sixth
 * place is real, since the bill itself is quoted to eight and the financial
 * exchange rate to four. Rounding here rather than at the point of rendering
 * keeps the table and the JSON quoting the same number.
 */
const DERIVED_SCALE = 6

const roundDerived = (value: BigDecimal.BigDecimal): BigDecimal.BigDecimal =>
  BigDecimal.round(value, { scale: DERIVED_SCALE, mode: 'half-from-zero' })

interface Accumulator {
  products: Set<string>
  gross: BigDecimal.BigDecimal
  charged: BigDecimal.BigDecimal
  inputTokens: BigDecimal.BigDecimal
  outputTokens: BigDecimal.BigDecimal
  cacheTokens: BigDecimal.BigDecimal
  otherTokens: BigDecimal.BigDecimal
}

const emptyAccumulator = (): Accumulator => ({
  products: new Set(),
  gross: Bill.ZERO,
  charged: Bill.ZERO,
  inputTokens: Bill.ZERO,
  outputTokens: Bill.ZERO,
  cacheTokens: Bill.ZERO,
  otherTokens: Bill.ZERO,
})

/** Largest spend first; ties broken by name so runs are reproducible. */
const byCost: Order.Order<ModelTotals> = (self, that) => {
  const cost = BigDecimal.Order(that.gross, self.gross)
  return cost !== 0 ? cost : Order.String(self.model, that.model)
}

export const aggregate = (
  items: Iterable<Bill.LineItem>,
): ReadonlyArray<ModelTotals> => {
  const accumulators = new Map<string, Accumulator>()

  for (const item of items) {
    let accumulator = accumulators.get(item.model)
    if (accumulator === undefined) {
      accumulator = emptyAccumulator()
      accumulators.set(item.model, accumulator)
    }

    accumulator.products.add(item.productCode)
    accumulator.gross = BigDecimal.sum(accumulator.gross, item.gross)
    accumulator.charged = BigDecimal.sum(accumulator.charged, item.charged)

    switch (item.kind) {
      case 'input':
        accumulator.inputTokens = BigDecimal.sum(
          accumulator.inputTokens,
          item.tokens,
        )
        break
      case 'output':
        accumulator.outputTokens = BigDecimal.sum(
          accumulator.outputTokens,
          item.tokens,
        )
        break
      case 'cache':
        accumulator.cacheTokens = BigDecimal.sum(
          accumulator.cacheTokens,
          item.tokens,
        )
        break
      case 'other':
        accumulator.otherTokens = BigDecimal.sum(
          accumulator.otherTokens,
          item.tokens,
        )
        break
    }
  }

  return Arr.sort(
    Array.from(
      accumulators,
      ([model, accumulator]): ModelTotals => ({
        model,
        products: Array.from(accumulator.products).sort(),
        gross: accumulator.gross,
        charged: accumulator.charged,
        inputTokens: accumulator.inputTokens,
        outputTokens: accumulator.outputTokens,
        cacheTokens: accumulator.cacheTokens,
        otherTokens: accumulator.otherTokens,
        totalTokens: BigDecimal.sumAll([
          accumulator.inputTokens,
          accumulator.outputTokens,
          accumulator.cacheTokens,
          accumulator.otherTokens,
        ]),
      }),
    ),
    byCost,
  )
}

export const totalOf = (rows: ReadonlyArray<ModelTotals>): ModelTotals => ({
  model: 'TOTAL',
  products: Arr.dedupe(rows.flatMap(row => row.products)).sort(),
  gross: BigDecimal.sumAll(rows.map(row => row.gross)),
  charged: BigDecimal.sumAll(rows.map(row => row.charged)),
  inputTokens: BigDecimal.sumAll(rows.map(row => row.inputTokens)),
  outputTokens: BigDecimal.sumAll(rows.map(row => row.outputTokens)),
  cacheTokens: BigDecimal.sumAll(rows.map(row => row.cacheTokens)),
  otherTokens: BigDecimal.sumAll(rows.map(row => row.otherTokens)),
  totalTokens: BigDecimal.sumAll(rows.map(row => row.totalTokens)),
})

/** Blended cost of a million tokens for this model, undefined without usage. */
export const perMillionTokens = (
  row: ModelTotals,
): Option.Option<BigDecimal.BigDecimal> =>
  BigDecimal.isZero(row.totalTokens)
    ? Option.none()
    : Option.map(
        BigDecimal.divide(
          BigDecimal.multiply(row.gross, MILLION),
          row.totalTokens,
        ),
        roundDerived,
      )

const toRub = (
  usd: BigDecimal.BigDecimal,
  rate: CurrencyConverter.Rate,
): BigDecimal.BigDecimal =>
  roundDerived(BigDecimal.multiply(usd, rate.rubPerUsd))

export interface RenderOptions {
  readonly currency: Currency
  readonly rate: Option.Option<CurrencyConverter.Rate>
}

const EM_DASH = '—'

/**
 * One rendered row. The token columns are always present; the money columns
 * and `untyped` depend on the requested currency and on the data, so they are
 * optional rather than `string | undefined` - a column that does not apply is
 * absent, and `Console.table` never prints a header for it.
 */
export interface TableRow {
  readonly product: string
  readonly in: string
  readonly out: string
  readonly cached: string
  readonly untyped?: string
  readonly USD?: string
  readonly RUB?: string
  readonly 'USD/1M'?: string
  readonly 'RUB/1M'?: string
}

/** Keyed by model name, which `Console.table` shows as the index column. */
export type Table = Record<string, TableRow>

type MutableTableRow = { -readonly [K in keyof TableRow]: TableRow[K] }

/**
 * Shapes the report for `Console.table`: a record keyed by model name, so the
 * model appears in the index column and every value is a preformatted string.
 * Formatting here rather than in the console keeps scientific notation out.
 */
export const toTable = (
  rows: ReadonlyArray<ModelTotals>,
  options: RenderOptions,
): Table => {
  const showUsd = options.currency !== 'rub'
  const showRub = options.currency !== 'usd' && Option.isSome(options.rate)
  // Only products outside Model Studio inference produce untyped usage, so the
  // column would be a wall of zeroes for most accounts.
  const showOther = rows.some(row => !BigDecimal.isZero(row.otherTokens))

  const table: Record<string, TableRow> = {}

  for (const row of rows) {
    const cells: MutableTableRow = {
      product: row.products.join(', '),
      in: Format.count(row.inputTokens),
      out: Format.count(row.outputTokens),
      cached: Format.count(row.cacheTokens),
    }

    if (showOther) cells.untyped = Format.count(row.otherTokens)

    if (showUsd) cells.USD = Format.money(row.gross, 8)
    if (showRub && Option.isSome(options.rate)) {
      cells.RUB = Format.money(toRub(row.gross, options.rate.value), 6)
    }

    const unit = perMillionTokens(row)
    cells[showUsd || !showRub ? 'USD/1M' : 'RUB/1M'] = Option.match(unit, {
      onNone: () => EM_DASH,
      onSome: value =>
        showUsd || Option.isNone(options.rate)
          ? Format.money(value, 4)
          : Format.money(toRub(value, options.rate.value), 4),
    })

    table[row.model] = cells
  }

  return table
}

/** Machine-readable form. Amounts stay decimal strings, never floats. */
export const toJson = (
  rows: ReadonlyArray<ModelTotals>,
  context: {
    readonly cycle: string
    readonly rate: Option.Option<CurrencyConverter.Rate>
  },
) => ({
  billingCycle: context.cycle,
  currency: 'USD',
  rate: Option.match(context.rate, {
    onNone: () => null,
    onSome: rate => ({
      rubPerUsd: Format.toPlainString(rate.rubPerUsd),
      source: rate.source,
      asOf: rate.asOf,
    }),
  }),
  models: rows.map(row => ({
    model: row.model,
    products: row.products,
    grossUsd: Format.toPlainString(row.gross),
    chargedUsd: Format.toPlainString(row.charged),
    grossRub: Option.match(context.rate, {
      onNone: () => null,
      onSome: rate => Format.toPlainString(toRub(row.gross, rate)),
    }),
    tokens: {
      input: Format.toPlainString(row.inputTokens),
      output: Format.toPlainString(row.outputTokens),
      cached: Format.toPlainString(row.cacheTokens),
      untyped: Format.toPlainString(row.otherTokens),
      total: Format.toPlainString(row.totalTokens),
    },
    usdPerMillionTokens: Option.match(perMillionTokens(row), {
      onNone: () => null,
      onSome: Format.toPlainString,
    }),
  })),
})
