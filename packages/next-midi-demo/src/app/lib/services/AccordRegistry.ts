import * as Effect from 'effect/Effect'
import * as Stream from 'effect/Stream'
import * as SubscriptionRef from 'effect/SubscriptionRef'

import type { RecordedAccordIndexes } from '../audioAssetHelpers.ts'

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

const allAccords = accords.map((info, index) => ({
  ...info,
  index,
})) as unknown as AllAccordTuple

const mapIndexToAccord = (index: RecordedAccordIndexes) =>
  ({ index, ...accords[index] }) as AllAccordUnion

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
        setActiveAccord: (accordIndex: RecordedAccordIndexes) =>
          SubscriptionRef.set(currentAccordIndexRef, accordIndex),
      }),
    ) as Effect.Effect<IAccordRegistry>,
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
  infer CurrLabel extends AccordMiniInfo,
]
  ? readonly [
      ..._AllAccordTuple<RestLabels>,
      Accord<CurrLabel['id'], CurrLabel['label'], RestLabels['length']>,
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

export interface Accord<
  Id extends number = number,
  Label extends string = string,
  Index extends number = number,
> extends AccordMiniInfo<Id, Label> {
  readonly index: Index
}
