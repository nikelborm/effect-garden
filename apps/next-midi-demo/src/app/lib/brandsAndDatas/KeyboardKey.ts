import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Iterable from 'effect/Iterable'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { PhysicalButtonIdData } from './PhysicalButton.ts'

export type NonPrintableKeyboardKeysUnion =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export const NonPrintableKeyboardKeys = new Set(
  Iterable.map(Iterable.fromRecord(NonPrintableKey), e => e[1]),
) as Set<NonPrintableKeyboardKeysUnion>

// ======================================================

export type KeyboardKey = Brand.Branded<string, 'KeyboardKey'>
export const KeyboardKey = Brand.refined<KeyboardKey>(
  // the second check is needed to ensure length of string of 1 Unicode
  // character instead of checking for it to be 1 byte
  key => NonPrintableKeyboardKeys.has(key as any) || [...key].length === 1,
  key =>
    Brand.error(
      `Expected ${JSON.stringify(key)} to be either a valid non-printable key name, or a single unicode symbol`,
    ),
)

export class KeyboardKeyData extends Data.TaggedClass(
  'next-midi-demo/KeyboardKey',
)<{ key: KeyboardKey }> {
  constructor(key: KeyboardKey) {
    super({ key })
  }

  static makeUnsafe = (key: string) => new this(KeyboardKey(key))
  static models = (key: unknown) => key instanceof this
}

export class KeyboardKeyPhysicalButtonData extends PhysicalButtonIdData<KeyboardKeyData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof KeyboardKeyPhysicalButtonData>()(KeyboardKeyData)

  static makeUnsafe = (key: string) => new this(KeyboardKeyData.makeUnsafe(key))
}
