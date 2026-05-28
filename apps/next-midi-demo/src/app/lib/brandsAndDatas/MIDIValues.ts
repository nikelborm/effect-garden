import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { PhysicalButtonIdData } from './PhysicalButton.ts'

export type NoteId = Brand.Branded<number, 'MIDINoteId: integer in range 0-127'>
export const NoteId = Brand.refined<NoteId>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 128,
  n =>
    Brand.error(
      `Expected ${JSON.stringify(n)} to be an integer in range 0-127`,
    ),
)

export class NoteIdData extends Data.TaggedClass('next-midi-demo/NoteId')<{
  note: NoteId
}> {
  constructor(note: NoteId) {
    super({ note })
  }

  static makeUnsafe = (note: number) => new this(NoteId(note))
  static models = (note: unknown) => note instanceof this
}

export class NotePhysicalButtonData extends PhysicalButtonIdData<NoteIdData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof NotePhysicalButtonData>()(NoteIdData)

  static makeUnsafe = (note: number) => new this(NoteIdData.makeUnsafe(note))
}

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
