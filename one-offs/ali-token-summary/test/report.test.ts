import { describe, expect, test } from '@effect/vitest'
import * as BigDecimal from 'effect/BigDecimal'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Option from 'effect/Option'
import type * as Schema from 'effect/Schema'

import * as Aliyun from '../src/Aliyun.ts'
import * as Bill from '../src/Bill.ts'
import * as Format from '../src/Format.ts'
import * as Report from '../src/Report.ts'
import * as Fixtures from './fixtures.ts'

const withPayload = (payload: Schema.Json) =>
  Bill.layer.pipe(
    Layer.provide(
      Layer.succeed(
        Aliyun.AliyunApi,
        Aliyun.AliyunApi.of({ call: () => Effect.succeed(payload) }),
      ),
    ),
  )

const fetchRows = (payload: Schema.Json) =>
  Bill.Bill.use(bill => bill.instanceBill({ cycle: '2026-08' })).pipe(
    Effect.map(Report.aggregate),
    Effect.provide(withPayload(payload)),
    Effect.runPromise,
  )

const payloadWith = (extra: ReadonlyArray<Schema.Json>) => ({
  ...Fixtures.describeInstanceBill,
  Data: {
    ...Fixtures.describeInstanceBill.Data,
    Items: [...Fixtures.describeInstanceBill.Data.Items, ...extra],
  },
})

const withMarketplace = payloadWith(Fixtures.marketplaceItems)

/** Narrowing lookups: a missing row is a test failure with a name attached. */
const rowAt = (
  rows: ReadonlyArray<Report.ModelTotals>,
  index: number,
): Report.ModelTotals => {
  const row = rows[index]
  if (row === undefined) throw new Error(`no row at index ${index}`)
  return row
}

const rowOf = (
  rows: ReadonlyArray<Report.ModelTotals>,
  model: string,
): Report.ModelTotals => {
  const row = rows.find(candidate => candidate.model === model)
  if (row === undefined) throw new Error(`no row for model ${model}`)
  return row
}

const tableRow = (table: Report.Table, model: string): Report.TableRow => {
  const row = table[model]
  if (row === undefined) throw new Error(`no table row for model ${model}`)
  return row
}

describe('attribute', () => {
  test('reads the model from the segment before the token type', () => {
    expect(
      Bill.attribute('1110389;ws-9h4296dos6ll46s2;glm-5.1;input_token;0', '?'),
    ).toEqual({
      model: 'glm-5.1',
      kind: 'input',
    })
  })

  test('is unaffected by the extra empty segment some models emit', () => {
    expect(
      Bill.attribute(
        '1110389;ws-9h4296dos6ll46s2;qwen3.8-flash;output_token;;0',
        '?',
      ),
    ).toEqual({
      model: 'qwen3.8-flash',
      kind: 'output',
    })
  })

  test('distinguishes cached input from fresh input', () => {
    expect(
      Bill.attribute('1110389;ws-x;qwen3.8-flash;input_token_cache;;0', '?')
        .kind,
    ).toBe('cache')
  })

  test('reads the vendor-qualified model a marketplace line states outright', () => {
    // The segment before the token type is `international`, not a model, so
    // the vendor-qualified segment has to win over positional reading.
    expect(
      Bill.attribute(
        '6000000200348;ZHIPU/GLM-5.3;1110389;ws-x;ap-southeast-1;international;output_tokens;intlcmgjllm10006104-KTokens-5',
        '?',
      ),
    ).toEqual({
      model: 'zhipu/glm-5.3',
      kind: 'output',
    })
  })

  test('accepts the plural token type marketplace lines use', () => {
    expect(
      Bill.attribute(
        '6000000200348;ZHIPU/GLM-5.3;1110389;ws-x;ap-southeast-1;international;input_tokens;c-KTokens-4',
        '?',
      ).kind,
    ).toBe('input')
  })

  test('keeps unrecognised instance ids rather than dropping the line', () => {
    expect(Bill.attribute('i-t4n8842xkq', 'Elastic Compute Service')).toEqual({
      model: 'i-t4n8842xkq',
      kind: 'other',
    })
  })

  test('labels a line by its product when it carries no instance id at all', () => {
    expect(Bill.attribute('', 'Elastic Compute Service').model).toBe(
      'Elastic Compute Service',
    )
  })
})

describe('aggregate', () => {
  test("sums a model's line items to the cent-exact gross", async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    const fast = rowOf(rows, 'glm-5.2-fast-preview')

    // 3.92e-5 input + 9.24e-4 output, matching QueryBillOverview's total for sfm.
    expect(Format.toPlainString(fast.gross)).toBe('0.0009632')
    expect(Format.toPlainString(fast.inputTokens)).toBe('14')
    expect(Format.toPlainString(fast.outputTokens)).toBe('105')
  })

  test('orders by spend, so the models that cost money come first', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    expect(rowAt(rows, 0).model).toBe('glm-5.2-fast-preview')
  })

  test('collapses every token type of one model into a single row', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    const qwen = rowOf(rows, 'qwen3.8-flash')
    expect(qwen.products).toEqual(['sfm'])
    expect(rows.filter(row => row.model === 'qwen3.8-flash')).toHaveLength(1)
  })

  test('carries marketplace lines through alongside Model Studio ones', async () => {
    const rows = await fetchRows(withMarketplace)
    const total = Report.totalOf(rows)

    // The most expensive model this cycle, and a marketplace one at that.
    const top = rowAt(rows, 0)
    expect(top.model).toBe('zhipu/glm-5.3')
    expect(top.products).toEqual(['mpintl-mt9-dt26'])

    // `KTokens` scales the same way `1K tokens` does, so the usage is typed
    // and counted rather than landing in the untyped column.
    expect(Format.toPlainString(top.inputTokens)).toBe('72')
    expect(Format.toPlainString(top.outputTokens)).toBe('395')
    expect(Format.toPlainString(top.otherTokens)).toBe('0')

    expect(Format.toPlainString(total.gross)).toBe('0.002802')
    expect(total.products).toEqual(['mpintl-mt9-dt26', 'sfm'])
  })

  test('counts usage from a line it cannot attribute as untyped', async () => {
    const rows = await fetchRows(payloadWith([Fixtures.opaqueItem]))
    const opaque = rowOf(rows, 'i-t4n8842xkq')

    // Hours are not tokens, so the usage passes through unscaled.
    expect(Format.toPlainString(opaque.otherTokens)).toBe('1')
    expect(opaque.products).toEqual(['ecs'])
  })
})

describe('formatting', () => {
  test('never falls back to scientific notation, whatever the scale', () => {
    // BigDecimal.format switches to an exponent once the scale reaches 16,
    // which a currency multiplication reaches easily.
    const awkward = BigDecimal.make(392n, 20)
    expect(BigDecimal.format(awkward)).toContain('e')
    expect(Format.toPlainString(awkward)).not.toContain('e')
    expect(Format.money(awkward, 12)).not.toContain('e')
  })

  test('separates digit groups with spaces', () => {
    expect(Format.count(BigDecimal.fromStringUnsafe('1234567'))).toBe(
      '1 234 567',
    )
    expect(Format.money(BigDecimal.fromStringUnsafe('1234.5'))).toBe('1 234.50')
  })

  test('keeps every significant digit of a sub-cent amount', () => {
    expect(Format.money(BigDecimal.fromStringUnsafe('0.0000392'), 8)).toBe(
      '0.0000392',
    )
  })
})

describe('derived figures', () => {
  test('prices a model per million tokens from its own usage', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    const fast = rowOf(rows, 'glm-5.2-fast-preview')
    const perMillion = Report.perMillionTokens(fast)

    // 0.0009632 USD over 119 tokens.
    expect(Format.money(Option.getOrThrow(perMillion), 2)).toBe('8.09')
  })

  test('reports no unit price for a model with no metered usage', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    const idle = rowOf(rows, 'kimi-k3')
    expect(Option.isNone(Report.perMillionTokens(idle))).toBe(true)
  })

  test('converts to roubles by exact decimal multiplication', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    const table = Report.toTable([Report.totalOf(rows)], {
      currency: 'both',
      rate: Option.some({
        rubPerUsd: BigDecimal.fromStringUnsafe('85.6007'),
        source: 'CBR',
        asOf: '2026-08-29T11:30:00+03:00',
      }),
    })

    const total = tableRow(table, 'TOTAL')

    expect(total.USD).toBe('0.0009632')
    expect(total.RUB).toBe('0.082451')
  })

  test('caps derived figures at six decimal places', async () => {
    const rows = await fetchRows(Fixtures.describeInstanceBill)
    // 0.0009632 USD over 119 tokens is a non-terminating quotient, which the
    // JSON output once carried to a hundred digits.
    const report = Report.toJson(rows, {
      cycle: '2026-08',
      rate: Option.some({
        rubPerUsd: BigDecimal.fromStringUnsafe('85.6007'),
        source: 'CBR',
        asOf: '2026-08-29T11:30:00+03:00',
      }),
    })

    const fast = report.models.find(
      model => model.model === 'glm-5.2-fast-preview',
    )

    expect(fast?.usdPerMillionTokens).toBe('8.094118')
    expect(fast?.grossRub).toBe('0.082451')
  })
})
