import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Schema from 'effect/Schema'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import {
  PhysicalButtonIdData,
  PhysicalButtonNumberId,
} from './PhysicalButton.ts'

export type NoteId = Brand.Branded<
  PhysicalButtonNumberId,
  'MIDINoteId: integer in range 0-127'
>
export const NoteId = Brand.all(
  PhysicalButtonNumberId,
  Brand.check<NoteId>(
    Schema.isInt(),
    Schema.isBetween({ minimum: 0, maximum: 127 }),
  ),
)

export class NoteIdData extends Data.TaggedClass('next-midi-demo/NoteId')<{
  note: NoteId
}> {
  constructor(note: NoteId) {
    super({ note })
  }

  static makeUnsafe = (candidate: number) => new this(NoteId(candidate))
  static models = (candidate: unknown) => candidate instanceof this
}

export class NotePhysicalButtonData extends PhysicalButtonIdData<NoteIdData> {
  static override makeUnsafeFromData =
    makeUnsafeFromData<typeof NotePhysicalButtonData>()(NoteIdData)

  static makeUnsafe = (candidate: number) =>
    new this(NoteIdData.makeUnsafe(candidate))
}

export type Pressure = Brand.Branded<number, 'Pressure: integer in range 1-127'>
export const Pressure = Brand.check<Pressure>(
  Schema.isInt(),
  Schema.isBetween({ minimum: 1, maximum: 127 }),
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
