import * as Brand from 'effect/Brand'
import * as NonPrintableKey from 'ts-key-not-enum'

export type NonPrintableKeyboardKeys =
  (typeof NonPrintableKey)[keyof typeof NonPrintableKey]

export type ValidKeyboardKey = string & Brand.Brand<'ValidKeyboardKey'>

export const ValidKeyboardKey = Brand.refined<ValidKeyboardKey>(
  // the second check is needed to ensure length of string of 1 Unicode
  // character instead of checking for it to be 1 byte
  key => key in NonPrintableKey || [...key].length === 1,
  key =>
    Brand.error(
      `Expected "${key}" to be either a valid non-printable key name, or a single unicode symbol`,
    ),
)

export type MIDINoteId = number &
  Brand.Brand<'MIDINoteId: integer in range 0-127'>

export const MIDINoteId = Brand.refined<MIDINoteId>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 0-127`),
)

export type RegisteredButtonID = string &
  Brand.Brand<'Registered button ID: non empty string'>

export const RegisteredButtonID = Brand.refined<RegisteredButtonID>(
  id => !!id.length,
  () => Brand.error('Expected non empty string to make registered button id'),
)

export type Pressure = number & Brand.Brand<'Pressure: integer in range 1-127'>

export const Pressure = Brand.refined<Pressure>(
  n => Number.isSafeInteger(n) && n > 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 1-127`),
)

export type NoteInitialVelocity = Pressure & Brand.Brand<'NoteInitialVelocity'>
export const NoteInitialVelocity = Brand.all(
  Pressure,
  Brand.nominal<NoteInitialVelocity>(),
)

export type NoteCurrentPressure = Pressure & Brand.Brand<'NoteCurrentPressure'>
export const NoteCurrentPressure = Brand.all(
  Pressure,
  Brand.nominal<NoteCurrentPressure>(),
)

export type NotPressed = 0 & Brand.Brand<'Not pressed'>
export const NotPressed = 0 as NotPressed

export type Pressed = 1 & Brand.Brand<'Pressed'>
export const Pressed = 1 as Pressed

export type PressedContinuously = 2 & Brand.Brand<'Pressed continuously'>
export const PressedContinuously = 2 as PressedContinuously

export const isNotPressed = (state: number): state is NotPressed =>
  state === NotPressed

export const isPressed = (state: number): state is Pressed => state === Pressed

export const isPressedContinuously = (
  state: number,
): state is PressedContinuously => state === PressedContinuously
