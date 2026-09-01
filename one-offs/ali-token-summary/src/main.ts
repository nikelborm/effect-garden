/**
 * `ali-summary` - per-model Alibaba Cloud Model Studio spend, at full precision.
 */
import * as BunHttpClient from '@effect/platform-bun/BunHttpClient'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import * as BigDecimal from 'effect/BigDecimal'
import * as Console from 'effect/Console'
import * as DateTime from 'effect/DateTime'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'
import * as Logger from 'effect/Logger'
import * as Option from 'effect/Option'
import * as References from 'effect/References'
import * as Schema from 'effect/Schema'
import * as Argument from 'effect/unstable/cli/Argument'
import * as Command from 'effect/unstable/cli/Command'
import * as Flag from 'effect/unstable/cli/Flag'

import * as packageJson from '../package.json'
import * as Aliyun from './Aliyun.ts'
import * as Bill from './Bill.ts'
import * as Credentials from './Credentials.ts'
import * as CurrencyConverter from './CurrencyConverter.ts'
import * as Format from './Format.ts'
import * as Report from './Report.ts'

const BillingCycle = Schema.String.pipe(
  Schema.check(
    Schema.isPattern(/^\d{4}-(0[1-9]|1[0-2])$/, {
      message: 'Expected a billing cycle of the form YYYY-MM, e.g. 2026-08',
    }),
  ),
)

const cycle = Argument.string('cycle').pipe(
  Argument.withDescription(
    'Billing cycle to report on, as YYYY-MM (default: the current month)',
  ),
  Argument.withSchema(BillingCycle),
  Argument.optional,
)

const currency = Flag.choice('currency', ['usd', 'rub', 'both']).pipe(
  Flag.withAlias('c'),
  Flag.withDescription('Which currency columns to print'),
  Flag.withDefault('rub'),
)

const product = Flag.string('product').pipe(
  Flag.withAlias('p'),
  Flag.withDescription(
    'Restrict the report to one product code (default: every product)',
  ),
  Flag.optional,
)

const transport = Flag.choice('transport', ['http', 'cli']).pipe(
  Flag.withDescription(
    'Reach the API directly, or shell out to the `aliyun` binary',
  ),
  Flag.withDefault('http'),
)

const json = Flag.boolean('json').pipe(
  Flag.withDescription('Emit the aggregate as JSON instead of a table'),
  Flag.withDefault(false),
)

const nonzero = Flag.boolean('nonzero').pipe(
  Flag.withDescription('Hide models that cost nothing this cycle'),
  Flag.withDefault(false),
)

/** The billing cycle containing "now", used when none is given. */
const currentCycle = Effect.map(DateTime.now, now =>
  DateTime.formatIsoDateUtc(now).slice(0, 7),
)

const command = Command.make(
  packageJson.name,
  { cycle, currency, product, transport, json, nonzero },
  Effect.fn(function* (input) {
    const billingCycle = Option.isSome(input.cycle)
      ? input.cycle.value
      : yield* currentCycle

    const bill = yield* Bill.Bill
    const currencyConverter = yield* CurrencyConverter.CurrencyConverter

    // The rate is a nicety, not a dependency: a report in dollars is still
    // worth printing when every financial exchange source is down.
    const rateEffect =
      input.currency === 'usd'
        ? Effect.succeed(Option.none<CurrencyConverter.Rate>())
        : currencyConverter.usdToRub.pipe(
            Effect.map(Option.some),
            Effect.catch(error =>
              Effect.logWarning(
                `No exchange rate available (${error.message}); showing USD only`,
              ).pipe(Effect.as(Option.none<CurrencyConverter.Rate>())),
            ),
          )

    const { items, rate } = yield* Effect.all(
      {
        items: Effect.provide(
          bill.instanceBill({
            cycle: billingCycle,
            productCode: input.product.pipe(Option.getOrUndefined),
          }),
          Credentials.layer,
          { local: true },
        ),
        rate: rateEffect,
      },
      { concurrency: 2 },
    )

    const all = Report.aggregate(items)
    const rows = input.nonzero
      ? all.filter(row => !BigDecimal.isZero(row.gross))
      : all

    if (input.json)
      return yield* Console.log(
        JSON.stringify(
          Report.toJson(rows, { cycle: billingCycle, rate: rate }),
          null,
          2,
        ),
      )

    if (rows.length === 0)
      return yield* Console.log(
        `No billed usage for ${billingCycle}.\n` +
          'Daily settlement lags by a few hours, so very recent calls may not have landed yet.',
      )

    yield* Console.log(
      `Alibaba Cloud Model Studio - billing cycle ${billingCycle}` +
        `  (via ${input.transport === 'cli' ? 'aliyun CLI' : 'signed HTTP'})`,
    )

    if (Option.isSome(rate)) {
      const line = `Rate: ${Format.fixed(rate.value.rubPerUsd, 4)} RUB/USD  (${rate.value.source}, ${rate.value.asOf})`
      yield* Console.log(line)
    }

    yield* Console.log('')
    yield* Console.table(
      Report.toTable([...rows, Report.totalOf(rows)], {
        currency: input.currency,
        rate: rate,
      }),
    )

    const total = Report.totalOf(rows)
    yield* Console.log(
      `\nGross ${Format.money(total.gross, 8)} USD` +
        (Option.isSome(rate)
          ? ` / ${Format.money(BigDecimal.multiply(total.gross, rate.value.rubPerUsd), 4)} RUB`
          : '') +
        `, of which ${Format.money(total.charged, 8)} USD is actually charged.`,
    )

    if (BigDecimal.isZero(total.charged) && !BigDecimal.isZero(total.gross))
      yield* Console.log(
        'Sub-cent totals are rounded down and waived, which is why the account balance still reads 0.00.',
      )
  }),
).pipe(
  Command.withDescription(
    'Report Alibaba Cloud Model Studio spend per model, at full precision',
  ),
  Command.provide(Bill.layer),
  // The one layer the command line chooses, so the one layer built fresh per
  // invocation and torn down with the handler.
  Command.provide(
    ({ transport }): Aliyun.AliyunApiLayer =>
      transport === 'cli' ? Aliyun.layerCli : Aliyun.layerHttp,
    { local: true },
  ),
)

const AppLayer = Credentials.layer.pipe(
  Layer.provideMerge(CurrencyConverter.layer),
  Layer.provideMerge(BunHttpClient.layer),
  Layer.provideMerge(BunServices.layer),
  // Both built-in loggers write to stdout by default, which would corrupt
  // `--json`. Logs are diagnostics, not output, so send them to stderr
  // always: nothing is dropped and stdout stays parseable.
  Layer.provideMerge(Layer.sync(References.LogToStderr, () => true)),
  Layer.provideMerge(Logger.layer([Logger.consolePretty()])),
)

command.pipe(
  Command.run({
    version: packageJson.version,
    renderErrors: true,
  }),
  Effect.provide(AppLayer),
  BunRuntime.runMain,
)
