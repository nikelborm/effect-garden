# ali_summary

Per-model Alibaba Cloud Model Studio spend, at full precision, in USD and RUB.

`QueryAccountBalance` rounds everything to two decimal places, so a month of
cheap model calls reads as `0.00`. This reports the number underneath that.

```bash
bun install
bun run index.ts             # current billing cycle
bun run index.ts 2026-08     # a specific cycle
```

Roubles are the default currency, since that is what the account is settled in:

```
Alibaba Cloud Model Studio - billing cycle 2026-08  (via signed HTTP)
Rate: 85.6034 RUB/USD  (CBR, 2026-09-01T11:30:00+03:00)

┌──────────────────────┬──────────────────────┬────┬─────┬────────┬──────────┬──────────┐
│                      │ product              │ in │ out │ cached │ RUB      │ RUB/1M   │
├──────────────────────┼──────────────────────┼────┼─────┼────────┼──────────┼──────────┤
│        zhipu/glm-5.3 │ mpintl-mt9-dt26      │ 72 │ 395 │ 0      │ 0.157408 │ 337.0611 │
│ glm-5.2-fast-preview │ sfm                  │ 14 │ 105 │ 0      │ 0.082453 │ 692.884  │
│    deepseek-v4-flash │ sfm                  │ 0  │ 0   │ 0      │ 0.00     │ —        │
│              glm-5.1 │ sfm                  │ 0  │ 0   │ 0      │ 0.00     │ —        │
│              glm-5.2 │ sfm                  │ 0  │ 0   │ 0      │ 0.00     │ —        │
│              kimi-k3 │ sfm                  │ 0  │ 0   │ 0      │ 0.00     │ —        │
│        qwen3.8-flash │ sfm                  │ 0  │ 0   │ 0      │ 0.00     │ —        │
│                TOTAL │ mpintl-mt9-dt26, sfm │ 86 │ 500 │ 0      │ 0.239861 │ 409.3186 │
└──────────────────────┴──────────────────────┴────┴─────┴────────┴──────────┴──────────┘

Gross 0.002802 USD / 0.2399 RUB, of which 0.002802 USD is actually charged.
```

`-c both` adds the dollar columns back, and prices the blended per-million rate
in USD; `--nonzero` drops the models that were not used this cycle:

```
$ bun run index.ts 2026-08 -c both --nonzero
┌──────────────────────┬──────────────────────┬────┬─────┬────────┬───────────┬──────────┬────────┐
│                      │ product              │ in │ out │ cached │ USD       │ RUB      │ USD/1M │
├──────────────────────┼──────────────────────┼────┼─────┼────────┼───────────┼──────────┼────────┤
│        zhipu/glm-5.3 │ mpintl-mt9-dt26      │ 72 │ 395 │ 0      │ 0.0018388 │ 0.157408 │ 3.9375 │
│ glm-5.2-fast-preview │ sfm                  │ 14 │ 105 │ 0      │ 0.0009632 │ 0.082453 │ 8.0941 │
│                TOTAL │ mpintl-mt9-dt26, sfm │ 86 │ 500 │ 0      │ 0.002802  │ 0.239861 │ 4.7816 │
└──────────────────────┴──────────────────────┴────┴─────┴────────┴───────────┴──────────┴────────┘
```

## Flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `[cycle]` | current month | Billing cycle, `YYYY-MM` |
| `--currency, -c` | `rub` | `usd`, `rub`, or `both` |
| `--product, -p` | every product | Restrict to one product code |
| `--transport` | `http` | `http` signs requests directly; `cli` shells out to `aliyun` |
| `--json` | off | Machine-readable output; amounts stay decimal strings |
| `--nonzero` | off | Hide models that cost nothing this cycle |

Only one money column is priced per million tokens: `USD/1M` whenever dollars
are shown, `RUB/1M` when the report is roubles-only. With `-c usd` no exchange
rate is fetched at all.

## Credentials

`ALIBABA_CLOUD_ACCESS_KEY_ID` and `ALIBABA_CLOUD_ACCESS_KEY_SECRET` are
preferred. When absent, missing entries fall back to the password store:

```
pass show alibabacloud.com/vova/access_key_id
pass show alibabacloud.com/vova/access_key_secret
```

Whichever source wins, the pair is held to the same shape: an id of `LTAI`
plus 20 alphanumerics, and a secret of exactly 30 alphanumerics. Pre-`LTAI`
16-character keys and STS session credentials are rejected outright rather
than being sent and failing at the service.

The `aliyun` binary is not required. Requests are signed locally (Signature
Version 1.0, HMAC-SHA1) and sent straight to `business.ap-southeast-1.aliyuncs.com`.
`--transport cli` remains as a fallback.

## Notes on the numbers

- **`PretaxGrossAmount` is the real figure.** Alibaba computes the sub-cent
  amount, then rounds it down and discounts the remainder away, which is why the
  account balance stays at `0.00`. The report shows gross and charged separately.
- **The model name lives in `InstanceID`**, written two ways. Model Studio
  (`sfm`) uses `owner;workspace;model;token_type;…`, while Marketplace
  (`mpintl-*`), which resells third-party models, uses
  `order;VENDOR/MODEL;owner;workspace;region;channel;token_types;commodity` —
  the model stated outright and the token type pluralised. Neither segment
  count is stable, so the token type is found by pattern and the model is
  either the vendor-qualified segment or the one before the token type.
  Marketplace models keep their vendor (`zhipu/glm-5.3`) so a resold model
  never merges with a first-party one of the same name, and are lower-cased to
  match the rest of the column. Lines from products that do not bill for
  inference at all keep their raw identifier and have their usage counted as
  `untyped` rather than being dropped. That column only appears when some line
  actually produced untyped usage.
- **Scientific notation never reaches the screen.** Amounts arrive as `3.92E-5`,
  and `BigDecimal.format` itself switches to exponential at scale 16, so
  `Format.toPlainString` renders positionally and `Intl.NumberFormat` groups
  digits with spaces.
- **Derived figures are rounded to six places.** A division carries
  BigDecimal's full working precision — the blended price of 119 tokens came
  out a hundred digits long — and nothing past the sixth place is real, since
  the bill is quoted to eight and the exchange rate to four. The rounding
  happens once, so the table and the JSON quote the same number.
- **The financial exchange rate is Central Bank of Russia**, which is the
  reference rate for anything denominated in roubles but publishes on business
  days only. `open.er-api.com` stands in if CBR is unreachable, and if both are
  down the report still prints in USD.
- **Token counts are metered in thousands**, spelled `1K tokens` by Model
  Studio and `KTokens` by Marketplace. Both are scaled to whole tokens; any
  other unit passes through unscaled rather than being misreported.
- **Bills settle with a lag** of a few hours, so very recent calls may not appear.
- **Logs go to stderr**, always, so `--json` leaves stdout parseable.

## Development

```bash
bun run test      # vitest; includes Alibaba's documented signature test vector
bun run lint      # biome check --write --unsafe
bun run build     # tsc (TypeScript 7) into dist/, then a minified rollup bundle
```

`bun test` does not work here: bun's own runner cannot load `@effect/vitest`.
Go through the script.
