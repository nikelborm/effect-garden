import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Iterable from 'effect/Iterable'

export type NonPrintableKeyboardKeysUnion =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export const NonPrintableKeyboardKeys = new Set(
  Iterable.map(Iterable.fromRecord(NonPrintableKey), e => e[1]),
) as Set<NonPrintableKeyboardKeysUnion>

// ======================================================

export type ValidKeyboardKey = Brand.Branded<string, 'ValidKeyboardKey'>
export const ValidKeyboardKey = Brand.refined<ValidKeyboardKey>(
  // the second check is needed to ensure length of string of 1 Unicode
  // character instead of checking for it to be 1 byte
  key => NonPrintableKeyboardKeys.has(key as any) || [...key].length === 1,
  key =>
    Brand.error(
      `Expected "${key}" to be either a valid non-printable key name, or a single unicode symbol`,
    ),
)

export class ValidKeyboardKeyData extends Data.TaggedClass('ValidKeyboardKey')<{
  value: ValidKeyboardKey
}> {
  constructor(key: string) {
    super({ value: ValidKeyboardKey(key) })
  }
}
