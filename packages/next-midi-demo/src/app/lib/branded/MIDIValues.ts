import * as Brand from 'effect/Brand'

export type NoteId = Brand.Branded<number, 'MIDINoteId: integer in range 0-127'>
export const NoteId = Brand.refined<NoteId>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 0-127`),
)

export type Pressure = Brand.Branded<number, 'Pressure: integer in range 1-127'>
export const Pressure = Brand.refined<Pressure>(
  n => Number.isSafeInteger(n) && n > 0 && n < 128,
  n => Brand.error(`Expected ${n} to be an integer in range 1-127`),
)

export type NoteInitialVelocity = Brand.Branded<Pressure, 'NoteInitialVelocity'>
export const NoteInitialVelocity = Brand.all(
  Pressure,
  Brand.nominal<NoteInitialVelocity>(),
)

export type NoteCurrentPressure = Brand.Branded<Pressure, 'NoteCurrentPressure'>
export const NoteCurrentPressure = Brand.all(
  Pressure,
  Brand.nominal<NoteCurrentPressure>(),
)
