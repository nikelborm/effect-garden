import * as Data from 'effect/Data'
import * as Effect from 'effect/Effect'
import * as Order from 'effect/Order'
import * as Schema from 'effect/Schema'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import {
  AccordIndexSchema,
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

const allAccords = accords.map(
  (info, index) => new Accord({ ...info, index }),
) as unknown as AllAccordTuple

const mapIndexToAccord = (index: RecordedAccordIndexes) =>
  new Accord({ index, ...accords[index] }) as AllAccordUnion

export class AccordRegistry
  extends Effect.Service<AccordRegistry>()('next-midi-demo/AccordRegistry', {
    accessors: true,
    effect: Effect.map(
      SubscriptionRef.make<RecordedAccordIndexes>(0),
      currentAccordIndexRef => ({
        currentlyActiveAccord: Effect.map(
          SubscriptionRef.get(currentAccordIndexRef),
          mapIndexToAccord,
        ),
        allAccords: Effect.succeed(allAccords),
        activeAccordChanges: Stream.map(
          currentAccordIndexRef.changes,
          mapIndexToAccord,
        ),
        setActiveAccord: (accordIndex: RecordedAccordIndexes) => {
          const trustedIndex = Schema.decodeSync(AccordIndexSchema)(accordIndex)

          return SubscriptionRef.set(currentAccordIndexRef, trustedIndex)
        },
      }),
    ),
  })
  implements IAccordRegistry {}

interface IAccordRegistry {
  readonly currentlyActiveAccord: Effect.Effect<AllAccordUnion>
  readonly allAccords: Effect.Effect<AllAccordTuple>
  readonly activeAccordChanges: Stream.Stream<AllAccordUnion>
  readonly setActiveAccord: (
    patternIndex: RecordedAccordIndexes,
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
      Accord<Current['id'], Current['label'], RestLabels['length']>,
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

export class Accord<
  Id extends number = number,
  Label extends string = string,
  Index extends number = number,
> extends Data.TaggedClass('Accord')<
  AccordMiniInfo<Id, Label> & { readonly index: Index }
> {
  static models = (p: unknown): p is Accord =>
    typeof p === 'object' && p !== null && '_tag' in p && p._tag === 'Accord'
}

export const AccordOrderById = Order.mapInput(Order.number, (a: Accord) => a.id)
