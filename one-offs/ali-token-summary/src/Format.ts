/**
 * Terminal number formatting.
 *
 * Two hard rules for every number this tool prints:
 *
 * 1. Never scientific notation. The amounts are genuinely tiny (a single
 *    request can cost 3.92e-5 USD) and `0.0000392` is the whole point.
 * 2. Digit groups separated by spaces, via the Intl API.
 *
 * `BigDecimal.format` cannot be used for rule 1: it falls back to
 * `toExponential` once the normalized scale reaches 16, which is easy to hit
 * after a currency multiplication. `toPlainString` below is exponent-free by
 * construction.
 */
import * as BigDecimal from 'effect/BigDecimal'

/** Substituted for whatever group separator the locale would have used. */
const GROUP_SEPARATOR = ' '

/**
 * Renders a BigDecimal as a plain positional decimal, whatever its scale.
 *
 * A BigDecimal is an integer `value` scaled by `10^-scale`, so this is pure
 * string surgery on the digits - no float ever materialises.
 */
export const toPlainString = (input: BigDecimal.BigDecimal): string => {
  // Normalising first keeps `0.002802` from printing as `0.0028020` once a sum
  // has widened the scale.
  const self = BigDecimal.normalize(input)
  const negative = self.value < 0n
  const sign = negative ? '-' : ''
  const digits = (negative ? -self.value : self.value).toString()

  // A negative scale means trailing zeroes were factored out of the integer.
  if (self.scale <= 0) return `${sign}${digits}${'0'.repeat(-self.scale)}`

  const padded = digits.padStart(self.scale + 1, '0')
  const point = padded.length - self.scale
  return `${sign}${padded.slice(0, point)}.${padded.slice(point)}`
}

const formatters = new Map<string, Intl.NumberFormat>()

const formatter = (
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): Intl.NumberFormat => {
  const key = `${minimumFractionDigits}:${maximumFractionDigits}`
  const cached = formatters.get(key)
  if (cached !== undefined) return cached
  const created = new Intl.NumberFormat('en-US', {
    notation: 'standard',
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  })
  formatters.set(key, created)
  return created
}

/**
 * Intl.NumberFormat (V3) accepts a decimal *string* and preserves every digit
 * of it, so the BigDecimal never has to be narrowed to a float on its way to
 * the screen. `formatToParts` is used purely to swap the locale's group
 * separator for a space.
 */
const render = (nf: Intl.NumberFormat, source: string): string =>
  nf
    .formatToParts(source as unknown as number)
    .map(part => (part.type === 'group' ? GROUP_SEPARATOR : part.value))
    .join('')

/** A currency amount, shown to at least 2 and at most `maxFractionDigits` places. */
export const money = (
  value: BigDecimal.BigDecimal,
  maxFractionDigits = 8,
): string =>
  render(formatter(2, Math.max(2, maxFractionDigits)), toPlainString(value))

/** A whole-number quantity such as a token count. */
export const count = (value: BigDecimal.BigDecimal): string =>
  render(
    formatter(0, 0),
    toPlainString(
      BigDecimal.round(value, { scale: 0, mode: 'half-from-zero' }),
    ),
  )

/** A plain decimal with a fixed number of places, used for currency conversion rates. */
export const fixed = (
  value: BigDecimal.BigDecimal,
  fractionDigits: number,
): string =>
  render(formatter(fractionDigits, fractionDigits), toPlainString(value))
