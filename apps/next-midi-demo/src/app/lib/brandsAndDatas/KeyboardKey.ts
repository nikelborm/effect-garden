import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Either from 'effect/Either'
import { flow } from 'effect/Function'
import * as Iterable from 'effect/Iterable'
import * as Option from 'effect/Option'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { PhysicalButtonId, PhysicalButtonIdData } from './PhysicalButton.ts'

export type NonPrintableKeyboardKeysUnion =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export const NonPrintableKeyboardKeys = new Set(
  Iterable.map(Iterable.fromRecord(NonPrintableKey), e => e[1]),
) as Set<NonPrintableKeyboardKeysUnion>

// ======================================================

export type KeyboardKey = Brand.Branded<PhysicalButtonId<string>, 'KeyboardKey'>
export const KeyboardKey = Brand.refined<KeyboardKey>(
  // `[...key].length === 1` check is needed to ensure length of string of 1
  // Unicode character instead of checking for it to be 1 byte that would be
  // returned by `.length`
  flow(
    PhysicalButtonId.either<string>,
    Either.flatMap(
      Either.liftPredicate(
        candidate =>
          NonPrintableKeyboardKeys.has(candidate as any) ||
          [...candidate].length === 1,
        notKey =>
          Brand.error(
            `Expected ${JSON.stringify(notKey)} to be either a valid non-printable key name, or a single unicode symbol`,
          ),
      ),
    ),
    Option.getLeft,
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
