import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Either from 'effect/Either'
import { flow } from 'effect/Function'
import * as Option from 'effect/Option'

import { makeUnsafeFromData } from '../helpers/makeUnsafeFromData.ts'
import { PhysicalButtonId, PhysicalButtonIdData } from './PhysicalButton.ts'

export type NoteId = Brand.Branded<
  PhysicalButtonId<number>,
  'MIDINoteId: integer in range 0-127'
>
export const NoteId = Brand.refined<NoteId>(
  flow(
    PhysicalButtonId.either<number>,
    Either.flatMap(
      Either.liftPredicate(
        n => Number.isSafeInteger(n) && n >= 0 && n < 128,
        n =>
          Brand.error(
            `Expected ${JSON.stringify(n)} to be an integer in range 0-127`,
          ),
      ),
    ),
    Option.getLeft,
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
