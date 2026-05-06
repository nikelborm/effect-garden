import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'

import type { RecordedAccordIndexes } from '../audioAssetHelpers.ts'

export type AccordIndex<
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> = Brand.Branded<Index, 'AccordIndex: integer in range 0-7'>
export const AccordIndex = Brand.refined<AccordIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0-7`),
)

export class AccordIndexData<
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> extends Data.TaggedClass('next-midi-demo/AccordIndex')<{
  value: AccordIndex<Index>
}> {
  constructor(index: Index) {
    super({ value: AccordIndex(index) as AccordIndex<Index> })
  }
  static makeUnsafe = (index: number) =>
    new AccordIndexData(index as RecordedAccordIndexes)
}

export interface AccordMiniInfo<
  Id extends number = number,
  Label extends string = string,
> {
  readonly id: Id
  readonly label: Label
}

export class Accord<
  Id extends number = number,
  Label extends string = string,
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> extends Data.TaggedClass('next-midi-demo/Accord')<
  AccordMiniInfo<Id, Label> & { readonly index: AccordIndex<Index> }
> {
  static models = (p: unknown): p is Accord =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Accord'
}
