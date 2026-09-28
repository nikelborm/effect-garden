import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Iterable from 'effect/Iterable'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import {
  PhysicalButtonIdData,
  PhysicalButtonStringId,
} from './PhysicalButton.ts'

export type NonPrintableKeyboardKeysUnion =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export const NonPrintableKeyboardKeys = new Set(
  Iterable.map(Iterable.fromRecord(NonPrintableKey), e => e[1]),
) as Set<NonPrintableKeyboardKeysUnion>

// ======================================================

export type KeyboardKey = Brand.Branded<PhysicalButtonStringId, 'KeyboardKey'>
export const KeyboardKey = Brand.all(
  PhysicalButtonStringId,
  Brand.make<Brand.Branded<string, 'KeyboardKey'>>(
    // `[...key].length === 1` check is needed to ensure length of string of 1
    // Unicode character instead of checking for it to be 1 byte that would be
    // returned by `.length`
    candidate =>
      NonPrintableKeyboardKeys.has(candidate as any) ||
      [...candidate].length === 1 ||
      `Expected ${JSON.stringify(candidate)} to be either a valid non-printable key name, or a single unicode symbol`,
  ),
)

export class KeyboardKeyData extends Data.TaggedClass(
  'next-midi-demo/KeyboardKey',
)<{ key: KeyboardKey }> {
  constructor(key: KeyboardKey) {
    super({ key })
  }

  static makeUnsafe = (candidate: string) => new this(KeyboardKey(candidate))
  static models = (candidate: unknown) => candidate instanceof this
}

export class KeyboardKeyPhysicalButtonData extends PhysicalButtonIdData<KeyboardKeyData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof KeyboardKeyPhysicalButtonData>()(KeyboardKeyData)

  static makeUnsafe = (candidate: string) =>
    new this(KeyboardKeyData.makeUnsafe(candidate))
}
