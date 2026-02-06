import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Order from 'effect/Order'

export type NonPrintableKeyboardKeys =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

// ======================================================

export type ValidKeyboardKey = Brand.Branded<string, 'ValidKeyboardKey'>
export const ValidKeyboardKey = Brand.refined<ValidKeyboardKey>(
  // the second check is needed to ensure length of string of 1 Unicode
  // character instead of checking for it to be 1 byte
  key => key in NonPrintableKey || [...key].length === 1,
  key =>
    Brand.error(
      `Expected "${key}" to be either a valid non-printable key name, or a single unicode symbol`,
    ),
)
export const ValidKeyboardKeyOrder = Order.mapInput(
  Order.string,
  (a: ValidKeyboardKey) => a,
)
