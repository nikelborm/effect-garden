import * as NonPrintableKey from 'ts-key-not-enum'

import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Either from 'effect/Either'
import { flow } from 'effect/Function'
import * as Option from 'effect/Option'
import * as Order from 'effect/Order'
import * as Tuple from 'effect/Tuple'

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

// ======================================================

export type RegisteredButtonID = Brand.Branded<
  string,
  'Registered button ID: non empty string'
>
export const RegisteredButtonID = Brand.refined<RegisteredButtonID>(
  id => !!id.length,
  () => Brand.error('Expected non empty string to make registered button id'),
)
export const RegisteredButtonIdOrder = Order.mapInput(
  Order.string,
  (a: RegisteredButtonID) => a,
)

// ======================================================

export type LayoutId = Brand.Branded<string, 'LayoutId: non empty string'>
export const LayoutId = Brand.refined<LayoutId>(
  id => id.length > 0,
  () => Brand.error(`Expected layout id to be non empty string`),
)

// ======================================================

export type ButtonAddressTupleUnbranded = readonly [
  buttonId: RegisteredButtonID,
  layoutId: LayoutId,
]
export type ButtonAddress = Brand.Branded<
  ButtonAddressTupleUnbranded,
  'ButtonAddress: a tuple of registered button id and layout id'
>
const ButtonAddressBrand = Brand.refined<ButtonAddress>(
  address =>
    Tuple.isTupleOf(address, 2) &&
    RegisteredButtonID.is(address[0]) &&
    LayoutId.is(address[1]),
  n => Brand.error(`Expected ${n} to be an address of a button`),
)

const makeButtonAddressEither = (
  ...candidateAddress: ButtonAddressTupleUnbranded
) => Either.map(ButtonAddressBrand.either(candidateAddress), Data.unsafeArray)

export const ButtonAddress = Object.assign(
  (...address: ButtonAddressTupleUnbranded) =>
    Data.unsafeArray(
      ButtonAddressBrand(address) as ButtonAddressTupleUnbranded,
    ),
  {
    either: makeButtonAddressEither,
    option: flow(makeButtonAddressEither, Option.getRight),
    is: (address: ButtonAddressTupleUnbranded): address is ButtonAddress =>
      Either.isRight(makeButtonAddressEither(...address)),
  },
)
