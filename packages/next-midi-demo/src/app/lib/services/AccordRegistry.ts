import * as Brand from 'effect/Brand'
import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  AccordIndexSchema,
  decodeAccordIndexSync,
  type RecordedAccordIndexes,
} from '../audioAssetHelpers.ts'

const accords = [
  { id: 24, label: 'C' },
  { id: 25, label: 'Dm' },
  { id: 27, label: 'Em' },
  { id: 29, label: 'F' },
  { id: 31, label: 'G' },
  { id: 32, label: 'Am' },
  { id: 26, label: 'D' },
  { id: 28, label: 'E' },
] as const

export type AccordIndex<
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> = Brand.Branded<Index, 'AccordIndex: integer in range 0-7'>
export const AccordIndex = Brand.refined<AccordIndex>(
  n => Number.isSafeInteger(n) && n >= 0 && n < 8,
  n => Brand.error(`Expected ${n} to be an integer in range 0-7`),
)

export class AccordIndexData<
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> extends Data.TaggedClass('AccordIndex')<{
  value: AccordIndex<Index>
}> {
  constructor(index: number) {
    super({
      value: AccordIndex(index as RecordedAccordIndexes) as AccordIndex<Index>,
    })
  }
}

export const AccordIndexDataOrder = Order.mapInput(
  Order.number,
  (a: AccordIndexData) => a.value,
)

export class Accord<
  Id extends number = number,
  Label extends string = string,
  Index extends RecordedAccordIndexes = RecordedAccordIndexes,
> extends Data.TaggedClass('Accord')<
  AccordMiniInfo<Id, Label> & { readonly index: AccordIndex<Index> }
> {
  static models = (p: unknown): p is Accord =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Accord'
}

const allAccords = accords.map(
  (info, index) =>
    new Accord({ ...info, index: AccordIndex(index as RecordedAccordIndexes) }),
) as unknown as AllAccordTuple

const mapIndexToAccord = (index: RecordedAccordIndexes) =>
  new Accord({ index: AccordIndex(index), ...accords[index] }) as AllAccordUnion

export class AccordRegistry
  extends Effect.Service<AccordRegistry>()('next-midi-demo/AccordRegistry', {
    accessors: true,
    scoped: Effect.gen(function* () {
      const currentAccordIndexRef =
        yield* SubscriptionRef.make<RecordedAccordIndexes>(0)

      const selectedAccordChanges = yield* currentAccordIndexRef.changes.pipe(
        Stream.changes,
        Stream.rechunk(1),
        Stream.map(mapIndexToAccord),
        Stream.broadcastDynamic({ capacity: 'unbounded', replay: 1 }),
      )

      return {
        currentlySelectedAccord: Effect.map(
          currentAccordIndexRef.get,
          mapIndexToAccord,
        ),
        allAccords: Effect.succeed(allAccords),
        selectedAccordChanges,
        selectAccord: (accordIndex: RecordedAccordIndexes) => {
          const trustedIndex = decodeAccordIndexSync(accordIndex)

          return SubscriptionRef.set(currentAccordIndexRef, trustedIndex)
        },
        getAccordByIndex: (accordIndex: RecordedAccordIndexes) =>
          allAccords[decodeAccordIndexSync(accordIndex)],
      }
    }),
  })
  implements IAccordRegistry {}

interface IAccordRegistry {
  readonly currentlySelectedAccord: Effect.Effect<AllAccordUnion>
  readonly allAccords: Effect.Effect<AllAccordTuple>
  readonly selectedAccordChanges: Stream.Stream<AllAccordUnion>
  readonly selectAccord: (
    accordIndex: RecordedAccordIndexes,
  ) => Effect.Effect<void>
}

type _AllAccordTuple<
  Labels extends readonly AccordMiniInfo[] = typeof accords,
> = Labels extends readonly [
  ...infer RestLabels extends readonly AccordMiniInfo[],
  infer Current extends AccordMiniInfo,
]
  ? readonly [
      ..._AllAccordTuple<RestLabels>,
      Accord<
        Current['id'],
        Current['label'],
        Extract<RestLabels['length'], RecordedAccordIndexes>
      >,
    ]
  : readonly []

export type AllAccordTuple = _AllAccordTuple

export type AllAccordUnion = AllAccordTuple[number]

export interface AccordMiniInfo<
  Id extends number = number,
  Label extends string = string,
> {
  readonly id: Id
  readonly label: Label
}

export const AccordOrderByIndex = Order.mapInput(
  Order.number,
  (a: Accord) => a.index,
)
